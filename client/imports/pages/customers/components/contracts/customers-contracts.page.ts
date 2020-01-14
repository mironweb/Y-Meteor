import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { MatDialog } from '@angular/material';
import { DialogComponent } from "../../../../modules/shared-module/dialog/dialog.component";
import {ActivatedRoute, Router} from '@angular/router';
import * as XLSX from 'xlsx';
import * as funcs from '../../../../../../both/functions/common';
import * as fonts from '../../../../../../both/functions/fonts/arialExport';
import * as pdf from '../../../../../../both/functions/priceSheetPdf';

import {MeteorObservable} from "meteor-rxjs";

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as moment from 'moment';
import {Session} from "meteor/session";
import * as systemConfig from '../../../../../../both/config/systemConfig';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {PageResolver} from "../../../../resolvers/PageResolver";
import { Random } from 'meteor/random';
import {NotificationsService} from "angular2-notifications";

import { CustomersService } from "../../customers.service";
import {EventEmitterService} from "../../../../services/index";
import { Subscription } from 'rxjs/Subscription';
import {SystemLogsService} from "../../../../services/SystemLogs.service";
import {Action} from "../../../../../../both/models/systemLog.model";
import {UserGroupsService} from "../../../../services/UserGroups.service";
import {SystemOptionsService} from "../../../../services/SystemOptions.service";
import {map, switchMap, take, tap} from "rxjs/operators";

import * as ExcelJS from 'exceljs/dist/exceljs.min';

import {saveAs} from 'file-saver';
import {UserService} from "../../../../services/UserService";
import {Observable} from "rxjs/Observable";
import {from, of} from "rxjs";

@Component({
  selector: 'customers-contracts',
  templateUrl: 'customers-contracts.page.html',
  styleUrls: ['../customers.scss'],
  providers: [NotificationsService]
})

