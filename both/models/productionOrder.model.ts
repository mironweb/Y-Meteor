import {MeteorObservable} from "meteor-rxjs";
import {map, switchMap, tap} from "rxjs/operators";
import {of} from "rxjs";
import {Transaction} from "./transaction.model";
import {Product} from "./product.model";
import {Random} from "meteor/random";

export interface ProductionOrderModel {
  _id?: string;
  type?: string;
  status?: string;
  number: number;
  lineItems: LineItem[];
  tenantId: string;
  createdAt?: Date;
  createdUserId: string;
  destinationWarehouseBinId?: string;
  destinationWarehouseId?: string;
  productId: string;
  billId: string;
  productionQty: number;
  itemCode?: string;
}

export interface LineItem {
  _id: string;
  productId: string;
  warehouseId: string;
  warehouseBinId: string;
  qtyToPick: number;
  qtyPicked: number;
  cost: number;
  createdUserId: string;
  createdAt?: Date;
  warehouseName?: string;
  warehouseBinName?: string;
  component?: string;
}

export class ProductionOrder {
  _id?: string;
  type?: string;
  number: number;
  status?: string;
  lineItems: LineItem[];
  tenantId: string;
  createdAt?: Date;
  createdUserId: string;
  destinationWarehouseBinId?: string;
  destinationWarehouseId?: string;
  productId: string;
  billId: string;
  productionQty: number;
  itemCode: string;

  static _FindOne$(query, option = {}) {
    return MeteorObservable.call('findOne', 'productionOrders', query, option);
  }

  static _Insert$(productionOrder) {
    productionOrder.destinationWarehouseId = 'TXdApe769yDuskww8';
    productionOrder.status = 'New';
    productionOrder.type = 'standard';
    productionOrder.createdAt = new Date();
    // productionOrder.destinationWarehouseBinId = 'TXdApe769yDuskww8';
    productionOrder.lineItems = (productionOrder.lineItems || []).map((lineItem) => ({
      ...lineItem,
      cost: new Decimal(lineItem.cost),
    }));
    return MeteorObservable.call('insert', 'productionOrders', productionOrder);
  }


  constructor(productionOrder: ProductionOrderModel) {
    Object.keys(productionOrder).forEach(_key => {
      this[_key] = productionOrder[_key];
    });
  }

