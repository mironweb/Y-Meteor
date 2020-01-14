import {Component, ViewChild} from '@angular/core';
import {MatSnackBar} from '@angular/material';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MeteorObservable } from "meteor-rxjs";
import * as _ from "underscore";
import * as moment from 'moment';
import {switchMap} from "rxjs/operators";
import { SystemLogsService } from "../../../../services/SystemLogs.service";
import { Random } from "meteor/random";

@Component({
  selector: 'customers-quoteReview',
  templateUrl: "customers-quoteReview.page.html",
  styleUrls: ['customers-quoteReview.page.scss'],
})

export class CustomersQuoteReviewPage {

  @ViewChild("customerQuoteReviewLookup") customerQuoteReviewLookup;

  constructor(public snackBar: MatSnackBar, private router: Router, private route: ActivatedRoute, private logService: SystemLogsService) { }
  filterConditions: any;
  pageHeader: string;
  salesPersonEmail: string;
  quote: any = {};
  data: any = {};
  originalProducts: any = [];
  productsWithName: any = [];
  manageQuote: boolean = false;
  submitQuoteForApproval: boolean = false;
  quoteAlertInfo: any = {};
  isDataReady: boolean = false;
  adminNotesInput: string;
  rows: any;
  contractId: string;
  capitalStatus: string;

  ngOnInit() {
    this.pageHeader = 'Customer Quotes';
    MeteorObservable.call('checkSystemPermission', Meteor.userId(), { name: 'approveCustomerQuotes'}).subscribe(permission => {
      if (permission['result'].length > 0 && permission['result'][0].status === 'enabled') {
        this.manageQuote = true;
      }
    });

    MeteorObservable.call('checkSystemPermission', Meteor.userId(), { name: 'approveCustomerQuoteForReview'}).subscribe(permission => {
      if (permission['result'].length > 0 && permission['result'][0].status === 'enabled') {
        this.submitQuoteForApproval = true;
      }
    });

    MeteorObservable.call('findOne', 'systemAlerts', { name: 'completeQuoteReview' }).subscribe(quoteAlert => {
      this.quoteAlertInfo = quoteAlert;
    });

    let documentId;
    this.route.params
      .pipe(
        switchMap((params) => {
          documentId = params.documentId;
          return MeteorObservable.call('findOne', 'customerQuotes', {
            _id: documentId
          });
        })
      ).subscribe((quote:any) => {
        this.data['quoteId'] = documentId;
        this.data['customerId'] = quote['customerId'];
        this.data['currentDate'] = moment().startOf('day').format();
        this.data['yearFromCurrent'] = moment().subtract(1, 'years').startOf('day').format();
        // console.log(this.data);
        this.quote.status = quote['status'];
        this.quote.notes = (quote['notes'] === undefined || quote['notes'] === null) ? "" : quote['notes'];
        this.quote.products = quote['products'];
        this.quote.adminNotes = (quote['adminNotes'] === undefined) ? "" : quote['adminNotes'];
        this.quote.createdAt = quote['createdAt'];
        this.quote.updatedAt = quote['updatedDateTime'];
        this.quote.categoryId = quote["categoryId"];
        this.capitalStatus = quote['status'].charAt(0).toUpperCase() + quote['status'].slice(1)
        MeteorObservable.call('findOne', 'customers', {
          _id: this.data['customerId']
        }).subscribe(customer => {
          this.quote.customer = customer["number"] + " - " + customer["name"];
          this.contractId = customer['contractId'];
          // console.log(this.contractId);
        })
        MeteorObservable.call('findOne', 'categories', {
          _id: quote["categoryId"]
        }).subscribe(category => {
          this.quote.category = category["name"] + " - " +  category["description"];
        })
        MeteorObservable.call('findOne', 'users', {
          _id: quote["createdUserId"]
        }).subscribe(user => {
          this.quote.user = user["profile"].firstName + " " + user["profile"].lastName;
          this.salesPersonEmail = user["emails"][0].address;
        })
        MeteorObservable.call('findOne', 'users', {
          _id: quote["updatedUserId"]
        }).subscribe(user => {
          if (user) {
            this.quote.updatedUser = user["profile"].firstName + " " + user["profile"].lastName;
          }
        })
        this.isDataReady = true;
        this.originalProducts = this.quote.products;
    })
  }