export class CustomersContractsPage implements OnInit, OnDestroy{

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private _router: Router,
    private _service: NotificationsService,
    private _customerService: CustomersService,
    private _fb: FormBuilder,
    private systemLogsService: SystemLogsService,
    private userGroupService: UserGroupsService,
    private _userService: UserService,
    private systemOptionsService: SystemOptionsService
  ) {
    pdfFonts.pdfMake;
    fonts.arial;
  }

  @ViewChild('contractPricingLookup') contractPricingLookup;

  public options = systemConfig.alertOptions;
  selectCustomerData:any = {};
  progressPercentage = 0;
  normalTableData: any;
  isDeveloper;
  filterConditions: any;
  isDataTableLoading: boolean = false;
  enableCheckUpdate = true;
  isSyncing = false;

  queryParams: any;
  years = systemConfig.years;
  sub: Subscription;
  config = {
    enableMultipleUsersUpdate: true
  };
  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true,
    gt: new Date(),
    customerId: null,
    categoryId: null,
    startDate: moment().startOf('year').toDate(),
    endDate: moment().hour(23).minutes(59).seconds(59).toDate()
  };
  customerLabel:string;
  categoryLabel:string;
  products: any[] = [];
  email: any[] = [];
  state: any = {};
  syncText = 'Please wait......';

  contractForm: FormGroup;
  isTestWebsite: false;

  columns: any;
  displayedColumns: any;

  fullCustomerContract: any;
  productInContract: boolean = true;
  viewAll: boolean = false;
  pdfLoading: boolean = false;
  lastUpdated: any;

  init() {
    Session.set('eventName', '');
    Object.assign(this.state, {
      view: '',
      categoryId: '',
      customerId: '',
      contractId: '',
      contractCategory: {},
      customer: {},
      categories: [],
      category: {},
      doc: {},
      currentPriceTag: 'contractPrice',
      newPriceTag: '',
      copyContract: {
        fromCustomer: {},
        fromCustomerLabel: '',
        toCustomerLabel: '',
        selectedToCustomer: {},
        toCustomersList: [],
        increasePercentage: 0,
        copyData: {
          contractId: ''
        }
      },
      updateContract: {
        selectedCustomers: [],
        increasePercentage: 0
      },
      queryParams: {}
    });
    this.customerLabel = '';
    this.categoryLabel = '';
  }

  downloadExcel(html) {
    // const html = document.getElementById('out').innerHTML;
    Meteor.call('download', html, function(err, wb) {
      if (err) throw err;
      /* "Browser download file" from SheetJS README */
      XLSX.writeFile(wb, 'sheetjs.xlsx');
    });
  }

  async generateExcel() {
    function getNextFriday() {
      let dayINeed = 5;
      let today = moment().isoWeekday();
      let nextFriday;
      if (today <= dayINeed) {
        nextFriday = moment().isoWeekday(dayINeed);
      } else {
        nextFriday = moment().add(1, 'weeks').isoWeekday(dayINeed);
      }
      return nextFriday.format('MMM. D');
    }
    EventEmitterService.Events.emit({name: "isProcessing", value: true});
    let categories = this.state.categories;
    let categoriesArr = [];

    for (let i = 0; i < categories.length; i++) {
      categoriesArr.push(categories[i]._id)
    }

    let customerAndCategoryIds = {
      customerId: this.state.customer._id,
      categoryId: categoriesArr
    };

    this._getLastUpdated$()
      .pipe(
        switchMap(() => {
          return MeteorObservable.call('getFullContract', customerAndCategoryIds);
        }),
        switchMap((contract:any) => {
          if (contract) {
            // setup workbook
            let workbook = new ExcelJS.Workbook();
            workbook.creator = this._userService.user.profile.firstName + " " + this._userService.user.profile.lastName;
            workbook.created = new Date();
            let worksheet = workbook.addWorksheet('sheet');

            worksheet.columns = [
              { width: 34 },
              { width: 32 },
              { width: 20 },
              { width: 32 },
              { width: 10, style: {alignment: {horizontal: 'right'}, numFmt: '"$"#,##0.00' }}
            ];

            let excelInfo = {
              customer: this.customerLabel,
              content: contract,
              revised: this.lastUpdated
            };
            let data = [];

            contract.forEach(res => {
              let expire = res._id =='5700' ? ' (Expires ' + getNextFriday() + ')' : '';
              data.push([res.categoryDescription + expire, 'Customer Part No.', 'Global Part No.', 'Description', 'Price/each', 'Case Qty']);
              res.row.forEach(_row => {
                data.push(['', _row.customerPartNo, _row.partNumber, _row.description, _row.price, _row.caseQty]);
              });
            });

            let ws_data = [
              [],
              [excelInfo.customer, "Prices effective " + moment(new Date(excelInfo.revised)).format('MMM D, YYYY') ],
              ...data,
              ['Pricing subject to change without notice']
            ];

            worksheet.addRows(ws_data);
            return from(workbook.xlsx.writeBuffer());
          } else {
            return of(null)
          }
        }),
        map((data) => {
          if (data) {
            let blob = new Blob([data], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
            saveAs(blob,  this.customerLabel + ".xlsx");

            return true;
          } else {
            return false;
          }
        }),
        switchMap((res) => {
          if (res) {
            let log = {
              log: "Generate Excel success",
              collectionName: "Excel Button",
              url: window.location.pathname,
              createdAt: new Date(),
              _id: Random.id()
            };

            return this.systemLogsService._log$(log);
          } else {
            return of(null);
          }
        })
      ).subscribe(() => {
      EventEmitterService.Events.emit({name: "isProcessing", value: false});
    });
  }

  hookEvents() {
    let events = [];
    let pageRoute = this.systemOptionsService.getCurrentPageRoute();
    if (pageRoute.data  && 'buttons' in pageRoute.data) {
      pageRoute.data.buttons.forEach(button => {
        if ('eventName' in button) {
          events.push(button.eventName);
        }
      })
    }
    if (events.length > 0) {
      this.sub = EventEmitterService.Events.subscribe(async (event) => {
        switch(event.name) {
          case 'generatePDF':
            this.pdf();
            break;
          case 'generateExcel':
            this.generateExcel();
            break;
          case 'copy':
            if (!funcs.isEmptyObject(this.state.customer)) {
              await this.setFromCustomer(this.state.customer);
            } else {
              this.unsetFromCustomer();
            }
            this.showView('copy');
            break;
          case 'bulkUpdate':
            CustomersService.increasePercentage = 0;
            CustomersService.isSlideChecked = false;
            CustomersService.selectedCustomers = [];
            if (!funcs.isEmptyObject(this.state.customer)) {
              CustomersService.selectedCustomers.push(this.state.customer);
            }

            this.showView('update');
            break;
          default:
            break;
        }
      })
    }
  }

  async ngOnInit() {

    this._userService.user._getManagedUsers$()
      .pipe(
        map((users:any) => {
            return users.map(_user => {
              return _user._id
            })
          }
        )
      )
      .subscribe(res => {
        this.selectCustomerData = {
          manageUserIds: res
        };
      })


    this.isTestWebsite = Meteor.settings.public.isTestWebsite;
    this.init();

    this.hookEvents();
    this.normalTableData = {
      columns:[],
      rows: []
    };

    this.normalTableData.columns = [
      {
        prop: 'year',
        label: 'Year',
      }, {
        prop: 'units',
        label: 'Units',
        cellTemplate: 'number'
      },
      {
        prop: 'revenue',
        label: 'Revenue',
        cellTemplate: 'currency'
      },
      {
        prop: 'cost',
        label: 'Cost',
        cellTemplate: 'currency'
      },
      {
        prop: 'gp',
        label: 'GP',
        cellTemplate: 'percent'
      },
      {
        prop: 'net',
        label: 'Net',
        cellTemplate: 'currency'
      }
    ];

    this.normalTableData.rows = [];

    this.isDeveloper = PageResolver.isDeveloper;

    this.columns = [
      {
        prop: 'year',
        name: 'Year',
        cellTemplate: 'qtyTmpl'
      }, {
        prop: 'units',
        name: 'Units',
        cellTemplate: 'qtyTmpl'
      },
      {
        prop: 'revenue',
        name: 'Revenue',
        cellTemplate: 'currencyTmpl'
      },
      {
        prop: 'cost',
        name: 'Cost',
        cellTemplate: "currencyTmpl"
      },
      {
        prop: 'gp',
        name: 'GP',
        cellTemplate: "percentTmpl"
      },
      {
        prop: 'net',
        name: 'Net',
        cellTemplate: 'currencyTmpl'
      }
    ];

    this.displayedColumns = ['year', 'units', 'revenue', 'cost', 'gp', 'net'];


    this.route.params.subscribe((matrixParams) => {
      if ('view' in matrixParams) {
        this.state.view = matrixParams.view;
      } else {
        this.state.view = '';
      }
    })

    this.route.queryParams
      .subscribe(async (params) => {
        let params_copy = Object.assign({}, params);

        if (Object.keys(params_copy).length == 0) {
          if (this.state.view == '' || !this.state.view) {
            this.init();
          }
        }
        let compareResult = funcs._isObjectChangedAll(params, this.state.queryParams);

        if (compareResult) {
          this.state.queryParams = params_copy;
          let urlParams:any = funcs.parseUrlParams(params);
          let newState = {};
          Object.assign(newState, urlParams);
          const isChanged = funcs._isObjectChanged(this.state, newState, ['categoryId', 'customerId', 'startYear']);
          await this.parseUrlKeys(urlParams);
          if (isChanged) {
            if (!funcs.isEmptyObject(urlParams)) {
              if ('customerId' in urlParams && 'categoryId' in urlParams) {
                this.state.customerId = urlParams.customerId;
                this.state.categoryId = urlParams.categoryId;
                this.setLevel5();
                if ('startYear' in urlParams) {
                  this.setYear(urlParams.startYear);
                }
              } else {

              }
            }

            if (this.state.customerId && this.state.categoryId && this.state.startYear)
              this.setLoading(false);
            Session.set('enableCheckUpdate', true);
          } else {
            Session.set('enableCheckUpdate', false);
          }
        } else {
          this.setLoading(false);
        }
      });

    MeteorObservable.call('checkSystemPermission', Meteor.userId(), { name: 'viewAllContractPricing'}).subscribe(permission => {
      if (permission['result'].length > 0 && permission['result'][0].status === 'enabled') {
        this.viewAll = true;
      } else {
      }
    });
  }

  async parseUrlKeys(urlParams) {
    await Promise.all(Object.keys(urlParams).map(async(key) => {

      let result:any;
      switch(key) {
        case 'customerId':
          result = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'customers', {_id: urlParams[key]}));
          Object.assign(this.data, {customer: result});
          await this.setCustomer(result).catch(error => console.log('error', error));
          break;
        case 'categoryIds':
          if (!('categories' in this.state)) {
            this.state.categories = [];
          }
          let query = {};
          if ((typeof urlParams[key]) == 'string') {
            query = {
              _id: urlParams[key]
            }
          } else {

            query = {
              _id: {
                $in: urlParams[key]
              }
            };
          }

          this.state.categories = await MeteorObservable.call('find', 'categories', query, {sort: {name: 1}}).toPromise();
          let category = this.state.categories.find(_category => _category._id == urlParams['categoryId']);
          Object.assign(this.data, {category});
          this.state.category = category;
          this.state.categoryId = this.state.category._id;
          this.categoryLabel = category.name + " - " + category.description;

          break;
        case 'startYear':
          this.state.startYear = Number(urlParams[key]);
          break;
      }
    }));
    if (!('startYear' in urlParams)) {
      this.state.startYear = systemConfig.years[0];
      if (this.state.customerId && this.state.categoryId) {
        this.state.startYear = this.state.startYear;
        this.state.endYear = this.state.startYear + 1;
      }
    }
  }

  setLoading(value) {

    if (this.state.view == '' || this.state.view == undefined) {
      if (this.state.categories.length > 0 && this.state.customerId && this.state.customerId != '') {
        this.isDataTableLoading = value;
      } else {
        this.isDataTableLoading = false;
      }
    }
  }

  getModalData(data) {

  }

  setYear(year) {
    this.state.startYear = Number(year);

    const years = [this.state.startYear, this.state.startYear-1];

    this.normalTableData.rows = [];

    years.forEach(async(year=2017) => {
      const result:any = await funcs.getCustomerCategorySales(year, this.state.customerId, this.state.categoryId);

      let row:any = [];
      if (result.length > 0) {
        row = [year,
          result[0].units,
          Number(result[0].revenue.toFixed(2)),
          Number(result[0].cost.toFixed(2)),
          result[0].gp,
          Number(result[0].net.toFixed(2))];
      } else {
        row = [year, 0, 0, 0, 0, 0];
      }
      this.normalTableData.rows.push(row);
    });
    this._router.navigate([], {queryParams: {"startYear": this.state.startYear, "endYear": this.state.startYear + 1}, queryParamsHandling: 'merge'});
  }

  selectCustomer() {
    let dialogRef = this.dialog.open(DialogComponent, {
      height: '600px',
      width: '800px',
    });
    dialogRef.componentInstance.lookupName = 'customers';

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.navigateCustomer(result);
        // Object.assign(this.data, {customerId: result._id});

        // this._router.navigate([], {queryParams: {'url.customerId': result._id}, queryParamsHandling: 'merge'});
      }
    })
  }

  onSelectCustomer(event) {
    this.showView('');
    this.navigateCustomer(event);
  }

  addUpdatedCustomers(event) {
    let customer = event.value;
    let customerIds = CustomersService.selectedCustomers.map(customer => {
      return customer._id;
    });

    if (customerIds.indexOf(customer._id) == -1) {
      CustomersService.selectedCustomers.push(customer);
    }

    CustomersService.selectedCustomers = funcs._sort(CustomersService.selectedCustomers, 'name');

    this.showView('update');
  }

  addToCustomer(event) {
    if (event.name == 'onClickRow' || event.name == 'onOneResult') {
      let customer = event.value;
      let action: Action = {
        collectionName: "COPY_CONTRACT",
        type: "ADD_TO_CUSTOMERS",
        url: window.location.pathname,
        createdAt: new Date(),
        log: "",
        documentId: customer._id,
      };

      action.log = `
      Add to_customers ${customer.customer}, {customerId: ${customer._id}, contractId: ${customer.contractId}}
    `;
      this.systemLogsService._log$(action).subscribe();

      this.state.copyContract.selectedToCustomer = customer;
      let newState = {
        isToCustomerListShown: false,
        isCopyContractShown: true,
      };

      let copyContract = {
        toCustomerLabel: customer.number + ' - ' + customer.name
      };

      let customerIds = this.state.copyContract.toCustomersList.map(customer => {
        return customer._id;
      });
      if (customerIds.indexOf(customer._id) === -1) {
        this.state.copyContract.toCustomersList.push(customer);
      }

      this.state.copyContract.toCustomersList = funcs._sort(this.state.copyContract.toCustomersList, 'name');

      Object.assign(this.state, newState);
      Object.assign(this.state.copyContract, copyContract);
      this.showView('copy');
    }

  }

  async onSelectFromCustomer(event) {
    await this.setFromCustomer(event.value);
    this.showView('copy');
  }

  async setFromCustomer(customer) {
    this.state.contractId = customer.contractId;

    let action: Action = {
      collectionName: "COPY_CONTRACT",
      type: "SET_FROM_CUSTOMER",
      url: window.location.pathname,
      createdAt: new Date(),
      log: "",
      documentId: customer._id
    };



    action.log = `
      Change from customer to ${customer.number}, {customerId: ${customer._id}, contractId: ${customer.contractId}}
    `

    this.systemLogsService._log$(action).subscribe();

    let copyContract = {
      fromCustomerLabel: customer.number + ' - ' + customer.name
    };

    let contractId = await funcs.getContractIdByCustomerId(customer._id);

    this.state.copyContract.copyData = {
      contractId: contractId
    }
    Object.assign(this.state.copyContract, copyContract);
  }

  unsetFromCustomer() {
    let copyContract = {
      fromCustomer: {},
      fromCustomerLabel: '',
      toCustomerLabel: '',
      selectedToCustomer: {},
      toCustomersList: [],
      increasePercentage: 0,
      copyData: {
        contractId: ''
      }
    };
    Object.assign(this.state.copyContract, copyContract);
  }

  onSelectCateogry(event) {
    this.showView('');
    this.processCategory(event);
  }

  selectProductLine() {
    let dialogRef = this.dialog.open(DialogComponent, {
      height: '600px',
      width: '800px',
    })
    dialogRef.componentInstance.lookupName = 'selectCategory';
    dialogRef.componentInstance.data = {
      value: {
        $in: [null, false]
      },
      hidden: true
    };

    dialogRef.afterClosed().subscribe(async(result) => {
      if (result) {

        let categoryIds = this.state.categories.map(category => {
          return category._id;
        });
        if (categoryIds.indexOf(result._id) === -1) {
          this.setLoading(true);
          this.state.categories.push(result);
        }
        this.state.categories = funcs._sort(this.state.categories, 'name');

        categoryIds = this.state.categories.map(category => {
          return category._id;
        });
        let routeParams:any = await funcs.callbackToPromise(this.route.queryParams);
        let queryParams:any = {};
        Object.assign(queryParams, routeParams);

        if ('keywords' in queryParams) {
          delete queryParams.keywords;
        }
        queryParams['url.categoryIds'] = categoryIds;
        queryParams['url.categoryId'] = result._id;

        this._router.navigate([], {queryParams});
      }
    })
  }

  async processCategory(event) {
    if (event.name == 'onClickRow' || event.name == 'onOneResult') {
      let category = event.value;
      let log = {
        log: "Select a category " + category._id,
        collectionName: "customersContracts",
        url: window.location.pathname,
        createdAt: new Date(),
        _id: Random.id()
      };
      this.systemLogsService._log$(log).subscribe();

      if (category) {
        Object.assign(this.data, {category: category});
        let categoryIds = new Set();
        let oldQueryParams:any = await this.route.queryParams.pipe(take(1)).toPromise();
        let queryParams:any = {};
        Object.assign(queryParams, oldQueryParams);

        if ('categoryIds' in oldQueryParams) {
          if (typeof oldQueryParams.categoryIds == 'string') {
            categoryIds.add(oldQueryParams.categoryIds);
          } else {
            categoryIds = new Set(oldQueryParams.categoryIds);
          }
        }
        categoryIds.add(category._id);
        delete queryParams.keywords;

        queryParams['categoryIds'] = Array.from(categoryIds);
        queryParams['categoryId'] = category._id;
        if (this.state.customerId) {
          queryParams.startYear = 2017;
          queryParams.endYear = 2018;
        }

        this._router.navigate(['.', {}], {queryParams, queryParamsHandling: 'merge', relativeTo: this.route});
      }
    }
  }

  async setCustomer(customer) {
    this.state.customer = customer;
    this.state.customerId = customer._id;
    this.customerLabel = this.state.customer.number + ' - ' + this.state.customer.name;
    this.state.contractId = customer.contractId;

    Object.assign(this.data, {contractId: this.state.contractId});
  }

  async setLevel5() {
    let result:any = await funcs.getContractCategory(this.state.contractId, this.state.categoryId);

    if (result.length > 0) {
      this.state.contractCategory = result[0];
    } else {
      this.state.contractCategory = {
        priceLevel5Percent: 0
      }
    }
  }

  async navigateCustomer(event) {
    if (event.name == 'onClickRow' || event.name == 'onOneResult') {
      let customer = event.value;
      let log = {
        log: "Select a customer " + customer._id,
        collectionName: "customersContracts",
        url: window.location.pathname,
        createdAt: new Date(),
        _id: Random.id()
      };
      this.systemLogsService._log$(log).subscribe();

      if (!funcs.isEmptyObject(customer)) {
        Object.assign(this.data, customer);
      }
      this._router.navigate(['.', {}], {queryParams: {'customerId': customer._id}, queryParamsHandling: 'merge', relativeTo: this.route});
    }

  }

  addCategory(category) {

    this.state.categories = funcs._addObjectToArray(category, '_id', this.state.categories);
    let result = funcs.sortArrayByKey(this.state.categories, 'name');
  }

  navigateCategory(category) {
    let queryParams = this.generateUrlParams();
    Object.assign(queryParams, {"categoryId": category._id});
    delete queryParams.sort;
    // this.contractPricing.reloadTable();
    this._router.navigate([], {queryParams});
  }

  async onPercentageChange(field, event) {
    let query = {
      _id: this.state.category._id
    };
    let update = {
      $set: {
        [field]: parseFloat(event.target.value)
      }
    };
    await funcs.update('categories', query, update);
  }

  async onLevel5Change(e) {
    let categoryPercentage = e.target.value;
    this.state.contractCategory.priceLevel5Percent = Number(categoryPercentage);
    Session.set('enableCheckUpdate', true);
    let query:any = {
      _id: this.state.contractId,
      "categories._id": this.state.categoryId
    };
    if (!this.state.contractCategory.priceLevel5Percent) {
      this.state.contractCategory.priceLevel5Percent = 0;
    }

    const docs:any = await funcs.callbackToPromise(MeteorObservable.call('find', 'customerContracts', query));
    let update:any ={};

    let type = 'UPDATE';
    let log:any = {
      _id: Random.id(),
      documentId: this.state.contractId,
      collectionName: 'customerContracts',
      document: this.state.contractId,
      type: 'update.insert',
      field: 'products',
      fieldPath: `categories_${this.state.categoryId}`,
      log: '',
      createdAt: new Date(),
      pathname: window.location.pathname
    };
    if (docs.length > 0) {
      update = {
        "$set": {
          "categories.$.priceLevel5Percent": new Decimal(this.state.contractCategory.priceLevel5Percent || 0)
        }
      };
      type = 'UPDATE';
      log.type = 'UPDATE';
      log.fieldPath = `categories_${this.state.categoryId}.priceLevel5Percent_double`
    } else {
      query = {
        _id: this.state.contractId
      };
      update = {
        $addToSet: {
          categories: {
            _id: this.state.categoryId,
            priceLevel5Percent: new Decimal(this.state.contractCategory.priceLevel5Percent || 0)
          }
        }
      };
      type = 'UPDATE.INSERT';
      log.type = 'UPDATE.INSERT';
    }
    let fieldPath = `categories_${this.state.categoryId}`;

    let result = await funcs.callbackToPromise(MeteorObservable.call('update', 'customerContracts', query, update, {}));

    this.systemLogsService._log$(log).subscribe();
    if (result) {
      this.contractPricingLookup.reloadData('Category 5 changes ');
    }
  }



  removeCategory(category) {
    // remove the category from array
    this.state.categories = this.state.categories.filter(addedCategory => {
      if (addedCategory._id != category._id) {
        return true;
      }
    });

    // update categoryIds array
    this.state.categoryIds = this.state.categories.map(category => category._id);

    // if remove the current category
    if (this.state.category._id == category._id) {

      if (this.state.categories.length > 0) {
        // Session.set('enableCheckUpdate', true);
        this.navigateCategory(this.state.categories[0]);
      } else {

        // Session.set('enableCheckUpdate', false);
        this.state.categoryId = null;
        this.state.category = null;
        this.data.categoryId = null;
        this.categoryLabel = '';
        this.setLoading(false);
        this.state.startYear = null;
        let queryParams = this.generateUrlParams();
        this._router.navigate([], {queryParams});
      }
    } else {
      Session.set('enableCheckUpdate', false);
      this._router.navigate([], {queryParams: this.generateUrlParams()});
    }
  }

  generateUrlParams() {
    // generate query params
    let queryParams:any = {
      'customerId': this.state.customerId,
    };
    if (this.state.categories.length > 0) {
      this.state.categoryIds = this.state.categories.map(category => category._id);
      queryParams['categoryIds'] = this.state.categoryIds;
    }

    if (this.state.startYear) {
      queryParams['startYear'] = this.state.startYear;
      queryParams['endYear'] = this.state.endYear;
    }

    if (!funcs.isEmptyObject(this.state.category)) {
      queryParams['categoryId'] = this.state.category._id;
    }

    return queryParams;
  }

  getFilterConditions(action) {
    this.reducers(action);
  }

  reducers(action) {
    switch(action.type) {
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

  checkIfInContract(customerAndCategoryIds){
    MeteorObservable.call('getFullContract', customerAndCategoryIds).subscribe((contract:any) => {
      if (contract && contract.length > 0) {
        this.productInContract = true;
      } else {
        this.productInContract = false;
      }
    });
  }

  async pdf() {
    EventEmitterService.Events.emit({name: "isProcessing", value: true});

    let categories = this.state.categories;
    let categoriesArr = [];

    for (let i = 0; i < categories.length; i++) {
      categoriesArr.push(categories[i]._id)
    }

    let customerAndCategoryIds = {
      customerId: this.state.customer._id,
      categoryId: categoriesArr
    };

    let log = {
      log: "Press PDF button",
      collectionName: "PDF Button",
      url: window.location.pathname,
      createdAt: new Date(),
      _id: Random.id()
    };
    this.systemLogsService._log$(log).subscribe();
    await this._getLastUpdated$().toPromise();

    MeteorObservable.call('getFullContract', customerAndCategoryIds).subscribe((contract) => {
      if (contract) {

        this.fullCustomerContract = contract;
        let log = {
          log: "Generate PDF success",
          collectionName: "PDF Button",
          url: window.location.pathname,
          createdAt: new Date(),
          _id: Random.id()
        };
        this.systemLogsService._log$(log).subscribe();
      }
      let pdfInfo = {
        customer: this.customerLabel,
        content: this.fullCustomerContract,
        revised: this.lastUpdated
      };
      let docDefinition = pdf.pdfContentArray(pdfInfo);
      docDefinition = Object.assign({
        info: {
          title: this.customerLabel + ' Price Sheet-' + moment().format("MM/DD/YYYY-h:mma"),
          author: this.customerLabel + ' Price Sheet-' + moment().format("MM/DD/YYYY-h:mma"),
        }}, docDefinition);

      let arial = {
        'arial.ttf': fonts.arial['arial.ttf'],
        'arial-Medium.ttf': fonts.arial['arial-Medium.ttf'],
      }
      pdfMake.fonts = {
        arial: {
          normal: 'arial.ttf',
          bold: 'arial-Medium.ttf',
          italics: 'arial-Medium.ttf',
          bolditalics: 'arial-Medium.ttf'
        },
      }
      pdfMake.vfs = Object.assign(arial, pdfMake.vfs);

      // pdfMake.createPdf(docDefinition).open()
      if (customerAndCategoryIds.categoryId) {
        pdfMake.createPdf(docDefinition).download(this.customerLabel + ' Price Sheet-' + moment().format("MM/DD/YYYY-h:mma") + '.pdf');
      } else {
        pdfMake.createPdf(docDefinition).download(this.customerLabel + ' Full Price Sheet-' + moment().format("MM/DD/YYYY-h:mma") + '.pdf')
      }
      EventEmitterService.Events.emit({name: "isProcessing", value: false});
    });
  }

  _getLastUpdated$() : Observable<any>{
    let pipeline = [
      {
        "$match": {
          "parentTenantId": Session.get('tenantId'),
        }
      },
      {
        "$unwind": "$actions"
      },
      { $match: { 'actions.documentId': this.state.contractId } },
      {
        "$project": {
          "documentType": "$actions.collectionName",
          'type': "$actions.type",
          "documentId": "$actions.documentId",
          "date": "$actions.createdAt",
        }
      },
      { $match: { documentType: 'customerContracts', type: { $in: ['update', 'update.insert'] } } },
      {
        "$group": {
          "_id": "$documentId",
          "date": {
            "$max": "$date"
          },
          'docs': {
            "$push": {
              "date": "$date"
            }
          }
        }
      },
      {
        "$project": {
          "docs": {
            "$setDifference": [
              {
                "$map": {
                  "input": "$docs",
                  "as": "doc",
                  "in": {
                    "$cond": [
                      { "$eq": ["$date", "$$doc.date"] },
                      "$$doc",
                      false
                    ]
                  }
                }
              },
              [false]
            ]
          }
        }
      },
      { $unwind: '$docs' },
      {
        $project: {
          _id: 1,
          date: '$docs.date'
        }
      }
    ];

    // console.log('pipeline', JSON.stringify(pipeline));

    return MeteorObservable.call('aggregate', 'systemLogs', pipeline)
      .pipe(
        tap(result => {
          this.lastUpdated = moment(new Date('9/23/2018')).format('MMM D, YYYY hh:mm A');
          if (result['result'][0]) {
            if (new Date(result['result'][0].date) > new Date(this.lastUpdated)) {
              this.lastUpdated = moment(new Date(result['result'][0].date)).format('MMM D, YYYY hh:mm A');
            }
          } else {
            // this.lastUpdated = moment().format('MMM D, YYYY hh:mm A');
          }
        })
      )
  }

  onMobileClick(doc) {

    this.state.isMainContentShown = false;
    this.state.isSingleDocumentShown = true;
    this.state.doc = doc;
    this.state.newPriceTag = '';

    this.contractForm = this._fb.group({
      isOnContract: [doc.isOnContract, <any>Validators.required],
      product: [doc.product, <any>Validators.required],
      description: [doc.description],
      YTDsales: [doc.YTDsales, <any>Validators.required],
      STDcost: [doc.STDcost, <any>Validators.min(0)],
      vendorCost: [doc.vendorCost, <any>Validators.min(0)],
      STDprice: [doc.STDprice, <any>Validators.min(0)],
      previousPrice: [doc.previousPrice, <any>Validators.min(0)],
      contractPrice: [doc.contractPrice, <any>Validators.min(0)],
      level1: [Number((doc.level1).toFixed(2))],
      level2: [Number((doc.level2).toFixed(2))],
      level3: [Number((doc.level3).toFixed(2))],
      level4: [Number((doc.level4).toFixed(2))],
      level5: [Number((doc.level5).toFixed(2))]
    });

    this.findRightBackgroundColor();
  }

  setContractPrice(str) {
    this.state.newPriceTag = str;
    // this.state.currentPriceTag = str;
  }

  showView(view) {
    if (view && view != '') {
      this._router.navigate(['.', {view}], {relativeTo: this.route, queryParamsHandling: 'merge'});
    } else {
      this._router.navigate(['.', {}], {relativeTo: this.route, queryParamsHandling: 'merge'});
    }
  }

  toggleContractDocument() {
    this.state.isMainContentShown = !this.state.isMainContentShown;
    this.state.isSingleDocumentShown = !this.state.isSingleDocumentShown;
  }

  updateContractPrice() {

    if (this.state.newPriceTag != '') {
      let query = {
        _id: this.state.contractId,
        "products._id": this.state.doc._id
      };

      let update = {
        $set: {
          "products.$.price": new Decimal(this.contractForm.controls[this.state.newPriceTag].value || 0),
          "products.$.previousPrice": new Decimal(this.state.doc.contractPrice || 0),
          "products.$.isSynced": false,
        }
      };

      MeteorObservable.call('update', 'customerContracts', query, update).subscribe(res => {

        if (res) {
          this.contractForm.controls['contractPrice'].patchValue(Number(this.contractForm.value[this.state.newPriceTag]));
          this.state.currentPriceTag = this.state.newPriceTag;
          this.state.newPriceTag = '';
          this.findRightBackgroundColor();
        }
      });
    }
  }

  findRightBackgroundColor() {
    switch(this.contractForm.controls['contractPrice'].value)
    {
      case this.contractForm.controls['level1'].value:
        this.state.currentPriceTag = 'level1';
        break;
      case this.contractForm.controls['level2'].value:
        this.state.currentPriceTag = 'level2';
        break;
      case this.contractForm.controls['level3'].value:
        this.state.currentPriceTag = 'level3';
        break;
      case this.contractForm.controls['level4'].value:
        this.state.currentPriceTag = 'level4';
        break;
      case this.contractForm.controls['level5'].value:
        this.state.currentPriceTag = 'level5';
        break;
      default:
        this.state.currentPriceTag = 'contractPrice';
        break;
    }
  }

  syncDatabase() {
    this.isSyncing = true;
    this.syncText = 'Please wait......';
    const collections = [
      'products',
      'categories',
      'customers',
      'customerContracts',
    ];
    let count = 0;
    let length = collections.length;
    Promise.all(collections.map((collectionName) => {
      return new Promise(resolve => {
        MeteorObservable.call('syncDatabase', collectionName).subscribe((res) => {
          if (res) {
            count++;
            this.progressPercentage = count/length * 100;
            resolve(true);
          }
        });
      })
    })).then(res => {
      this.syncText = 'Done';
      setTimeout(() => {
        this.isSyncing = false;
      }, 3000);
    });
  }

  _showContractId() {
    let isDeveloper = PageResolver.isDeveloper;
    if (isDeveloper) {
      return this.state.contractId;
    }
  }

  onDataChange(e) {
    switch(e.name) {
      case 'updateContractProductStatus':
        this.updateContractProductStatus(e.value.event, e.value.row, e.value.column);
        break;
      case 'updateContractProductPrice':
        this.updateContractProductPrice(e.value.event, e.value.row, e.value.column);
        break;
      case "checkAll":
        this.checkAll();
        break;
      case "uncheckAll":
        this.uncheckAll();
        break;
      case 'setPriceLevel':
        this.setPriceLevel(e);
        break;
      case "setPrice":
        this.setPrice(e.value.event, e.value.row, e.value.column);
        break;
    }
  }

  setPriceLevel(e) {
    let dirtyRows = this.contractPricingLookup._getDirtyRows();
    let originRows = this.contractPricingLookup._getPristineRows();
    let checkboxField = this.contractPricingLookup._getCheckboxFieldName();
    dirtyRows.forEach(row => {
      let findOriginRow = originRows.find(_row => _row._id == row._id);
      if (row[checkboxField] == true && findOriginRow[checkboxField] == true && row['newHighlightFieldName'] != e.value.column.prop){
        this.setPrice(e.value.event, row, e.value.column);
      } else if (row[checkboxField] == true && findOriginRow[checkboxField] == false){
        this.updateContractProductPrice(e.value.event, row, e.value.column);
      }
    })
  }

  uncheckAll() {
    let lookup = this.contractPricingLookup.lookup;
    let checkboxFieldName = lookup.dataTable.options.checkboxFieldName;

    if (checkboxFieldName) {
      this.contractPricingLookup.exampleDatabase.value.map(async (row) => {
        if (row[checkboxFieldName]) {
          this.uncheckRow(row, checkboxFieldName);
        }
      });
    }

  }

  checkAll() {
    let lookup = this.contractPricingLookup.lookup;
    let checkboxFieldName = lookup.dataTable.options.checkboxFieldName;

    if (checkboxFieldName) {
      this.contractPricingLookup.exampleDatabase.value.map(async (row) => {
        if (!row[checkboxFieldName]) {
          this.checkRow(row, checkboxFieldName);
        }
      });
    }
  }

  updateContractProductPrice(event, row, column) {
    if (event.target.value && event.target.value != '') {
      row[column.prop] = Number(event.target.value);
    }

    let rows = this.contractPricingLookup._getPristineRows();

    let initRow = rows.find(_row => _row._id == row._id);

    let checkboxFieldName = this.contractPricingLookup._getCheckboxFieldName();
    if (row[checkboxFieldName]) {
      // if this row is checked

      if (row[column.prop] != 0 && row[column.prop] != undefined) {
        this.contractPricingLookup.objLocal['selectedRow'] = row;
        if (
          column.prop != row['newHighlightFieldName'] &&
          column.prop != 'contractPrice') {

          this.setPrice(event, row, column);
        } else {
          // row.newHighlightFieldName = undefined;
          // deselect
          this.unsetPrice(event, row, column);
        }
      } else {
        this.contractPricingLookup.objLocal['selectedRow'] = row;
      }
    } else {
      row.newHighlightFieldName = undefined;
    }
  }

  async onComplete(event) {
    let rows = this.contractPricingLookup._getDirtyRows();
    if (rows.length > 0) {
      let onContractProducts = rows.filter((row) => row.isOnContract == true);
      if (onContractProducts.length == 0 && event.value.isFirstInit) {

        MeteorObservable.call('getAllowedCategoryProducts', this.state.categoryId).subscribe(async (res: any) => {
          const set = new Set();
          await Promise.all(res.map(async (row) => {
            set.add(row._id);
            // await this.updateContractProducts(row, {prop: 'isOnContract'}, true);
          }));
          this.contractPricingLookup.exampleDatabase.value.forEach(row => {
            if (set.has(row._id)) {
              row.isOnContract = true;
              row.backgroundColor = 'green';
            }
          });
        })
      } else {
        onContractProducts.forEach(_product => {
          _product.highlightFieldName = 'price';
          switch(_product.price.toFixed(2)) {
            case _product.priceLevel1.toFixed(2):
              _product.highlightFieldName = 'priceLevel1';
              break;
            case _product.priceLevel2.toFixed(2):
              _product.highlightFieldName = 'priceLevel2';
              break;
            case _product.priceLevel3.toFixed(2):
              _product.highlightFieldName = 'priceLevel3';
              break;
            case _product.priceLevel4.toFixed(2):
              _product.highlightFieldName = 'priceLevel4';
              break;
            case _product.priceLevel5.toFixed(2):
              _product.highlightFieldName = 'priceLevel5';
              break;
          }
        })
      }
    }
  }

  updateContractProductStatus(event, row, column) {
    let checkboxFieldName = column.prop;

    if (event.checked) {
      this.checkRow(row, checkboxFieldName);
    } else {
      this.uncheckRow(row, checkboxFieldName);
    }
  }

  insertContractProduct(event, row, column) {
    const contractId = this.state.contractId;
    row['newHighlightFieldName'] = column.prop;

    let rows = this.contractPricingLookup._getPristineRows();
    let rowIndex = rows.findIndex(_row => _row._id == row._id);

    let update = {};
    let method: any = {};

    let checkboxFieldName = 'isOnContract';
    if (row[checkboxFieldName]) {
      let price: number;
      price = Number(row[column.prop].toFixed(2));

      let obj: any = {
        _id: row._id,
        isSynced: false,
        createdAt: new Date(),
        createdUserId: Meteor.userId(),
      };
      if (price >= 0) {
        obj.price = new Decimal(price);
      }

      update = {
        $addToSet: {
          products: obj
        }
      };

      method = {
        _id: row._id + '.' + column.updatedFieldName,
        rowId: row._id,
        collectionName: 'customerContracts',
        query: {_id: contractId},
        update: update,
        options: {upsert: true},
        type: 'update.insert',
        fieldPath: `products_${row._id}`
      };


      let log: any = {
        _id: Random.id(),
        documentId: contractId,
        collectionName: method.collectionName,
        document: contractId,
        type: 'update.insert',
        field: 'products',
        fieldPath: `products_${row._id}`,
        log: '',
        createdAt: new Date(),
        pathname: window.location.pathname
      };

      log.log = `Insert Product ${row.product} to ${contractId}, (${row._id}) (${this.contractPricingLookup.objLocal.data.customer.number} (${this.contractPricingLookup.objLocal.url.customerId}), ${this.contractPricingLookup.objLocal.data.category.name} (${this.contractPricingLookup.objLocal.url.categoryId}),)`;

      method.log = log;

      this.contractPricingLookup.addMethodToBeRun(method);
    }
  }

  checkRow(row, checkboxFieldName) {
    let rows = this.contractPricingLookup._getPristineRows();
    let rowIndex = rows.findIndex(_row => _row._id == row._id);

    let isRowCheckedInDatabase = rows[rowIndex][checkboxFieldName];

    if (isRowCheckedInDatabase) {
      // if this row is checked in the database, no need to check it again, remove all methods in this row
      row.backgroundColor = '';
      const query = {
        _id: row._id
      };

      this.contractPricingLookup.removeMethodsToBeRunByRowId(row._id);

    } else {
      // if this row is not checked in the database, check it
      row.backgroundColor = 'green';
      row[checkboxFieldName] = true;
    }
  }

  async uncheckRow(row, checkboxFieldName) {
    row['newHighlightFieldName'] = undefined;
    let rows = this.contractPricingLookup._getPristineRows();
    let dirtyRows = this.contractPricingLookup._getDirtyRows();
    let rowIndex = rows.findIndex(_row => _row._id == row._id);

    let columnIndex = this.columns.findIndex((column) => column.prop == checkboxFieldName);

    this.contractPricingLookup.exampleDatabase.value[rowIndex][checkboxFieldName] = false;

    let isRowCheckedInDatabase = rows[rowIndex][checkboxFieldName];

    if (isRowCheckedInDatabase) {
      // if this row is checked in the database
      row.backgroundColor = 'red';
      this.removeContractProduct(row);
    } else {
      this.contractPricingLookup.exampleDatabase.value[rowIndex].backgroundColor = '';
      // if it is not in the database, there is no need to uncheck it, remove the method in the methodsToBeRun

      this.contractPricingLookup.removeMethodsToBeRunByRowId(row._id);
    }
  }

  removeContractProduct(row) {
    let contractId = this.state.contractId;
    let update = {
      $pull: {
        products: {
          _id: row._id
        }
      },
      $addToSet: {
        deletedProducts: row._id
      }
    };
    let checkboxFieldName = this.contractPricingLookup._getCheckboxFieldName();

    let method = {
      _id: row._id + "." + checkboxFieldName,
      rowId: row._id,
      collectionName: 'customerContracts',
      updateQuery: { _id: this.state.contractId },
      update: update,
      type: 'update.remove',
      fieldPath: `products_${row._id}`,
      updateLog: ''
    };

    let logMessage;
    let updateLog: any = {
      _id: Random.id(),
      documentId: contractId,
      collectionName: method.collectionName,
      document: contractId,
      type: 'update.remove',
      field: 'products',
      fieldPath: `products_${row._id}`,
      log: '',
      date: new Date(),
      pathname: window.location.pathname
    };
    updateLog.log = `Remove Product ${row.product} (${row._id}) (${this.contractPricingLookup.objLocal.data.customer.number} (${this.contractPricingLookup.objLocal.url.customerId}), ${this.contractPricingLookup.objLocal.data.category.name} (${this.contractPricingLookup.objLocal.url.categoryId}),)`;


    
    method.updateLog = updateLog;

    this.contractPricingLookup.addMethodToBeRun(method);
  }

  updateContractProducts(row, column, checked) {
    let productId = row._id;
    const contractId = this.state.contractId;
    let rows = this.contractPricingLookup._getPristineRows();
    let dirtyRows = this.contractPricingLookup._getDirtyRows();
    let rowIndex = rows.findIndex(_row => _row._id == row._id);

    let update = {};
    let method: any = {};

    if (checked) {
      // if (rows[rowIndex]['isOnContract'] == false) {
      //
      //   let price: number;
      //   if (row['newHighlightFieldName'] && row['newHighlightFieldName'] != '') {
      //     price = row[row['newHighlightFieldName']];
      //     if (price >= 0) {
      //       price = Number(price.toFixed(2));
      //     }
      //   }
      //   let obj: any = {
      //     _id: row._id,
      //     isSynced: false,
      //     createdAt: new Date(),
      //     createdUserId: Meteor.userId()
      //   };
      //   if (price >= 0) {
      //     obj.price = new Decimal(price);
      //   }
      //
      //   update = {
      //     $addToSet: {
      //       products: obj
      //     }
      //   };
      //
      //   method = {
      //     _id: row._id + '.' + this.contractPricingLookup.dataTable.options.updatedFieldName,
      //     rowId: row._id,
      //     collectionName: 'customerContracts',
      //     query: { _id: contractId },
      //     update: update,
      //     options: {upsert: true},
      //     type: 'update.insert'
      //   };
      // }
    } else {
      update = {
        $pull: {
          products: {
            _id: productId
          }
        },
        $addToSet: {
          deletedProducts: productId
        }
      };
      method = {
        _id: row._id + '.' + column.prop,
        rowId: row._id,
        collectionName: 'customerContracts',
        query: { _id: contractId },
        update: update,
        type: 'update.remove'
      };

      let logMessage;
      let log: any = {
        _id: Random.id(),
        documentId: contractId,
        collectionName: method.collectionName,
        document: contractId,
        type: 'update',
        field: 'products',
        log: '',
        date: new Date(),
        pathname: window.location.pathname
      };

      if (checked) {
        logMessage = `Add Product ${row.product} (${row._id}) (${this.contractPricingLookup.objLocal.data.customer.number} (${this.contractPricingLookup.objLocal.url.customerId}), ${this.contractPricingLookup.objLocal.data.category.name} (${this.contractPricingLookup.objLocal.url.categoryId}),)`;

      } else {
        logMessage = `Remove Product ${row.product} (${row._id}) (${this.contractPricingLookup.objLocal.data.customer.number} (${this.contractPricingLookup.objLocal.url.customerId}), ${this.contractPricingLookup.objLocal.data.category.name} (${this.contractPricingLookup.objLocal.url.categoryId}),)`;
      }

      log.log = logMessage;

      method.log = log;
      this.contractPricingLookup.addMethodToBeRun(method);
    }
  }

  unsetPrice(event, row, column) {
    // row must be checked
    let pristineRows = this.contractPricingLookup._getPristineRows();
    let initRow = pristineRows.find(_row => _row._id == row._id);

    let checkboxFieldName = this.contractPricingLookup._getCheckboxFieldName();
    row['newHighlightFieldName'] = undefined;
    if (initRow[checkboxFieldName] == true) {
      row.backgroundColor = undefined;
    }

    this.contractPricingLookup.removeMethodsToBeRunByMethodId(row._id + "." + column.updatedFieldName);
  }

  setPrice(event, row, column) {
    row['newHighlightFieldName'] = column.prop;
    row.backgroundColor = 'green';
    let rows = this.contractPricingLookup._getPristineRows();
    let rowIndex = rows.findIndex(_row => _row._id == row._id);
    let originalRow = rows[rowIndex];

    let updateQuery = {
      _id: this.state.contractId,
      "products._id": row._id
    };

    let newPrice = new Decimal(row[column.prop].toFixed(2) || 0);
    let previousPrice = new Decimal(0);
    let update, method;

    // Set update properties
    if (!originalRow['price']) {
      update = {
        $set: {
          "products.$.price" : newPrice,
          "products.$.isSynced" : false,
        }
      };
    } else {
      previousPrice = new Decimal(originalRow['price'].toFixed(2) || 0);
      update = {
        $set: {
          "products.$.price" : newPrice,
          "products.$.previousPrice" : previousPrice,
          "products.$.isSynced" : false,
        }
      };
    }

    let updateLog: any = {
      _id: Random.id(),
      documentId: this.state.contractId,
      collectionName: 'customerContracts',
      type: 'update',
      fieldPath: `products_${row._id}.price_double`,
      log: '',
      createdAt: new Date(),
      value: newPrice.toNumber(),
      previousValue: previousPrice.toNumber(),
      url: window.location.pathname
    };    

    updateLog.log = `Update Product ${row.product} (${row._id}) 
  (${this.contractPricingLookup.objLocal.data.customer.number} (${this.contractPricingLookup.objLocal.url.customerId}), 
  ${this.contractPricingLookup.objLocal.data.category.name} (${this.contractPricingLookup.objLocal.url.categoryId}))
  contractPrice from ${previousPrice} to ${newPrice}
  `;

    // Set insert properties
    let insertQuery = {
      _id: this.state.contractId
    };
    
    let insert = {
      $push: {
        products: {
          _id: row._id,
          "price" : newPrice,
          "isSynced" : false,
          createdUserId: Meteor.userId(),
          createdAt: new Date(),
          previousValue: null
        }
      }
    };

    let insertLog: any = {
      _id: Random.id(),
      documentId: this.state.contractId,
      collectionName: 'customerContracts',
      type: 'update.insert',
      fieldPath: `products_${row._id}.price_double`,
      log: '',
      createdAt: new Date(),
      value: newPrice.toNumber(),
      previousValue: previousPrice.toNumber(),
      url: window.location.pathname
    };    

    insertLog.log = `Insert Product ${row.product} (${row._id}) 
  (${this.contractPricingLookup.objLocal.data.customer.number} (${this.contractPricingLookup.objLocal.url.customerId}), 
  ${this.contractPricingLookup.objLocal.data.category.name} (${this.contractPricingLookup.objLocal.url.categoryId}))
  contractPrice ${newPrice}
  `;

    method = {
      _id: row._id + "." + column.updatedFieldName,
      rowId: row._id,
      type: 'update',
      name: 'originMethod.name',
      collectionName: 'customerContracts',
      updateQuery: updateQuery,
      update: update,
      updateLog: updateLog,
      insertQuery: insertQuery,
      insert: insert,
      insertLog: insertLog
    };

    this.contractPricingLookup.addMethodToBeRun(method);
  }

  readFile(event) {
    const file = event.currentTarget.files[0];
    const reader = new FileReader();
    const rABS = !!reader.readAsBinaryString;
    reader.onload = function(e:any) {
      const data = e.target.result;
      const name = file.name;

      Meteor.call(rABS ? 'uploadS' : 'uploadU', rABS ? data : new Uint8Array(data), name, function(err, wb) {
        if (err) throw err;
        /* load the first worksheet */
        const ws = wb.Sheets[wb.SheetNames[0]];
        /* generate HTML table and enable export */
        document.getElementById('out').innerHTML = XLSX.utils.sheet_to_html(ws, { editable: true });
      });
    };
    if(rABS) reader.readAsBinaryString(file); else reader.readAsArrayBuffer(file);
  }

  ngOnDestroy() {
    // EventEmitterService.Events.unsubscribe();
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
}