  _saveStatus$(log) {
    return MeteorObservable.call('updateProductionOrderStatus', this, log._id, Session.get('tenantId'));

/*
    return MeteorObservable.call('update', 'productionOrders', {_id: this._id}, update)
      .pipe(
        switchMap(res => {
          const ids = this.lineItems.map(_lineItem => _lineItem.productId);
          return MeteorObservable.call('find', "products", {_id: {$in: ids}});
        }),
        switchMap((products:any) => {
          switch (this.status) {
            case "Staged": {
              let transaction = {
                _id: Random.id(),
                createdAt: new Date(),
                lineItems: [],
                documentId: '',
                createdUserId: Meteor.userId(),
                collectionName: "products",
                type: "",
                tenantId: this.tenantId,
                number: "",
                date: new Date(),
                status: '',
                notes: [],
              };

              let updates = [];
              let transactions = [];


              console.log('lineitmes', this.lineItems);
              // if (product) {
              //   product.warehouses.forEach(warehouse => {
              //
              //   })
              // } else {
              //
              // }
              this.lineItems.forEach(_lineItem => {

                let findProduct = products.find(_product => _product._id == _lineItem.productId);

                console.log('findpropduct', findProduct);
                let hasCPC = false;
                let hasWarehouse = false;

                findProduct.warehouses.forEach(warehouse => {
                  if (warehouse._id == "XZS76uMBAx3nLuqRu") {
                    hasWarehouse = true;
                    warehouse.bins.forEach(bin => {
                      if (bin._id == 'OlygyPAnmsMDjOVvN') {

                        hasCPC = true;
                      }
                    })
                  }
                })



                if (_lineItem.warehouseBinId != 'OlygyPAnmsMDjOVvN') {
                  transaction.lineItems.push({
                    _id: Random.id(),
                    createdAt: new Date(),
                    createdUserId: Meteor.userId(),
                    wharehosueId: _lineItem.warehouseId,
                    binId: _lineItem.warehouseBinId,
                    qty: _lineItem.qtyToPick * -1,
                    cost: _lineItem.cost,
                  });
                  transaction.lineItems.push({
                    _id: Random.id(),
                    createdAt: new Date(),
                    createdUserId: Meteor.userId(),
                    wharehosueId: "XZS76uMBAx3nLuqRu",
                    binId: "OlygyPAnmsMDjOVvN",
                    qty: _lineItem.qtyToPick,
                    cost: _lineItem.cost,
                  });


                  // {
                  //   _id: Random.id(),
                  //     collectionName: "transactions",
                  //   methodType: "insert",
                  //   args: [
                  //   {
                  //     _id: Random.id(),
                  //     "lineItems" : [
                  //       {
                  //         "_id" : "WurdcexP4naDtGdkF",
                  //         createdAt: new Date(),
                  //         "createdUserId" : "YoKFKBqCosExsKBHE",
                  //         "wharehosueId" : "XZS76uMBAx3nLuqRu",
                  //         "binId" : "OlygyPAnmsMDjOVvN",
                  //         "qty" : 245,
                  //         "cost" : 15.901
                  //       },
                  //       {
                  //         "_id" : "u2SzhRycTmq3yCA9E",
                  //         createdAt: new Date(),
                  //         "createdUserId" : "YoKFKBqCosExsKBHE",
                  //         "wharehosueId" : "XZS76uMBAx3nLuqRu",
                  //         "binId" : "qvy9DqyA30TwNpauo",
                  //         "qty" : 245,
                  //         "cost" : 0.009
                  //       }
                  //     ],
                  //   }
                  // ],
                  // },



                  let query = {
                    _id: _lineItem.productId,
                    "warehouses._id": _lineItem.warehouseId,
                  };
                  let update:any = {
                    $inc: {
                      "warehouses.$[].bins.$[bin].qtyOnHand": _lineItem.qtyToPick * -1
                    }
                  };
                  let options:any = {
                    arrayFilters: [
                      {
                        "bin._id": _lineItem.warehouseBinId
                      }
                    ]
                  };

                  updates.push({
                    _id: Random.id(),
                    methodType: 'rawUpdate',
                    collectionName: 'products',
                    args: [
                      query,
                      update,
                      options
                    ]
                  });





                  transaction.lineItems.push({
                    _id: Random.id(),
                    createdAt: new Date(),
                    createdUserId: Meteor.userId(),
                    wharehosueId: "XZS76uMBAx3nLuqRu",
                    binId: "OlygyPAnmsMDjOVvN",
                    qty: _lineItem.qtyToPick,
                    cost: _lineItem.cost,
                  });




                  query = {
                    _id: _lineItem.productId,
                    "warehouses._id": "XZS76uMBAx3nLuqRu",
                  };

                  if (hasWarehouse && hasCPC) {
                    update = {
                      $inc: {
                        "warehouses.$[].bins.$[bin].qtyOnHand": _lineItem.qtyToPick
                      }
                    };
                  } else if (hasWarehouse && !hasCPC) {
                    update = {
                      $push: {
                        "warehouses.$.bins": {
                          "_id" : "OlygyPAnmsMDjOVvN",
                          "qtyOnHand" : _lineItem.qtyToPick,
                          "lastReceiptDate" : new Date()
                        }
                      }
                    };
                    options = {};
                  } else if (!hasWarehouse) {
                    options = {};
                    update = {
                      $push: {
                        "warehouses": {
                          _id: "XZS76uMBAx3nLuqRu",
                          "primaryBinId" : "OlygyPAnmsMDjOVvN",
                          bins: [
                            {
                              "_id" : "OlygyPAnmsMDjOVvN",
                              "qtyOnHand" : _lineItem.qtyToPick,
                              "lastReceiptDate" : new Date()
                            }
                          ]
                        }
                      }
                    }
                  }

                  updates.push({
                    _id: Random.id(),
                    methodType: 'rawUpdate',
                    collectionName: 'products',
                    args: [
                      query,
                      update,
                      options
                    ]
                  });

                } else {
                  // if product is in CPC bin, don't do anything
                }
              });

              // return of(null);
              return MeteorObservable.call('test', updates);
              // return Transaction._Insert$(transaction);
            }
          }
        })

      )
    // return this._save$()
    //   .pipe(
    //     switchMap((res:any) => {
    //       if (res && this.productionOrderId) {
    //         return ProductionOrder._FindOne$({_id: this.productionOrderId});
    //       } else {
    //         return of(null);
    //       }
    //     }),
    //     switchMap(res => {
    //       if (res) {
    //         productionOrder = new ProductionOrder(res);
    //         switch(this.status) {
    //           case 'Staged':
    //             productionOrder.status = 'In Progress';
    //             return productionOrder._save$();
    //           case 'Canceled':
    //             let query = {
    //               productionOrderId: this.productionOrderId,
    //               status: "Complete"
    //             };
    //
    //             return MeteorObservable.call('findOne', 'productionRuns', query)
    //               .pipe(
    //                 switchMap(res => {
    //                   if (res) {
    //                     // if the order has any productionRuns with a status of complete
    //                     productionOrder.status = 'Open';
    //                   } else {
    //                     // if the order doesn't have any productionRuns with a status of complete
    //                     productionOrder.status = 'New';
    //                   }
    //                   return productionOrder._save$();
    //                 })
    //               );
    //           case 'Complete':
    //             return this._calculateRemaining$()
    //               .pipe(
    //                 switchMap(res => {
    //                   if (res > 0) {
    //                     productionOrder.status = 'Open';
    //                   } else if(res == 0) {
    //                     productionOrder.status = 'Complete';
    //                   }
    //                   return productionOrder._save$()
    //                 })
    //               )
    //
    //         }
    //
    //       } else {
    //
    //       }
    //     }),
    //   )
    */
  }

