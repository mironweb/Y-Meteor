/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/addShippingModuleLookups.js')
 */

function addItemReviewLookup() {
  print('Adding item review lookup');
  const SHIPMENTS_COLLECTION = 'customerShipments';

  const lookup = {
    "_id" : "Q4EkbAmsb5pBPhD7E",
    "name" : "customerShipmentsReviewItems",
    "label" : "Customer Shipments Review Items",
    "searchable" : true,
    "subscriptions" : [ ],
    "methods" : [
      {
        "isHeader" : true,
        "name" : "aggregate",
        "type" : "aggregate",
        "collectionName" : SHIPMENTS_COLLECTION,
        "subscriptionName" : SHIPMENTS_COLLECTION,
        "args" : [
          {
            "name" : "pipeline",
            "value" : [
              {
                "_$match": {
                  "pallets.boxes.products.customerOrderId": '_VAR_0',
                  'status': 'Open'
                }
              },
              {
                "_$unwind": {
                  "path": "$pallets",
                  "preserveNullAndEmptyArrays": true
                }
              },
              {
                "_$unwind": {
                  "path": "$pallets.boxes",
                  "preserveNullAndEmptyArrays": true
                }
              },
              {
                "_$unwind": {
                  "path": "$pallets.boxes.products",
                  "preserveNullAndEmptyArrays": true
                }
              },
              {
                "_$match": {
                  "pallets.boxes.products.customerOrderId": '_VAR_0'
                }
              },
              {
                "_$lookup": {
                  "from": "products",
                  "localField": "pallets.boxes.products.productId",
                  "foreignField": "_id",
                  "as": "product"
                }
              },
              {
                "_$unwind": {
                  "path": "$product",
                  "preserveNullAndEmptyArrays": true
                }
              },
              {
                "_$addFields": {
                  "shipmentProductId": "$pallets.boxes.products._id",
                  "productId": "$pallets.boxes.products.productId",
                  "productName": "$product.name",
                  "palletNumber": "$pallets.sequence",
                  "boxNumber": "$pallets.boxes.sequence",
                  "binNumber": "$pallets.boxes.products.warehouseBinId",
                  "qtyShipped": "$pallets.boxes.products.qtyShipped",
                  "actions": ["delete"]
                }
              },
              {
                "_$project": {
                  "shipmentProductId": 1,
                  "productId": 1,
                  "productName": 1,
                  "palletNumber": 1,
                  "boxNumber": 1,
                  "binNumber": 1,
                  "qtyShipped": 1,
                  "actions": 1
                }
              },
              {
                "_$sort": {
                  "palletNumber": 1,
                  "boxNumber": 1,
                  "binNumber": 1,
                  "productName": 1
                }
              }
            ],
            "params" : [
              "documentId"
            ]
          }
        ]
      }
    ],
    "dataTable" : {
      "options" : {
        "selectionType" : "single",
        "limit" : 10,
        "hasActionsCell" : true,
        "returnable" : true,
        "sticky" : true
      },
      "columns" : [
        {
          "prop" : "_id",
          "name" : "SHIPMENT ID",
          "hidden" : true,
          "type" : "string"
        },
        {
          "prop" : "shipmentProductId",
          "name" : "SHIPMENT PRODUCT ID",
          "hidden" : true,
          "type" : "string"
        },
        {
          "prop" : "productId",
          "name" : "PRODUCT ID",
          "hidden" : true,
          "type" : "string"
        },
        {
          "prop" : "productName",
          "name" : "PRODUCT",
          "hidden" : false,
          "type" : "string",
          "cellTemplate" : "returnTmpl",
          "showOnMobile" : true
        },
        {
          "prop" : "palletNumber",
          "name" : "PALLET NUMBER",
          "hidden" : false,
          "type" : "string",
          "cellTemplate" : "returnTmpl",
          "showOnMobile" : true
        },
        {
          "prop" : "boxNumber",
          "name" : "BOX NUMBER",
          "hidden" : false,
          "type" : "string",
          "cellTemplate" : "returnTmpl",
          "showOnMobile" : true
        },
        {
          "prop" : "binNumber",
          "name" : "BIN NUMBER",
          "hidden" : false,
          "type" : "string",
          "cellTemplate" : "returnTmpl",
          "showOnMobile" : true
        },
        {
          "prop" : "qtyShipped",
          "name" : "QTY SHIPPED",
          "hidden" : false,
          "type" : "string",
          "cellTemplate" : "returnTmpl",
          "showOnMobile" : true
        },
        {
          "prop" : "actions",
          "name" : "Actions",
          "hidden" : true,
          "cellTemplate" : "actionsTmpl"
        }
      ]
    },
    "tenantId" : "4sdRt09goRP98e456",
    "createdUserId" : "",
    "createdAt" : ISODate("2017-03-06T14:54:14.294Z"),
    "parentTenantId" : "4sdRt09goRP98e456",
    "default" : true
  };
  const query = { _id: lookup._id };

  const exists = db.systemLookups.findOne(query);
  if (exists) {
    db.systemLookups.update(query, lookup);
    print(`  Shipping module item review lookup updated`);
  } else {
    db.systemLookups.insert(lookup);
    print(`  Shipping module item review lookup created`);
  }
}