  adminNotes(event){
    // if (event.target.value !== "") {
      let query = {
        _id: this.data['quoteId']
      };
      let update = {
        $set: {
          ['adminNotes']: event
        }
      };
      MeteorObservable.call('update', 'customerQuotes', query, update).subscribe(res => {})
    // }
  }

  // completeQuote(completeStatus) {
  //   this.isDataReady = false;
  //   let updateQuery = {
  //     _id: this.data['quoteId']
  //   };

  //   if (this.quote.adminNotes === undefined || this.quote.adminNotes === null) {
  //     this.quote.adminNotes = "";
  //   }

  //   let update = {
  //     $set: {
  //       adminNotes: this.quote.adminNotes,
  //       status: completeStatus,
  //       updatedUserId: Meteor.userId(),
  //       updatedDateTime: new Date(),
  //     }
  //   };
  //   // console.log(update);
  //   MeteorObservable.call('update', 'customerQuotes', updateQuery, update).subscribe(res => { })

  //   let query = [{
  //       $match: {
  //         _id: this.data['quoteId']
  //       }
  //     },
  //     {
  //       $unwind: "$products"
  //     },
  //     {
  //       "$lookup": {
  //         "from": "products",
  //         "localField": "products.productId",
  //         "foreignField": "_id",
  //         "as": "productInfo"
  //       }
  //     }, {
  //       "$unwind": "$productInfo"
  //     },
  //     {
  //       $project: {
  //         "_id": "$products.productId",
  //         "price": "$products.price",
  //         "previousPrice": "$products.previousPrice",
  //         "name": "$productInfo.product",
  //         "description": "$productInfo.description"
  //       }
  //     }
  //   ]
  //   MeteorObservable.call('aggregate', 'customerQuotes', query).subscribe(products => {
  //     this.productsWithName = products['result']
  //   })


  //   MeteorObservable.call('aggregate', 'customers', [{ $match: { _id: this.data['customerId']}}]).subscribe(customer => {
  //     // console.log(customers['result'][0]);
  //     this.contractId = customer['result'][0].contractId
  //     // console.log(this.contractId);
  //   })
    
  //   MeteorObservable.call('findOne', 'customerQuotes', {
  //     _id: this.data['quoteId']
  //   }).subscribe(quote => {
  //     console.log('quote',quote);
  //     let products = quote['products'];
  //     console.log(products);
  //     let quoteStatus = completeStatus;
  //     if (completeStatus === 'approved') {
  //       completeStatus = (_.isEqual(this.originalProducts, products)) ? completeStatus : 'revised and ' + completeStatus
  //     }
      
  //     let emailData = {};
  //     let variables = {
  //       logo: 'https://app.yibas.com/img/Global-White.png',
  //       customer: this.quote.customer,
  //       productLine: this.quote.category,
  //       quoteNotes: this.quote.notes,
  //       adminNotes: this.quote.adminNotes,
  //       products: this.productsWithName,
  //       salesPerson: this.quote.user,
  //       status: completeStatus,
  //       statusCapital: completeStatus.charAt(0).toUpperCase() + completeStatus.slice(1),
  //     }

  //     emailData['to'] = this.salesPersonEmail;
  //     emailData['from'] = this.quoteAlertInfo.email.from;
  //     emailData['bcc'] = this.quoteAlertInfo.email.bcc;
  //     emailData['subject'] = this.quoteAlertInfo.email.subject + completeStatus.toUpperCase();
  //     if (!Meteor.settings.public.isProduction) {
  //       emailData['bcc'] = this.quoteAlertInfo.email.temp
  //     }

  //     if (quoteStatus === 'approved') {
  //       for (var i = 0; i < products.length; i++) {

