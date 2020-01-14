/**
 * This file should be ran within a mongo cli by executing the command below.
 *
 * > mongo
 * > use yibas_original
 * > load('/path/to/yibas/.bin/database/modifyLookupCategoryDetails.js')
 */


function initialize() {
  print('Updating categoryDetails \"gHzB8VnBcdKD3msQB\" in systemLookups');

  db.systemLookups.update({"_id" : "gHzB8VnBcdKD3msQB"},
    {
      "_id" : "gHzB8VnBcdKD3msQB",
      "name" : "categoryDetails",
      "label" : "Category Details",
      "searchable" : true,
      "subscriptions" : [ ],
      "methods" : [
        {
          "isHeader" : true,
          "name" : "aggregate",
          "type" : "aggregate",
          "collectionName" : "customerInvoices",
          "args" : [
            {
              "name" : "pipeline",
              "value" : [
                {
                  "_$match" : {
                    "customerId" : "_VAR_0",
                    "type" : {
                      "_$in" : [
                        "standard",
                        "credit memo"
                      ]
                    },
                    "status" : "complete",
                    "date" : "_VAR_1"
                  }
                },
                {
                  "_$unwind" : "$lineItems"
                },
                {
                  "_$group" : {
                    "_id" : "$lineItems.categoryId",
                    "total" : {
                      "_$sum" : "$lineItems.total"
                    }
                  }
                },
                {
                  "_$group" : {
                    "_id" : "000",
                    "previousWholeYear" : {
                      "_$push" : {
                        "_id" : "$_id",
                        "previousYearTotal" : "$total"
                      }
                    }
                  }
                }
              ],
              "params" : [
                "data.customerId",
                "data.lastWholeYearRange"
              ],
              "datePaths" : [
                "0.$match.date.$gte",
                "0.$match.date.$lte"
              ]
            }
          ],
          "return" : {
            "next" : true,
            "nextMethodIndex" : 1,
            "dataType" : "object",
            "as" : "previousWholeYear"
          }
        },
        {
          "isHeader" : true,
          "name" : "aggregate",
          "type" : "aggregate",
          "collectionName" : "customerInvoices",
          "args" : [
            {
              "name" : "pipeline",
              "value" : [
                {
                  "_$match" : {
                    "customerId" : "_VAR_0",
                    "type" : {
                      "_$in" : [
                        "standard",
                        "credit memo"
                      ]
                    },
                    "status" : "complete",
                    "date" : "_VAR_1"
                  }
                },
                {
                  "_$unwind" : "$lineItems"
                },
                {
                  "_$group" : {
                    "_id" : "$lineItems.categoryId",
                    "total" : {
                      "_$sum" : "$lineItems.total"
                    }
                  }
                },
                {
                  "_$group" : {
                    "_id" : "001",
                    "previousYear" : {
                      "_$push" : {
                        "_id" : "$_id",
                        "total" : "$total"
                      }
                    }
                  }
                }
              ],
              "params" : [
                "data.customerId",
                "data.lastYearRange"
              ],
              "datePaths" : [
                "0.$match.date.$gte",
                "0.$match.date.$lte"
              ]
            }
          ],
          "return" : {
            "next" : true,
            "nextMethodIndex" : 2,
            "dataType" : "object",
            "as" : "previousYear"
          }
        },
        {
          "isHeader" : false,
          "name" : "aggregate",
          "type" : "aggregate",
          "collectionName" : "customerInvoices",
          "return" : {
            "returnable" : true,
            "type" : "obj"
          },
          "args" : [
            {
              "name" : "pipeline",
              "value" : [
                {
                  "_$match" : {
                    "customerId" : "_VAR_1",
                    "date" : "_VAR_2"
                  }
                },
                {
                  "_$unwind" : "$lineItems"
                },
                {
                  "_$group" : {
                    "_id" : "$lineItems.categoryId",
                    "total" : {
                      "_$sum" : "$lineItems.total"
                    }
                  }
                },
                {
                  "_$group" : {
                    "_id" : "000",
                    "currentYear" : {
                      "_$push" : {
                        "_id" : "$_id",
                        "currentTotal" : "$total"
                      }
                    }
                  }
                },
                {
                  "_$project" : {
                    "_id" : 1,
                    "currentYear" : 1,
                    "previousYear" : "_VAR_0",
                    "previousWholeYear": "_VAR_3"
                  }
                },
                {
                  "_$project" : {
                    "_id" : 1,
                    "allValues" : {
                      "_$concatArrays" : [
                        "$currentYear",
                        "$previousYear",
                        "$previousWholeYear"
                      ]
                    }
                  }
                },
                {
                  "_$unwind" : "$allValues"
                },
                {
                  "_$project" : {
                    "_id" : "$allValues._id",
                    "current" : "$allValues.currentTotal",
                    "past" : "$allValues.total",
                    "previousYear": "$allValues.previousYearTotal"
                  }
                },
                {
                  "_$group" : {
                    "_id" : "$_id",
                    "current" : {
                      "_$max" : "$current"
                    },
                    "past" : {
                      "_$max" : "$past"
                    },
                    "previousYear" : {
                      "_$max" : "$previousYear"
                    }
                  }
                },
                {
                  "_$lookup" : {
                    "from" : "categories",
                    "localField" : "_id",
                    "foreignField" : "_id",
                    "as" : "category"
                  }
                },
                {
                  "_$unwind" : {
                    "path" : "$category"
                  }
                },
                {
                  "_$project" : {
                    "_id" : 1,
                    "productLine" : {
                      "_$concat" : [
                        "$category.name",
                        " - ",
                        "$category.description"
                      ]
                    },
                    "current" : {
                      "_$ifNull" : [
                        "$current",
                        0
                      ]
                    },
                    "past" : {
                      "_$ifNull" : [
                        "$past",
                        0
                      ]
                    },
                    "previousYear" : {
                      "_$ifNull" : [
                        "$previousYear",
                        0
                      ]
                    }
                  }
                },
                {
                  "_$project" : {
                    "_id" : 1,
                    "productLine" : 1,
                    "current" : 1,
                    "past" : 1,
                    "previousYear": 1,
                    "percent" : {
                      "_$cond" : {
                        "if" : {
                          "_$ne" : [
                            "$past",
                            0
                          ]
                        },
                        "then" : {
                          "_$multiply" : [
                            {
                              "_$divide" : [
                                {
                                  "_$subtract" : [
                                    "$current",
                                    "$past"
                                  ]
                                },
                                "$past"
                              ]
                            },
                            100
                          ]
                        },
                        "else" : 100
                      }
                    }
                  }
                },
                {
                  "_$sort" : {
                    "current" : -1
                  }
                }
              ],
              "params" : [
                "previousYear.previousYear",
                "data.customerId",
                "data.thisYearRange",
                "previousWholeYear.previousWholeYear"
              ],
              "datePaths" : [
                "0.$match.date.$gte",
                "0.$match.date.$lte"
              ]
            }
          ]
        }
      ],
      "dataTable" : {
        "options" : {
          "columnMode" : "force",
          "selectionType" : "single",
          "pageSize" : 100,
          "returnable" : true,
          "percentChange" : "percent",
          "sticky" : true
        },
        "columns" : [
          {
            "prop" : "_id",
            "name" : "ID",
            "hidden" : true,
            "type" : "string",
            "cellTemplate" : "returnTmpl",
            "showOnMobile" : false
          },
          {
            "prop" : "productLine",
            "name" : "PRODUCT LINE",
            "hidden" : false,
            "type" : "string",
            "cellTemplate" : "returnTmpl",
            "showOnMobile" : true
          },
          {
            "prop" : "previousYear",
            "name" : "PRIOR YEAR",
            "hidden" : false,
            "type" : "string",
            "cellTemplate" : "dollarTmpl",
            "showOnMobile" : true
          },
          {
            "prop" : "past",
            "name" : "PRIOR YEAR TO DATE",
            "hidden" : false,
            "type" : "string",
            "cellTemplate" : "dollarTmpl",
            "showOnMobile" : true
          },
          {
            "prop" : "current",
            "name" : "CURRENT YEAR",
            "hidden" : false,
            "type" : "string",
            "cellTemplate" : "dollarTmpl",
            "showOnMobile" : true
          },
          {
            "prop" : "percent",
            "name" : "% CHANGE",
            "hidden" : false,
            "type" : "string",
            "cellTemplate" : "nonEditPercentTmpl",
            "showOnMobile" : true
          }
        ]
      },
      "tenantId" : "4sdRt09goRP98e456",
      "createdUserId" : "",
      "createdAt" : "2017-03-06T14:54:14.294Z",
      "parentTenantId" : "4sdRt09goRP98e456",
      "default" : true,
      "removed" : false,
      "path" : ""
    }
  )
}

initialize();