/**
 * This lookup is almost the same as customerOrder lookup
 * customerShipmentsPendingItems lookup must only show these columns:
 * - Product
 * - Qty Ordered
 * and have this condition:
 * lineItems.qtyShipped < lineItems.qtyOrdered
 */
function addItemPendingLookup() {
  print('Adding item pending lookup');
  const COLLECTION = 'customerOrders';

  const lookup = {
    "_id" : "HjXSsyydgvtStCZL3",
    "name" : "customerShipmentsPendingItems",
    "label" : "Customer Shipments Pending Items",
    "searchable" : true,
    "subscriptions" : [ ],
    "methods" : [
      {
        "isHeader" : true,
        "name" : "aggregate",
        "type" : "aggregate",
        "collectionName" : COLLECTION,
        "subscriptionName" : COLLECTION,
        "args" : [
          {
            "name" : "pipeline",
            "value" : [
              {
                "_$match": {
                  "_id": "_VAR_0"
                }
              },
              {
                "_$unwind": {
                  "path": "$lineItems",
                  "preserveNullAndEmptyArrays": true
                }
              },
              {
                "_$lookup": {
                  "from": "categories",
                  "localField": "lineItems.categoryId",
                  "foreignField": "_id",
                  "as": "category"
                }
              },
              {
                "_$unwind": {
                  "path": "$category",
                  "preserveNullAndEmptyArrays": true
                }
              },
              {
                "_$match": {
                  "category_DOT_allowCustomerContract": true
                }
              },
              {
                "_$lookup": {
                  "from": "products",
                  "let": {
                    "productId": "$lineItems.productId"
                  },
                  "pipeline": [
                    {
                      "_$match": {
                        "_$expr": {
                          "_$eq": ["$_id", "$$productId"]
                        }
                      }
                    },
                    {
                      "_$project": {
                        "name": {
                          "_$ifNull": [
                            "$name",
                            "Notes"
                          ]
                        }
                      }
                    }
                  ],
                  "as": "product"
                }
              },
              {
                "_$unwind": {
                  "path": "$product",
                  "preserveNullAndEmptyArrays": true
                }
              },
              {
                "_$project": {
                  "_id": 1,
                  "product": "$product.name",
                  "qtyOrdered": { "_$toDouble": "$lineItems.qtyOrdered" },
                  "qtyShipped": { "_$toDouble": "$lineItems.qtyShipped" },
                  "cmp_value": {
                    "_$cmp": ["$lineItems.qtyShipped", "$lineItems.qtyOrdered"]
                  }
                }
              },
              {
                "_$match": {
                  "_$expr": {
                    "_$eq": ["$cmp_value", -1]
                  }
                }
              },
              {
                "_$project": {
                  "_id": 1,
                  "product": 1,
                  "qtyOrdered": 1
                }
              }
            ],
            "params" : [
              "documentId"
            ]
          }
        ]
      }
    ],
    "dataTable" : {
      "options" : {
        "selectionType" : "single",
        "limit" : 10,
        "hasActionsCell" : true,
        "returnable" : true,
        "sticky" : true
      },
      "columns" : [
        {
          "prop" : "_id",
          "name" : "ID",
          "hidden" : true,
          "type" : "string"
        },
        {
          "prop" : "product",
          "name" : "PRODUCT",
          "hidden" : false,
          "type" : "string",
          "cellTemplate" : "returnTmpl",
          "showOnMobile" : true
        },
        {
          "prop" : "qtyOrdered",
          "name" : "QTY ORDERED",
          "hidden" : false,
          "type" : "string",
          "cellTemplate" : "returnTmpl",
          "showOnMobile" : true
        }
      ]
    },
    "tenantId" : "4sdRt09goRP98e456",
    "createdUserId" : "",
    "createdAt" : ISODate("2019-06-21T11:57:14.294Z"),
    "parentTenantId" : "4sdRt09goRP98e456",
    "default" : true
  };
  const query = { _id: lookup._id };

  const exists = db.systemLookups.findOne(query);
  if (exists) {
    db.systemLookups.update(query, lookup);
    print(`  Shipping module item pending lookup updated`);
  } else {
    db.systemLookups.insert(lookup);
    print(`  Shipping module item pending lookup created`);
  }
}