  //         let query = {
  //           _id: this.contractId,
  //           "products._id": products[i].productId
  //         }
  //         let update = {
  //           $set: {
  //             'products.$.price': products[i].price,
  //             'products.$.previousPrice': this.rows[i].price,
  //             'products.$.isSynced': false
  //           }
  //         };
  //         let addToSetUpdate = {
  //           $addToSet: {
  //               products: {
  //               '_id': products[i].productId,
  //               'price': products[i].price,
  //               'previousPrice': this.rows[i].price,
  //               'isSynced': false,
  //               "createdUserId": Meteor.userId(),
  //               "createdAt": new Date()
  //             }
  //           }
  //         };
  //         MeteorObservable.call('update', 'customerContracts', query, update).subscribe(res => {
  //           if (!res) {
  //             delete query['products._id']
  //             MeteorObservable.call('update', 'customerContracts', query, addToSetUpdate).subscribe(res => {})
  //           }
  //         })
  //       }
  //     }
  //     console.log(products, this.rows);
  //     // MeteorObservable.call('sendEmail', emailData, 'html-completeQuote.html', variables).subscribe(quote => { })
  //     // this.router.navigate(['customers/quotes/']);
  //     console.log(variables);
  //   })
  // }
  async approveForReview(){
    let updateQuery = {
      _id: this.data['quoteId']
    };
    let update = {
      $set: {
        status: 'pre-approved',
        updatedUserId: Meteor.userId(),
        updatedDateTime: new Date(),
      }
    };

    MeteorObservable.call('update', 'customerQuotes', updateQuery, update).subscribe(res => { })

    let query = [{
      $match: {
        _id: this.data['quoteId']
      }
    },
    {
      $unwind: "$products"
    },
    {
      "$lookup": {
        "from": "products",
        "localField": "products.productId",
        "foreignField": "_id",
        "as": "productInfo"
      }
    }, {
      "$unwind": "$productInfo"
    },
    {
      $project: {
        "_id": "$products.productId",
        "price": "$products.price",
        "previousPrice": "$products.previousPrice",
        "name": "$productInfo.name",
        "description": "$productInfo.description"
      }
    },
    {
      $addFields: {
        price: { $toDouble: "$price" },
        previousPrice: { $toDouble: "$previousPrice" },
      },
    },
    ];
    await MeteorObservable.call('aggregate', 'customerQuotes', query).subscribe(products => {
      this.productsWithName = products['result']
      let quoteValue = this.quote;
      let emailData = {};
      let variables = {
        logo: 'https://app.yibas.com/img/Global-White.png',
        Customer: quoteValue.customer,
        ProductLine: quoteValue.category,
        SalesPerson: quoteValue.user,
        QuoteNotes: quoteValue.notes,
        Products: this.productsWithName,
        quoteId: this.data['quoteId'],
        ...(this.quote.adminNotes && { 'adminNotes': this.quote.adminNotes }),
      };
      
      emailData['to'] = this.quoteAlertInfo.email.bcc;
      emailData['from'] = this.quoteAlertInfo.email.from;
      emailData['subject'] = this.quoteAlertInfo.email.subjectForReview;
      if (!Meteor.settings.public.isProduction) {
        emailData['to'] = this.quoteAlertInfo.email.temp
      }

      MeteorObservable.call('sendEmail', emailData, 'html-submitQuote.html', variables).subscribe(quote => { })
    });

    this.router.navigate(['customers/quotes']).catch(error => console.log(error));
  }

