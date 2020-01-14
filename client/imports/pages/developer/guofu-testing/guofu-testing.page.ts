import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {NotificationsService} from 'angular2-notifications';
import {FormGroup, FormBuilder, Validators} from '@angular/forms';
import * as moment from "moment";
import {MeteorObservable} from "meteor-rxjs";
import {Random} from "meteor/random";

import * as funcs from '../../../../../both/functions/common';
import {SystemLookup, SystemLookupModel} from "../../../../../both/models/systemLookup.model";
import {UserService} from "../../../services/UserService";
import {catchError, map, switchMap, tap} from "rxjs/operators";
import { of } from 'rxjs';
import {check, Match} from 'meteor/check';
import {CustomerModel} from "../../../../../both/models/customer.model";
import {SystemLog, SystemLogModel} from "../../../../../both/models/systemLog.model";
import {SystemLogsService} from "../../../services/SystemLogs.service";
// const {client} = MongoInternals.defaultRemoteCollectionDriver().mongo;


@Component({
  selector: 'guofu-testing',
  templateUrl: 'guofu-testing.page.html'
})

export class GuofuTestingPage implements OnInit{
  public form: FormGroup;
  public test: FormGroup;
  public submitted: boolean; // keep track on whether form is submitted

  private message: string;
  isProcessing = false;

  tenantId =  "m6nrO0P97uWmQZbwx";

  dateTimeConfig = {
    locale: moment.locale(),
    firstDayOfWeek: 'su',
    dayBtnFormat: "D",
    minutesInterval: 15,
    format: 'DD MMM YYYY hh:mm A'
  };