function ordersPendingShipmentsLookup() {
  print('Adding pending order shipments lookup');
  const COLLECTION = 'customerOrders';

  const lookup = {
    "_id" : "MFMgZGPiwpt9hs7EM",
    "name" : "ordersPendingShipments",
    "label" : "Orders Pending Shipments",
    "searchable" : true,
    "subscriptions" : [ ],
    "methods" : [
      {
        "isHeader" : true,
        "name" : "aggregate",
        "type" : "aggregate",
        "collectionName" : COLLECTION,
        "subscriptionName" : COLLECTION,
        "args" : [
          {
            "name" : "pipeline",
            "value" : [
              {
                "_$match": {
                  "status": "Open"
                }
              },
              {
                "_$sort": {
                  "number": -1
                }
              },
              {
                "_$project": {
                  "customerId": 1,
                  "createdAt": 1,
                  "status": 1,
                  "number": 1
                }
              },
              {
                "_$lookup": {
                  "from": "customers",
                  "let": {
                    "customerId": "$customerId"
                  },
                  "pipeline": [
                    {
                      "_$match": {
                        "_$expr": {
                          "_$eq": ["$_id", "$$customerId"]
                        }
                      }
                    },
                    {
                      "_$project": {
                        "name": 1
                      }
                    }
                  ],
                  "as": "customers"
                }
              },
              {
                "_$unwind": {
                  "path": "$customers",
                  "preserveNullAndEmptyArrays": true
                }
              },
              {
                "_$project": {
                  "_id": 1,
                  "orderNumber": "$number",
                  "status": 1,
                  "date": "$createdAt",
                  "customerName": "$customers.name"
                }
              },
              {
                "_$lookup": {
                  "from": "customerShipments",
                  "let": {
                    "orderId": "$_id"
                  },
                  "pipeline": [
                    {
                      "_$match": {
                        "status": "Open"
                      }
                    },
                    {
                      "_$project": {
                        "status": 1,
                        "pallets": 1
                      }
                    },
                    {
                      "_$unwind": {
                        "path": "$pallets",
                        "preserveNullAndEmptyArrays": true
                      }
                    },
                    {
                      "_$unwind": {
                        "path": "$pallets.boxes",
                        "preserveNullAndEmptyArrays": true
                      }
                    },
                    {
                      "_$unwind": {
                        "path": "$pallets.boxes.products",
                        "preserveNullAndEmptyArrays": true
                      }
                    },
                    {
                      "_$match": {
                        "_$expr": {
                          "_$eq": [
                            "$pallets.boxes.products.customerOrderId",
                            "$$orderId"
                          ]
                        }
                      }
                    },
                    {
                      "_$project": {
                        "_id": 1
                      }
                    }
                  ],
                  "as": "customerShipments"
                }
              },
              {
                "_$project": {
                  "_id": 1,
                  "orderNumber": 1,
                  "status": 1,
                  "date": 1,
                  "customerName": 1,
                  "customerShipments": {
                    "_$size": "$customerShipments"
                  }
                }
              },
              {
                "_$match": {
                  "_$expr": {
                    "_$eq": ["$customerShipments", 0]
                  }
                }
              },
              {
                "_$project": {
                  "_id": 1,
                  "orderNumber": 1,
                  "status": 1,
                  "date": 1,
                  "customerName": 1
                }
              }
            ]
          }
        ]
      }
    ],
    "dataTable" : {
      "options" : {
        "selectionType" : "single",
        "limit" : 10,
        "hasActionsCell" : true,
        "returnable" : true,
        "sticky" : true
      },
      "columns" : [
        {
          "prop" : "_id",
          "name" : "ID",
          "hidden" : true,
          "type" : "string"
        },
        {
          "prop" : "orderNumber",
          "name" : "ORDER NUMBER",
          "hidden" : false,
          "type" : "string",
          "cellTemplate" : "returnTmpl",
          "showOnMobile" : true
        },
        {
          "prop" : "status",
          "name" : "STATUS",
          "hidden" : false,
          "type" : "string",
          "cellTemplate" : "returnTmpl",
          "showOnMobile" : true
        },
        {
          "prop" : "customerName",
          "name" : "CUSTOMER",
          "hidden" : false,
          "type" : "string",
          "cellTemplate" : "returnTmpl",
          "showOnMobile" : true
        },
        {
          "prop" : "date",
          "name" : "DATE",
          "hidden" : false,
          "type" : "date",
          "cellTemplate" : "dateTmpl",
          "showOnMobile" : true
        }
      ]
    },
    "tenantId" : "4sdRt09goRP98e456",
    "createdUserId" : "",
    "createdAt" : ISODate("2019-06-20T11:57:14.294Z"),
    "parentTenantId" : "4sdRt09goRP98e456",
    "default" : true
  };
  const query = { _id: lookup._id };

  const exists = db.systemLookups.findOne(query);
  if (exists) {
    db.systemLookups.update(query, lookup);
    print(`  Shipping module pending orders shipment lookup updated`);
  } else {
    db.systemLookups.insert(lookup);
    print(`  Shipping module pending orders shipment lookup created`);
  }
}

