import {Meteor} from 'meteor/meteor';
import {check, Match} from 'meteor/check';
import {Profile} from '../../../both/models/profile.model';
import { Random } from 'meteor/random';
import { Email } from 'meteor/email';
import {AllCollections} from "../../../both/collections";
import {TransactionModel} from "../../../both/models/transaction.model";
const {client} = MongoInternals.defaultRemoteCollectionDriver().mongo;
import {Promise as MPromise} from 'meteor/promise';
import * as funcs from "../../../both/functions/common";
import * as RawFunctions from './rawFunctions';

const nonEmptyString = Match.Where((str) => {
  check(str, String);
  return str.length > 0;
});

Meteor.methods(
  {
    async updateProductionOrderStatus(productionOrder, logId, tenantId) {
      const session = client.startSession({mode: 'primary'});
      session.startTransaction();

      let update = {
        $set: {
          status: productionOrder.status
        }
      };


      let transaction:TransactionModel = {
        _id: Random.id(),
        collectionName: "products",
        type: "InventoryTransactions",
        tenantId: tenantId,
        number: "",
        date: new Date(),
        status: "",
        notes: [],
        createdAt: new Date(),
        lineItems: [],
        documentId: '',
        createdUserId: Meteor.userId()
      };
      let passed = true;

      // 1. update production order status
      let oldProductionOrder = MPromise.await(AllCollections['productionOrders'].rawCollection().findOne({_id: productionOrder._id}));
      await AllCollections['productionOrders'].rawCollection().update({_id: productionOrder._id}, update, {session});

      // log status change
      let logQuery = {
        _id: logId
      };
      let fieldPath = 'status_string';
      let logUpdate = {
        $push: {
          actions: {
            _id: Random.id(),
            type: "update",
            fieldPath,
            createdAt: new Date(),
            log: `Change prodution order status`,
            documentId: productionOrder._id,
            collectionName: "productionOrders",
            value: productionOrder.status,
            previousValue: oldProductionOrder.status
          }
        }
      };
      MPromise.await(RawFunctions.update('systemLogs', logQuery, logUpdate, {session}));


      const ids = productionOrder.lineItems.map(_lineItem => _lineItem.productId);

      const products:any = Meteor.call('find', "products", {_id: {$in: ids}});
      let workOrderOptions = await AllCollections["systemOptions"].rawCollection().findOne({name: "workOrderOptions"});
      let enableInventoryTransfer = workOrderOptions.value.enableInventoryTransfer;

      console.log('enableInventoryTransfer', enableInventoryTransfer);
      const stagingBinId = workOrderOptions.value.stagingBinId;
      const productionBinId = workOrderOptions.value.productionBinId;

      if (productionOrder.status == 'Staged') {
        let i = 0;
        while(i < productionOrder.lineItems.length) {
          try {
            const _lineItem = productionOrder.lineItems[i];
            let CPCwarehouseId = "XZS76uMBAx3nLuqRu";
            const {hasWarehouse, hasBin} =_checkHasWarehouse(products, _lineItem.productId, CPCwarehouseId, stagingBinId);

            let findProduct = products.find(_product => _product._id == _lineItem.productId);

            if (_lineItem.warehouseBinId != stagingBinId) {
              let query = {
                _id: _lineItem.productId,
                "warehouses._id": _lineItem.warehouseId,
              };
              let update:any = {
                $inc: {
                  "warehouses.$[].bins.$[bin].qtyOnHand": new Decimal(_lineItem.qtyToPick * -1)
                }
              };
              let options:any = {
                arrayFilters: [
                  {
                    "bin._id": _lineItem.warehouseBinId
                  }
                ],
                session
              };

              // 2. update product's bin qty

              if (enableInventoryTransfer) {
                await AllCollections['products'].rawCollection().update(query, update, options);
              }
              // 2.1 insert log for product bin

              let logQuery = {
                _id: logId
              };

              let fieldPath = `warehouses_${_lineItem.warehouseId}.bins_${_lineItem.warehouseBinId}.qty_number`;
              let logUpdate = {
                $push: {
                  actions: {
                    _id: Random.id(),
                    type: "update",
                    fieldPath,
                    createdAt: new Date(),
                    log: `Move product (${findProduct.name}, ${findProduct._id}) qty ${_lineItem.qtyToPick} out from bin ${_lineItem.warehouseBinId}`,
                    documentId: _lineItem._id,
                    collectionName: "products",
                  }
                }
              };

              await AllCollections["systemLogs"].rawCollection().update(logQuery, logUpdate, {session});


              // 2.2 Insert system syncs for product bin

              let syncDoc = {
                _id: Random.id(),
                createdAt: new Date(),
                createdUserId: Meteor.userId(),
                fieldPath,
                collectionName: "products",
                type: "UPDATE"
              };

              await AllCollections["systemSyncs"].rawCollection().insert(syncDoc, {session});

              // insert product transactions

              transaction.lineItems.push({
                _id: Random.id(),
                productId: _lineItem.productId,
                binId: _lineItem.warehouseBinId,
                qty: _lineItem.qtyToPick * -1,
                cost: new Decimal(_lineItem.cost),
              });
              transaction.lineItems.push({
                _id: Random.id(),
                productId: _lineItem.productId,
                binId: stagingBinId,
                qty: _lineItem.qtyToPick,
                cost: new Decimal(_lineItem.cost),
              });

              //
              query = {
                _id: _lineItem.productId,
                "warehouses._id": "XZS76uMBAx3nLuqRu",
              };

              if (hasWarehouse && hasBin) {
                update = {
                  $inc: {
                    "warehouses.$[].bins.$[bin].qtyOnHand": new Decimal(_lineItem.qtyToPick)
                  }
                };
              } else if (hasWarehouse && !hasBin) {
                update = {
                  $push: {
                    "warehouses.$.bins": {
                      "_id" : stagingBinId,
                      "qtyOnHand" : new Decimal(_lineItem.qtyToPick),
                      "lastReceiptDate" : new Date()
                    }
                  }
                };
                options = {session};
              } else if (!hasWarehouse) {
                options = {session};
                update = {
                  $push: {
                    "warehouses": {
                      _id: "XZS76uMBAx3nLuqRu",
                      "primaryBinId" : stagingBinId,
                      bins: [
                        {
                          "_id" : stagingBinId,
                          "qtyOnHand" : new Decimal(_lineItem.qtyToPick),
                          "lastReceiptDate" : new Date()
                        }
                      ]
                    }
                  }
                }
              }

              // 3. update product's CPC bin qty

              if (enableInventoryTransfer) {
                await AllCollections['products'].rawCollection().update(query, update, options);
              }


              // 3.1 insert log for product cpc bin

              logQuery = {
                _id: logId
              };

              fieldPath = `warehouses_XZS76uMBAx3nLuqRu.bins_${stagingBinId}.qty_number`;
              logUpdate = {
                $push: {
                  actions: {
                    _id: Random.id(),
                    type: "UPDATE",
                    fieldPath,
                    createdAt: new Date(),
                    log: `Move product (${findProduct.name}) qty ${_lineItem.qtyToPick} into bin(${stagingBinId}) CPC`,
                    documentId: _lineItem._id,
                    collectionName: "products",
                  }
                }
              };

              await AllCollections["systemLogs"].rawCollection().update(logQuery, logUpdate, {session});

              // 3.2 Insert system syncs for product CPC bin

              syncDoc = {
                _id: Random.id(),
                createdAt: new Date(),
                createdUserId: Meteor.userId(),
                fieldPath,
                collectionName: "products",
                type: "UPDATE"
              };
              await AllCollections["systemSyncs"].rawCollection().insert(syncDoc, {session});
            } else {

              // if the product is in bin cpc, don't do anything
            }
          } catch (error) {
            console.log('error', error);
            passed = true;
            break;
          }
          i++;
        }


      } else if (productionOrder.status == 'Complete') {


        let productId = productionOrder.productId;


        // complete all related production runs
        // let productionRuns = await AllCollections["productionRuns"].rawCollection().find({productionOrderId: productionOrder._id}).toArray();
        let productionRuns = Meteor.call('find', 'productionRuns', {productionOrderId: productionOrder._id});
        MPromise.awaitAll(productionRuns.map(_run => {
          let query = {
            _id: _run._id
          };
          let update:any = {
            $set: {
              status: "Complete"
            }
          };
          switch (_run.status) {
            case 'Running': case 'Paused':
              update = {
                $set: {
                  status: 'Complete'
                }
              };
              return AllCollections["productionRuns"].rawCollection().update(query, update, {session});
            case 'New':
              // cancel new run
              update = {
                $set: {
                  status: 'Canceled'
                }
              };
              return AllCollections["productionRuns"].rawCollection().update(query, update, {session});
          }
        }))

        MPromise.awaitAll(productionOrder.lineItems.map(_lineItem => {

          // lineItem == product, find primary bin
          let findProduct = products.find(_product => _product._id == productId);

          // Move lineItem to primary bin ( or RCV bin) from staging bin
          let query = {
            _id: _lineItem.productId,
            "warehouses._id": "XZS76uMBAx3nLuqRu",
          };
          let update:any = {
            $inc: {
              "warehouses.$[].bins.$[bin].qtyOnHand": new Decimal(_lineItem.qtyToPick * -1)
            }
          };

          let options:any =  {
            arrayFilters: [
              {
                "bin._id": stagingBinId
              }
            ],
            session
          };


          if (enableInventoryTransfer) {
            MPromise.await(AllCollections['products'].rawCollection().update(query, update, options));
          }

          if (_lineItem.productId == productId) {

            let findWarehouse = findProduct.warehouses.find(_warehouse => _warehouse._id == "TXdApe769yDuskww8");
            let primaryBindId = findWarehouse.primaryBinId;

            // add qty to primary bin
            let binId = primaryBindId ? primaryBindId: productionBinId;

            const {hasWarehouse, hasBin} =_checkHasWarehouse(products, _lineItem.productId, "TXdApe769yDuskww8", binId);

            query = {
              _id: _lineItem.productId,
              "warehouses._id": "TXdApe769yDuskww8"
            };

            update = {
              $inc: {
                "warehouses.$[].bins.$[bin].qtyOnHand": new Decimal(_lineItem.qtyToPick * 1)
              }
            };

            options =  {
              arrayFilters: [
                {
                  "bin._id": binId
                }
              ],
              session
            };

            if (hasWarehouse && hasBin) {
              update = {
                $inc: {
                  "warehouses.$[].bins.$[bin].qtyOnHand": new Decimal(_lineItem.qtyToPick)
                }
              };
            } else if (hasWarehouse && !hasBin) {
              update = {
                $push: {
                  "warehouses.$.bins": {
                    "_id" : binId,
                    "qtyOnHand" : new Decimal(_lineItem.qtyToPick),
                    "lastReceiptDate" : new Date()
                  }
                }
              };
              options = {session};
            } else if (!hasWarehouse) {
              options = {session};
              update = {
                $push: {
                  "warehouses": {
                    _id: "TXdApe769yDuskww8",
                    "primaryBinId" : null,
                    bins: [
                      {
                        "_id" : binId,
                        "qtyOnHand" : new Decimal(_lineItem.qtyToPick),
                        "lastReceiptDate" : new Date()
                      }
                    ]
                  }
                }
              }
            }
            if (enableInventoryTransfer) {
              MPromise.await(AllCollections['products'].rawCollection().update(query, update, options));
            }
          }
          return true;

        }))
      }





      // find all products

      await AllCollections['transactions'].rawCollection().insert(transaction);

      await session.commitTransaction();
      session.endSession();
      return passed;
    },
    completeRun(run, systemLog, enableCompleteOrder) {
      const session = client.startSession({mode: 'primary'});
      session.startTransaction();

      let update = {
        $set: {
          status: "Complete"
        }
      };
      let passed = true;
      try {

        let logQuery = {
          _id: systemLog._id
        };

        let fieldPath = `status_string`;

        updateRunStatus(run, systemLog, session);

        if (enableCompleteOrder == true) {
          // 1. find production order and complete
          // MPromise.await(AllCollections["productionOrders"].rawCollection().update({_id: run.productionOrderId}, update, {session: testSession}));
          MPromise.await(RawFunctions.update("productionOrders", {_id: run.productionOrderId}, update, {session}));

          // log complete production order

          fieldPath = `status_string`;
          let logUpdate = {
            $push: {
              actions: {
                _id: Random.id(),
                type: "UPDATE",
                fieldPath,
                createdAt: new Date(),
                log: `Change production order ${run.productionOrderId} status`,
                documentId: run.productionOrderId,
                collectionName: "productionOrders",
              }
            }
          };
          // MPromise.await(AllCollections["systemLogs"].rawCollection().update(logQuery, logUpdate, {session: session}));
          MPromise.await(RawFunctions.update("systemLogs", logQuery, logUpdate, {session}));

        }

      } catch {
        passed = false;
      }

      MPromise.await(session.commitTransaction());
      session.endSession();

      return passed;
    },
    runTransactions(updates, systemLog) {
      const session = client.startSession({mode: 'primary'});
      session.startTransaction();

      let passed = true;


      let i = 0;

      while(i < updates.length) {
        try {
          let method:any = updates[i];
          if (method.methodType == 'INSERT') {
            if (method.args.length == 2) {
              method.args[1] = Object.assign(method.args[1], {session});
            }
            // let result = await rawInsert(method.collectionName, [...method.args]);
            // let result = await Meteor.call(method.methodType, 'transactions', {_id: Random.id(), lineItems: []}, {session});
          } else if (method.methodType == 'UPDATE') {

            if (method.args.length == 3) {
              method.args[2] = Object.assign(method.args[2], {session});
            }

            let value, previousValue;
            if ('log' in method) {
              let result = Meteor.call('findOne', method.log.collectionName, {_id: method.log.documentId});
              previousValue = findValueWithPath(result, method.log.fieldPath);
            }

            let result = MPromise.await(AllCollections[method.log.collectionName].rawCollection().update(...method.args));
            if ('log' in method) {
              // let result = MPromise.await(Meteor.call('findOne', method.log.collectionName, {_id: method.log.documentId}));
              let result = MPromise.await(AllCollections[method.log.collectionName].rawCollection().findOne({_id: method.log.documentId}, {session}));
              value = findValueWithPath(result, method.log.fieldPath);


              let logQuery = {
                _id: systemLog._id
              };

              let logUpdate = {
                $push: {
                  actions: {
                    _id: Random.id(),
                    type: method.log.type,
                    fieldPath: method.log.fieldPath,
                    date: new Date(),
                    log: method.log.log,
                    documentId: method.log.documentId,
                    collectionName: method.log.collectionName,
                    value: value,
                    previousValue: previousValue
                  }
                }
              };

              MPromise.await(AllCollections["systemLogs"].rawCollection().update(logQuery, logUpdate, {session}));
            }
          }
        } catch (error) {
          console.log('error', error);
          break;
        }
        i++;
      }

      MPromise.await(session.commitTransaction());
      session.endSession();
      return passed;
    }
  }
)