  _save$() {
    let query = {
      _id: this._id
    }

    let update = {
      $set: {
        type: this.type,
        number: this.number,
        status: this.status,
        lineItems: (this.lineItems || []).map((lineItem) => ({
          ...lineItem,
          cost: new Decimal(lineItem.cost),
        })),
        tenantId: this.tenantId,
        createdAt: new Date(),
        createdUserId: this.createdUserId,
        destinationWarehouseBinId: this.destinationWarehouseBinId,
        destinationWarehouseId: this.destinationWarehouseId,
        productId: this.productId,
        productionQty: this.productionQty
      }
    }

    return MeteorObservable.call('update', 'productionOrders', query, update)
      .pipe(
        switchMap(res => {
          if (res) {
            let transaction = {
              _id: Random.id(),
              createdAt: new Date(),
              lineItems: [],
              documentId: '',
              createdUserId: Meteor.userId(),
              collectionName: "products",
              type: "",
              tenantId: Session.get('tenantId'),
              number: "",
              date: new Date(),
              status: '',
              notes: [],
            };

            this.lineItems.forEach(_lineItem => {
              if (_lineItem.warehouseBinId != 'OlygyPAnmsMDjOVvN') {
                transaction.lineItems.push({
                  _id: Random.id(),
                  createdAt: new Date(),
                  createdUserId: Meteor.userId(),
                  wharehosueId: _lineItem.warehouseId,
                  binId: _lineItem.warehouseBinId,
                  qty: _lineItem.qtyToPick * -1,
                  cost: new Decimal(_lineItem.cost),
                });
                transaction.lineItems.push({
                  _id: Random.id(),
                  createdAt: new Date(),
                  createdUserId: Meteor.userId(),
                  wharehosueId: "XZS76uMBAx3nLuqRu",
                  binId: "OlygyPAnmsMDjOVvN",
                  qty: _lineItem.qtyToPick,
                  cost: new Decimal(_lineItem.cost),
                });
              }
            });

            return Transaction._Insert$(transaction);
          } else {
            return of(res);
          }
        })
      )
  }

  _insert$(productionOrder) {
    productionOrder.destinationWarehouseId = 'TXdApe769yDuskww8';
    productionOrder.status = 'New';
    productionOrder.type = 'standard';
    productionOrder.createdAt = new Date();
    // productionOrder.destinationWarehouseBinId = 'TXdApe769yDuskww8';
    productionOrder.lineItems = (productionOrder.lineItems || []).map((lineItem) => ({
      ...lineItem,
      cost: new Decimal(lineItem.cost),
    }));
    return MeteorObservable.call('insert', 'productionOrders', productionOrder);
  }

  _remove$() {
    return MeteorObservable.call('remove', 'productionOrders', {_id: this._id});
  }

  _calculateRemaining$() {
    let query = {
      productionOrderId: this._id,
      status: {
        $in: ["Running", "Paused", "Complete"]
      }
    };

    let allRunQty = 0;
    return MeteorObservable.call('find', 'productionRuns', query)
      .pipe(
        map((runs:any) => {
          runs.forEach(_run => {
            if ('workers' in _run) {
              _run.workers.forEach(_worker => {
                if ('days' in _worker) {
                  _worker.days.forEach(_day => {
                    if ('productionQty' in _day)
                      allRunQty+= _day.productionQty;
                  })
                }
              })
            }
          });
          return this.productionQty - allRunQty;
        })
      )
  }

  /*
  after saved, add transaction
  */
  _afterStaged$() {

    // Transaction._Insert$(transaction);
  }
}