function ordersReviewShipmentsLookup() {
  print('Adding review order shipments lookup');
  const COLLECTION = 'customerOrders';

  const lookup = {
    "_id" : "PsoLG9M7M5yReJBYq",
    "name" : "ordersReviewShipments",
    "label" : "Orders Review Shipments",
    "searchable" : true,
    "subscriptions" : [ ],
    "methods" : [
      {
        "isHeader" : true,
        "name" : "aggregate",
        "type" : "aggregate",
        "collectionName" : COLLECTION,
        "subscriptionName" : COLLECTION,
        "args" : [
          {
            "name" : "pipeline",
            "value" : [
              {
                "_$match": {
                  "status": "Open"
                }
              },
              {
                "_$sort": {
                  "number": -1
                }
              },
              {
                "_$project": {
                  "customerId": 1,
                  "createdAt": 1,
                  "status": 1,
                  "number": 1
                }
              },
              {
                "_$lookup": {
                  "from": "customers",
                  "let": {
                    "customerId": "$customerId"
                  },
                  "pipeline": [
                    {
                      "_$match": {
                        "_$expr": {
                          "_$eq": ["$_id", "$$customerId"]
                        }
                      }
                    },
                    {
                      "_$project": {
                        "name": 1
                      }
                    }
                  ],
                  "as": "customers"
                }
              },
              {
                "_$unwind": {
                  "path": "$customers",
                  "preserveNullAndEmptyArrays": true
                }
              },
              {
                "_$project": {
                  "_id": 1,
                  "orderNumber": "$number",
                  "status": 1,
                  "date": "$createdAt",
                  "customerName": "$customers.name"
                }
              },
              {
                "_$lookup": {
                  "from": "customerShipments",
                  "let": {
                    "orderId": "$_id"
                  },
                  "pipeline": [
                    {
                      "_$match": {
                        "status": "Open"
                      }
                    },
                    {
                      "_$project": {
                        "status": 1,
                        "pallets": 1
                      }
                    },
                    {
                      "_$unwind": {
                        "path": "$pallets",
                        "preserveNullAndEmptyArrays": true
                      }
                    },
                    {
                      "_$unwind": {
                        "path": "$pallets.boxes",
                        "preserveNullAndEmptyArrays": true
                      }
                    },
                    {
                      "_$unwind": {
                        "path": "$pallets.boxes.products",
                        "preserveNullAndEmptyArrays": true
                      }
                    },
                    {
                      "_$match": {
                        "_$expr": {
                          "_$eq": [
                            "$pallets.boxes.products.customerOrderId",
                            "$$orderId"
                          ]
                        }
                      }
                    },
                    {
                      "_$project": {
                        "_id": 1
                      }
                    }
                  ],
                  "as": "customerShipments"
                }
              },
              {
                "_$project": {
                  "_id": 1,
                  "orderNumber": 1,
                  "status": 1,
                  "date": 1,
                  "customerName": 1,
                  "customerShipments": {
                    "_$size": "$customerShipments"
                  }
                }
              },
              {
                "_$match": {
                  "_$expr": {
                    "_$gt": ["$customerShipments", 0]
                  }
                }
              },
              {
                "_$project": {
                  "_id": 1,
                  "orderNumber": 1,
                  "status": 1,
                  "date": 1,
                  "customerName": 1
                }
              }
            ]
          }
        ]
      }
    ],
    "dataTable" : {
      "options" : {
        "selectionType" : "single",
        "limit" : 10,
        "hasActionsCell" : true,
        "returnable" : true,
        "sticky" : true
      },
      "columns" : [
        {
          "prop" : "_id",
          "name" : "ID",
          "hidden" : true,
          "type" : "string"
        },
        {
          "prop" : "orderNumber",
          "name" : "ORDER NUMBER",
          "hidden" : false,
          "type" : "string",
          "cellTemplate" : "returnTmpl",
          "showOnMobile" : true
        },
        {
          "prop" : "status",
          "name" : "STATUS",
          "hidden" : false,
          "type" : "string",
          "cellTemplate" : "returnTmpl",
          "showOnMobile" : true
        },
        {
          "prop" : "customerName",
          "name" : "CUSTOMER",
          "hidden" : false,
          "type" : "string",
          "cellTemplate" : "returnTmpl",
          "showOnMobile" : true
        },
        {
          "prop" : "date",
          "name" : "DATE",
          "hidden" : false,
          "type" : "date",
          "cellTemplate" : "dateTmpl",
          "showOnMobile" : true
        }
      ]
    },
    "tenantId" : "4sdRt09goRP98e456",
    "createdUserId" : "",
    "createdAt" : ISODate("2019-06-20T11:57:14.294Z"),
    "parentTenantId" : "4sdRt09goRP98e456",
    "default" : true
  };
  const query = { _id: lookup._id };

  const exists = db.systemLookups.findOne(query);
  if (exists) {
    db.systemLookups.update(query, lookup);
    print(`  Shipping module review orders shipment lookup updated`);
  } else {
    db.systemLookups.insert(lookup);
    print(`  Shipping module review orders shipment lookup created`);
  }
}

addItemReviewLookup();
addItemPendingLookup();
ordersPendingShipmentsLookup();
ordersReviewShipmentsLookup();