function findValueWithPath(obj, path) {
  let arr = path.split(".");
  let newObj = Object.assign({}, obj);
  let value:any;
  arr.forEach(_path => {
    let split = _path.split("_");
    if (split[1].length != 17) {
      value = newObj[split[0]];
    } else {
      let findObj = newObj[split[0]].find(_obj => _obj._id == split[1]);
      newObj = Object.assign({}, findObj)
    }
  })
  return value;
}

function _checkHasWarehouse(products, productId, warehouseId, binId): {hasWarehouse, hasBin} {
  let hasWarehouse = false;
  let hasBin = false;

  let findProduct = products.find(_product => _product._id == productId);

  findProduct.warehouses.forEach(warehouse => {
    if (warehouse._id == warehouseId) {
      hasWarehouse = true;
      warehouse.bins.forEach(bin => {
        if (bin._id == binId) {
          hasBin = true;
        }
      })
    }
  })

  return {hasWarehouse, hasBin};
}

function updateRunStatus(run, log, session) {
  let update = {
    $set: {
      status: run.status
    }
  };

  let logQuery = {
    _id: log._id
  };

  let fieldPath = `status_string`;

  let oldRun = MPromise.await(RawFunctions.findOne('productionRuns', {_id: run._id}));
  MPromise.await(RawFunctions.update('productionRuns', {_id: run._id}, update, {session}));

  let logUpdate: any = {
    $push: {
      actions: {
        _id: Random.id(),
        type: "UPDATE",
        fieldPath,
        createdAt: new Date(),
        log: `Change run ${run._id} status`,
        documentId: run._id,
        collectionName: "productionRuns",
        value: run.status,
        previousValue: oldRun.status
      }
    }
  };
  MPromise.await(RawFunctions.update('systemLogs', logQuery, logUpdate, {session}));

  return true;
}