  config = {
    isReactiveUpdate: false
  };


  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };

  errors: Object[] = [];
  lookupTests: {
    lookupId: string;
    lookupName: string;
    tests: any[],
    numberOfErrors: number;
  }[] = [];

  constructor(
    private _userService: UserService,
    private _systemLogService: SystemLogsService,
  private router?: Router,
    private _service?: NotificationsService,
    private _fb?: FormBuilder,
  ) {

  }


  public options = {
    timeOut: 5000,
    lastOnBottom: true,
    clickToClose: true,
    maxLength: 0,
    maxStack: 7,
    showProgressBar: true,
    pauseOnHover: true,
    preventDuplicates: false,
    preventLastDuplicates: 'visible',
    rtl: false,
    animate: 'scale',
    position: ['right', 'bottom']
  };

  private html = `<p>Test</p><p>A nother test</p>`;

  ngOnInit() {

    this.form = this._fb.group({
      address: this._fb.group({
        street: ['globalthe source', <any>Validators.required],
        postcode: ['', <any>Validators.required]
      }),
      test: ['']
    });
    // this.form.patchValue(
    //   {
    //     address: {
    //       street: 'test'
    //     }
    //   }
    // );



    let temp;
    // SystemLookup._GetReferredLookup$(this._userService.user, 'workOrderRelease')
    //   .pipe(
    //     map(res => {
    //       return new SystemLookup(res);
    //     }),
    //     switchMap((lookup: SystemLookup) => {
    //       let data = {
    //         startDate: new Date(),
    //         endDate: moment().endOf('year').toDate(),
    //         forecastPercent: 1
    //       }
    //       console.log('date', data);
    //       lookup.objLocal = {data};
    //       temp = lookup;
    //
    //       return lookup._getAggregateResult$();
    //     }),
    //     tap(result => {
    //       console.log('resut', result);
    //     }),
    //     switchMap(() => {
    //       return temp._getAggregateResultCount$()
    //     }),
    //     tap((res) => {
    //       console.log("res'", res);
    //     })
    //   )
    //   .subscribe((res) => {
    //     // console.log('res', res);
    //     // let  = new SystemLookup(res);
    //
    //   })



    // SystemLookup._GetReferredLookup$(this._userService.user, 'customerOrders')
    //   .pipe(
    //     map(res => {
    //       return new SystemLookup(res);
    //     }),
    //     switchMap((lookup: SystemLookup) => {
    //       let data = {
    //         startDate: new Date(),
    //         endDate: moment().endOf('year').toDate(),
    //         forecastPercent: 1
    //       }
    //       console.log('date', data);
    //       lookup.objLocal = {data};
    //       temp = lookup;
    //
    //       return lookup._getAggregateResult$();
    //     }),
    //     tap(result => {
    //       console.log('resut', result);
    //     }),
    //     switchMap(() => {
    //       return temp._getAggregateResultCount$()
    //         .pipe(catchError(error => of('asdfasdf', error)))
    //     }),
    //     tap((res) => {
    //       console.log("res'", res);
    //     })
    //   )
    //   .subscribe((res) => {
    //     // console.log('res', res);
    //     // let  = new SystemLookup(res);
    //
    //   })

    let date = moment(new Date('14 Oct 2017 3:15 PM')).add(1, 'hours').format(this.dateTimeConfig.format);
    this.test = this._fb.group({selectedDate: [date]});

  }

  testLookup_customers() {
    this.lookupTests = [];
    let lookupTest = {
      lookupId: "",
      lookupName: 'customers',
      tests: [],
      numberOfErrors: 0
    }
    let tempLookup;
    let lookupModel: SystemLookupModel;
    SystemLookup._GetReferredLookup$(this._userService.user, 'customers')
      .pipe(
        map((res:any) => {
          lookupTest.lookupId = res._id;
          if (!res.objLocal) {
            res.objLocal = {};
          }
          Object.assign(res.objLocal, {tenantId: this.tenantId});
          lookupModel = res;
          return new SystemLookup(res);
        }),

        switchMap((lookup: SystemLookup) => {
          tempLookup = lookup;
          return lookup._getAggregateResult$();
        }),
        // test 1
        tap((res:any) => {
          if (res.length > 0) {
            let pattern = {
              _id: String,
              number: String,
              name: String,
              city: String,
              state: String,
              zipCode: String,
              contractId: String
            };

            let test = {
              message: "Result should follow a pattern",
              errorMessage: "",
              passed: true
            }
            try {
              check(res[0], pattern);
            } catch(error) {
              test.errorMessage = error.message;
              test.passed = false;
              // lookupTest.tests.push({
              //   passed: false,
              //   message: error.message,
              //   error
              // });
            }

            lookupTest.tests.push(test);

          }
        }),
        switchMap(() => this.calculateCount(tempLookup)),

        tap(result => {

          let count = result[0].count;
          let test = {
            message: 'Number of result should be 3',
            passed: false
          };
          if (count == 3) {
            test.passed = true;
          } else {
            test.passed = false;
          }
          lookupTest.tests.push(test);
        }),
        switchMap(() => {
          let lookup = new SystemLookup(lookupModel);
          lookup.keywords = 'ABC';

          let test = {
            message: "Should show only 1 result when search keywords 'ABC'",
            passed: false
          };

          return lookup._getAggregateResult$().pipe(
            switchMap(() => lookup._getAggregateResultCount$()))
        }),
        tap(res => {
          let count = res[0].count;
          let test = {
            message: "Should show only 1 result when search keywords 'ABC'",
            passed: false
          };
          if (count == 1) {
            test.passed = true;
          } else {
            test.passed = false;
          }
          lookupTest.tests.push(test);

        }),
        catchError((error) => {
          lookupTest.tests.push({
            passed: false,
            message: error.message
          });
          return of(null);
        })
      )
      .subscribe((res) => {
        lookupTest.numberOfErrors = lookupTest.tests.filter(_test => !_test.passed).length;
        this.lookupTests.push(lookupTest);
      })
  }

  onBlur(name) {

  }

  // catchError = (err) => {
  //   this.errors.push(err)
  //   return of('');
  // }

  // catchError(err) {
  //   this.errors.push({
  //     err: err
  //   })
  // }

  calculateCount(lookup: SystemLookup) {
    return lookup._getAggregateResultCount$()
      .pipe(catchError(error => of('count error', error)))
  }

  submit(value, valid) {
    this.submitted = true;
  }

  // updateCustomerContractsProductsPrice() {
  //   const json = this.getJsonObj();
  //
  //   MeteorObservable.call('customerContracts.updateProductsPrice').subscribe((res:any) => {
  //     res.forEach(async(contract) => {
  //       let needUpdate = false;
  //       contract.products.forEach(product => {
  //         const tempProduct = Object.assign({}, product);
  //         tempProduct.contractId = contract._id;
  //         let newProduct:any = this.getUpdatedProduct(tempProduct, json);
  //         if (!funcs.isEmptyObject(newProduct)) {
  //           needUpdate = true;
  //           product.price = newProduct.price;
  //           product.previousPrice = newProduct.previousPrice;
  //           product.isSynced = false;
  //         }
  //         delete product['categoryName'];
  //         delete product['productName'];
  //         delete product['categoryId'];
  //       });
  //       if (needUpdate) {
  //
  //         let query = {_id: contract._id};
  //         let update = {
  //           $set: {
  //             products: contract.products
  //           }
  //         };
  //         let result = await funcs.callbackToPromise(MeteorObservable.call('update', 'customerContracts', query, update));
  //         // MeteorObservable.call('update', 'Copy_of_customerContracts', {_id: contract._id},
  //         //   {
  //         //     $set: {
  //         //       products: contract.products
  //         //     }
  //         //   }).subscribe(res => {
  //         // });
  //       }
  //     })
  //   });
  // }

  getUpdatedProduct(product:any, json:any) {
    let index1 = -1;
    let index2 = -1;
    let index3 = -1;
    let targetCase;

    index1 = json.cases.findIndex((_case:any) => {
      if ('value' in _case) {
        if (_case.value.includes(product.contractId)) {
          // find contract id
          return true;
        } else {
          return false;
        }
      }  else {
        return false;
      }
    });

    if (index1 == -1) {
      index1 = 0;
    }
    // get top index

    if ('switch' in json.cases[index1]) {
      index2 = json.cases[index1].switch.cases.findIndex(_case => {
        if ('value' in _case) {
          if (_case.value.includes(product.categoryName)) {
            // find category name
            return true;
          } else {
            return false;
          }
        } else
          return false;
      });
      if (index2 == -1) {
        index2 = 0;
      }

      if ('switch' in json.cases[index1].switch.cases[index2]) {
        index3 = json.cases[index1].switch.cases[index2].switch.cases.findIndex(_case => {
          if ('value' in _case) {
            if (_case.value.includes(product.productName)) {
              // find product name
              return true;
            } else {
              return false;
            }
          } else
            return false;
        });
        if (index3 == -1) {
          index3 = 0;
        }
      }
    }

    if (index3 > -1) {
      targetCase = json.cases[index1].switch.cases[index2].switch.cases[index3];
    } else if (index2 > -1) {
      targetCase = json.cases[index1].switch.cases[index2];
    } else {
      targetCase = json.cases[index1];
    }

    if ('rate' in targetCase) {
      this.setPriceWithRate(product, targetCase);
    } else if ('price' in targetCase) {
      this.setPriceWithPrice(product, targetCase);
    }

    if ('rate' in targetCase || 'price' in targetCase) {
      return {
        price: Number(product.price.toFixed(2)),
        previousPrice: Number(product.previousPrice.toFixed(2)),
        isSynced: false
      }
    } else {
      return {};
    }
  }


  setPriceWithRate(product, _case) {
    let newPrice = product.price * _case.rate;
    product.previousPrice = product.price;
    product.price = newPrice;
  }

  setPriceWithPrice(product, _case) {
    let newPrice = _case.price;
    product.previousPrice = product.price;
    product.price = newPrice;
  }


  getPermission() {
    this._service.success(

      'Some Title',
      'Some Content',
      {
        timeOut: 5000,
        showProgressBar: true,
        pauseOnHover: false,
        clickToClose: false,
        maxLength: 10
      }
    )
  }

  testFunc() {

    // let document = {_id: Random.id(), actions: [], createdAt: new Date(), createdUserId: Meteor.userId()};

    let methods:any = [
      {
        _id: Random.id(),
        collectionName: "transactions",
        methodType: "insert",
        args: [
          {
            _id: Random.id(),
            "lineItems" : [
              {
                "_id" : "WurdcexP4naDtGdkF",
                createdAt: new Date(),
                "createdUserId" : "YoKFKBqCosExsKBHE",
                "wharehosueId" : "XZS76uMBAx3nLuqRu",
                "binId" : "OlygyPAnmsMDjOVvN",
                "qty" : 245,
                "cost" : 15.901
              },
              {
                "_id" : "u2SzhRycTmq3yCA9E",
                createdAt: new Date(),
                "createdUserId" : "YoKFKBqCosExsKBHE",
                "wharehosueId" : "XZS76uMBAx3nLuqRu",
                "binId" : "qvy9DqyA30TwNpauo",
                "qty" : 245,
                "cost" : 0.009
              }
            ],
          }
        ],
      },
      {
        _id: Random.id(),
        collectionName: "transactions",
        methodType: "insert",
        args: [
          {
            _id: Random.id(),
            "lineItems" : [
              {
                "_id" : "WurdcexP4naDtGdkF",
                createdAt: new Date(),
                "createdUserId" : "YoKFKBqCosExsKBHE",
                "wharehosueId" : "XZS76uMBAx3nLuqRu",
                "binId" : "OlygyPAnmsMDjOVvN",
                "qty" : 245,
                "cost" : 15.901
              },
              {
                "_id" : "u2SzhRycTmq3yCA9E",
                createdAt: new Date(),
                "createdUserId" : "YoKFKBqCosExsKBHE",
                "wharehosueId" : "XZS76uMBAx3nLuqRu",
                "binId" : "qvy9DqyA30TwNpauo",
                "qty" : 245,
                "cost" : 0.009
              }
            ],
          }
        ]
      }
    ];

    methods = [];
    let randomId = Random.id();
    methods.push({
      _id: Random.id(),
      methodType: "UPDATE",
      log: {
        _id: Random.id(),
        type: "UPDATE",
        log: "Update product (Om36P5pEhJiwk1I6h) qty in warehouse(XZS76uMBAx3nLuqRu) bin(KYMFTansGoWZ3tMPf)",
        documentId: "Om36P5pEhJiwk1I6h",
        collectionName: "products",
        fieldPath: "warehouses_XZS76uMBAx3nLuqRu.bins_KYMFTansGoWZ3tMPf.qtyOnHand_number",
        value: false,
        previousValue: null
      },
      args: [
        {
          _id: "Om36P5pEhJiwk1I6h",
          "warehouses._id": "XZS76uMBAx3nLuqRu",
        },
        {
          $inc: {
            "warehouses.$[].bins.$[bin].qtyOnHand": 10
          }
        },
        {
          arrayFilters: [
            {
              "bin._id": "KYMFTansGoWZ3tMPf"
            }
          ]
        }
      ]
    });

    // this.isProcessing = true;

    // MeteorObservable.call('test', methods)
    //   .subscribe(
    //     res => {
    //       this.isProcessing = false;
    //       console.log('asdfasdf', res, this.isProcessing);
    //     }
    //   );


    MeteorObservable.call('runTransactions', methods, this._systemLogService.systemLog)
      .pipe(
        tap(res => {
          console.log('res', res);
        }),
      )
      .subscribe();

    // MeteorObservable.call('insert', 'systemLogs', )
    //   .subscribe(res => {
    //     console.log('res', res);
    //
    //     // let code = res[7].value.code;
    //     // var fn = eval(res[7].value);
    //     // console.log('fs', fn);
    //
    //   })
    // console.log('asdfasdf');
    // MeteorObservable.call('checkContractProductPrice')
    //   .subscribe(res => {
    //     console.log(res);
    //   })
    // MeteorObservable.call('find', 'customerContracts', {})
    //   .pipe(
    //     tap(res => {
    //       console.log('res', res);
    //
    //     }))
    //   .subscribe();
  }

  _getLog(method) {

    let log = this._systemLogService.systemLog._getLogData(method);
    console.log('log', log);

  }
}