  async completeQuoteRewrite(completeStatus) {
    this.isDataReady = false;
    let updateQuery = {
      _id: this.data['quoteId']
    };

    // if (!this.quote.adminNotes) {
    //   this.quote.adminNotes = "";
    // }
    let productArr = this.generateQuoteProductsArray();
    let update = {
      $set: {
        // adminNotes: this.quote.adminNotes,
        status: completeStatus,
        products: productArr.map((product) => ({
          ...product,
          price: new Decimal(product.price || 0),
          previousPrice: new Decimal(product.previousPrice || 0),
        })),
        updatedUserId: Meteor.userId(),
        updatedDateTime: new Date(),
      }
    };

    MeteorObservable.call('update', 'customerQuotes', updateQuery, update).subscribe(res => { })

    let query = [{
      $match: {
        _id: this.data['quoteId']
      }
    },
    {
      $unwind: "$products"
    },
    {
      "$lookup": {
        "from": "products",
        "localField": "products.productId",
        "foreignField": "_id",
        "as": "productInfo"
      }
    }, {
      "$unwind": "$productInfo"
    },
    {
      $project: {
        "_id": "$products.productId",
        "price": "$products.price",
        "previousPrice": "$products.previousPrice",
        "name": "$productInfo.name",
        "description": "$productInfo.description"
      }
    },
    {
      $addFields: {
        price: { $toDouble: "$price" },
        previousPrice: { $toDouble: "$previousPrice" },
      },
    },
    ];
    MeteorObservable.call('aggregate', 'customerQuotes', query).subscribe(products => {
      this.productsWithName = products['result']
    });

    MeteorObservable.call('findOne', 'customerQuotes', {
      _id: this.data['quoteId']
    }).subscribe(quote => {
      let products = quote['products'];
      let quoteStatus = completeStatus;
      if (completeStatus === 'approved') {
        completeStatus = (this.compareArrOfObjs(this.originalProducts, products)) ? completeStatus : 'revised and ' + completeStatus
      }

      let emailData = {};
      let variables = {
        logo: 'https://app.yibas.com/img/Global-White.png',
        customer: this.quote.customer,
        productLine: this.quote.category,
        quoteNotes: this.quote.notes,
        adminNotes: this.quote.adminNotes,
        products: this.productsWithName,
        salesPerson: this.quote.user,
        status: completeStatus,
        statusCapital: completeStatus.charAt(0).toUpperCase() + completeStatus.slice(1),
        quoteId: this.data['quoteId']
      }
      emailData['to'] = this.salesPersonEmail;
      emailData['from'] = this.quoteAlertInfo.email.from;
      emailData['bcc'] = this.quoteAlertInfo.email.bcc;
      emailData['subject'] = this.quoteAlertInfo.email.subject + completeStatus.toUpperCase();
      if (!Meteor.settings.public.isProduction) {
        emailData['bcc'] = this.quoteAlertInfo.email.temp
      }

      if (quoteStatus === 'approved') {
        for (var i = 0; i < products.length; i++) {
          let query = {
            _id: this.contractId,
            "products._id": products[i].productId
          }
          let update = {
            $set: {
              'products.$.price': products[i].price,
              'products.$.previousPrice': this.rows[i].price,
              'products.$.isSynced': false
            }
          };
          let addToSetUpdate = {
            $addToSet: {
              products: {
                '_id': products[i].productId,
                'price': products[i].price,
                ...(this.rows[i].orginalPrice && { 'previousPrice': this.rows[i].orginalPrice }),
                ...(!this.rows[i].orginalPrice && { 'previousPrice': this.rows[i].price }),
                'isSynced': false,
                "createdUserId": Meteor.userId(),
                "createdAt": new Date()
              }
            }
          };
          this.updateDb(query, update, addToSetUpdate, this.rows[i])
        }
      }
      MeteorObservable.call('sendEmail', emailData, 'html-completeQuote.html', variables).subscribe(quote => { })
      this.router.navigate(['customers/quotes/']);
    }
  )
  }

  // convert price and previousPrice to Decimal
  convertToDecimal(update, addToSetUpdate) {
    update.$set['products.$.price'] =
      new Decimal(update.$set['products.$.price'] || 0);
    update.$set['products.$.previousPrice'] =
      new Decimal(update.$set['products.$.previousPrice'] || 0);

    addToSetUpdate.$addToSet.products.price =
      new Decimal(addToSetUpdate.$addToSet.products.price || 0);
    addToSetUpdate.$addToSet.products.previousPrice =
      new Decimal(addToSetUpdate.$addToSet.products.previousPrice || 0);
  }

  updateDb(query, update, addToSetUpdate, row) {
    this.convertToDecimal(update, addToSetUpdate);
    MeteorObservable.call('update', 'customerContracts', query, update).subscribe(res => {
      if (!res) {
        delete query['products._id'];
        MeteorObservable.call('update', 'customerContracts', query, addToSetUpdate).subscribe(res => {
          let log = {
            _id: Random.id(),
            documentId: this.contractId,
            collectionName: 'customerContracts',
            type: 'update.insert',
            fieldPath: `products_${row._id}`,
            log: '',
            createdAt: new Date(),
            url: window.location.pathname
          };
          log.log = `Insert Product ${row.product} (${row._id})
                  (${this.quote.customer} (${this.data["customerId"]}), 
                  ${this.quote.category} (${this.quote.categoryId}))
                  `;
          this.logService._log$(log).subscribe();
        })
      } else {
        let log = {
          _id: Random.id(),
          documentId: this.contractId,
          collectionName: 'customerContracts',
          type: 'update',
          fieldPath: `products_${row._id}`,
          log: '',
          createdAt: new Date(),
          url: window.location.pathname
        };
        log.log = `Update Product ${row.product} (${row._id}) 
                  (${this.quote.customer} (${this.data["customerId"]}), 
                  ${this.quote.category} (${this.quote.categoryId}))
                  contractPrice from ${addToSetUpdate.$addToSet.products.previousPrice} to ${addToSetUpdate.$addToSet.products.price}
                    `;
        this.logService._log$(log).subscribe();
      }
    })
  }

  getRows(rows) {
    this.rows = rows;
  }
  
  select(event){
    if (event.name === 'levelSelect' || event.name === 'overrideSelect') {
      event = event.value;
      this.updateProducts(event.row);
    } else if (event.name === 'grossProfitOverride'){
      event = event.value;
      this.grossProfitChange(event.row)
    }
  }

  grossProfitChange(row) {
    console.log(row);
    row.quotePrice = (row.stdCost / (100 - row.grossProfit) * 100);
    row.quotePrice = Number(row.quotePrice.toFixed(2));
    row.newValue = Number(row.quotePrice.toFixed(2));
  }

  updateGrossProfit(row) {
    row.grossProfit = (((row.quotePrice - row.stdCost) / row.quotePrice) * 100)
  }

  updateProducts(row){
    let objIndex = this.rows.findIndex((obj => obj._id == row._id));
    this.rows[objIndex].orginalPrice = row.price;
    this.rows[objIndex].quotePrice = Number((row[row.newHighlightFieldName]).toFixed(2));
    this.updateGrossProfit(this.rows[objIndex])
  }

  decimalMap(_item) {
    const item = { ..._item };
    if (item.price instanceof Decimal) {
      item.price = item.price.toNumber();
    }
    if (item.previousPrice instanceof Decimal) {
      item.previousPrice = item.previousPrice.toNumber();
    }
    return item;
  }

  compareArrOfObjs(arr1, arr2){
    // _.isMatch does not support deep compare
    arr1 = arr1.map(this.decimalMap);
    arr2 = arr2.map(this.decimalMap);

    let match;
    for (var i = 0; i < arr1.length; i++) {
      let objIndex = arr2.findIndex((element => element.productId == arr1[i].productId));
      match = _.isMatch(arr1[i], arr2[objIndex])
      if (!match) {
        break;
      }
    }
    return match;
  }

  onComplete(event) {
    this.rows = this.customerQuoteReviewLookup._getDirtyRows();
    this.rows.forEach(row => {
      row.highlightFieldName = 'quotePrice';
    });
  }

  generateQuoteProductsArray(){
    let productArr = [];
    this.rows.forEach(row => {
      let productObj = {
        "price": row.quotePrice,
        ...(row.orginalPrice && { 'previousPrice': row.orginalPrice }),
        ...(!row.orginalPrice && { 'previousPrice': row.price }),
        "productId": row._id
      }
      productArr.push(productObj);
    });
    return productArr;
  }
  
  goBack() {
    window.history.back();
  }
  
  getFilterConditions(action) {
    this.reducers(action);
  }

  reducers(action) {
    switch (action.type) {
      case 'UPDATE_FILTERCONDITIONS':
        this.filterConditions = action.value;
        return;
      case 'ADD_FILTER':
        this.filterConditions = action.value;
        return;
      default:
        return;
    }
  }

}
