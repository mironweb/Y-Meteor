import { Component, OnInit } from '@angular/core';
import { MeteorObservable } from "meteor-rxjs";
import { ActivatedRoute, Params, Router } from '@angular/router';

import * as moment from 'moment';
import * as funcs from '../../../../../../both/functions/common';
import { last } from 'rxjs/operator/last';
import { UserFilter } from 'both/models/userFilter.model';
import { UserFilterModel } from "both/models/userFilter.model";
import { concatMap, defaultIfEmpty, delay, filter } from "rxjs/operators";
import { map, switchMap, tap } from "rxjs/operators";
import { concat } from 'rxjs/observable/concat';
import { of } from "rxjs/observable/of";
import { merge } from 'rxjs/observable/merge';
import {UserService} from "../../../../services/UserService";

@Component({
  selector: 'customer-inquiry',
  templateUrl: 'customers-inquiry.page.html',
  styleUrls: ['../customers.scss']
})

export class CustomersInquiryPage implements OnInit {
  menus = [];
  subMenus = [];
  view: string;
  customerLabel: string;
  customerId: string;
  customerInquiryTotals: any = {};
  categorySelectedLabel: string;
  last5InvoicesArr: any = [];
  backOrderedItems: any = [];
  customerSalesPeople: any = [];
  selectedSalesperson: string;
  loading: boolean = true;
  viewAllPermission: boolean = false;
  managedUsers: any = [];
  currentYear: any = moment().format('YYYY');
  lastYear: any = moment().subtract(1, 'years').format('YYYY')
  thisYearRange: any = {
    $gte: new Date(moment().startOf('year').format()),
    $lte: new Date()
  }
  lastYearRange: any = {
    $gte: new Date(moment().startOf('year').subtract(1, 'years').format()),
    $lte: new Date(moment().subtract(1, 'years').format())
  };
  lastWholeYearRange: any = {
      $gte: new Date(moment().startOf('year').subtract(1, 'years').format()),
      $lte: new Date(moment().endOf('year').subtract(1, 'years').format())
  };
  lastYearToDateRange: any = {
      $gte: new Date(moment().startOf('year').subtract(1, 'years').format()),
      $lte: new Date()
  };
  customersLookupData:any = {};
  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };
  invoiceTable: any;
  backOrderedTable: any;
  doughnutChartLabels: string[] = ['This Customer', 'Global Sales'];
  doughnutChartData: number[] = [0, 0];
  salesDoughnutChartLabels: string[] = ['This Customer', 'Salesperson Total'];
  salesDoughnutChartData: number[] = [0, 0];
  doughnutChartType: string = 'doughnut';
  pieChartColors: Array<any> = [{ backgroundColor: ["#4EA29B", "#BF360C"] }];
  chartOptions: any = {
    maintainAspectRatio: false,
    legend: {
      display: true,
      position: 'top',
      labels: {
        fontSize: 12
      }
    },
    tooltips: {
      callbacks: {
        label: function (tooltipItem, data) {
          let allData = data.datasets[tooltipItem.datasetIndex].data;
          let tooltipLabel = data.labels[tooltipItem.index];
          let tooltipData = allData[tooltipItem.index];
          let total = 0;
          for (let i in allData) {
            total += allData[i];
          }
          let tooltipPercentage = Math.round((tooltipData / total) * 100);
          return tooltipLabel + ': ' + tooltipData + ' (' + tooltipPercentage + '%)';
        }
      }
    },
  }
  constructor(
    private _router: Router,
    private route: ActivatedRoute,
    private _userService: UserService
              ) { }

  ngOnInit() {
    this._userService.user._getManagedUsers$()
      .pipe(
        map((users:any) => users.map(_user => _user._id))
      )
      .subscribe(res => {
        this.customersLookupData = {
          manageUserIds: res
        };
      })

    this.data.thisYearRange = this.thisYearRange;
    this.data.lastYearRange = this.lastYearRange;
    this.data.lastWholeYearRange = this.lastWholeYearRange;
    this.data.lastYearToDateRange = this.lastYearToDateRange;

    this.invoiceTable = {
      columns: [],
      rows: []
    };
    this.invoiceTable.columns = [
      {
        prop: '',
        hidden: true,
        label: 'ID',
      },
      {
        prop: '',
        label: 'INV NO#',
      }, {
        prop: '',
        label: 'DATE',
      },
      {
        prop: '',
        label: 'CUST PO#',
      },
      {
        prop: '',
        label: 'AMOUNT',
        cellTemplate: 'currency'
      },
    ];
    this.backOrderedTable = {
      columns: [],
      rows: []
    };
    this.backOrderedTable.columns = [
      {
        prop: '',
        hidden: true,
        label: 'ID',
      },
      {
        prop: '',
        label: 'CUST PO#',
      },
      {
        prop: '',
        label: 'DATE PROMISED',
      },
      {
        prop: '',
        label: 'QUANTITY',
        // cellTemplate: 'currency'
      },
    ];

    let tempParams = {};

    let p = MeteorObservable.call('checkSystemPermission', Meteor.userId(), { name: 'accessAllCustomerInquiry'})
      .pipe(
      map(permission => this.func1(permission)),
      switchMap(() => MeteorObservable.call('returnUser', Meteor.userId())),
      map((user) => this.func2(user)),
      switchMap((user) => {
        if (user["manages"].length > 0) {
          if (!this.viewAllPermission){
            this.managedUsers.push(Meteor.userId())
          }
          return funcs.returnUserFromArray(this.managedUsers);
        } else {
          return of('null')
        }
      }),
      tap((managedUsers) => {
        if (managedUsers['result']) {
          this.customerSalesPeople = managedUsers['result']
        }
      }),
      switchMap(() => this.route.queryParams),
      tap((params) => {
        // tempParams = params;
        this.func3(params);
      }),
      switchMap((params) => MeteorObservable.call('findOne', 'customers', { _id: params.id }, {})),
      map((customer) => this.func4(customer)),
    )
      // concat(
      //   p,
      //   of("test of"),
      //   // this.getTotalSalespersonSalesInquiry(this.thisYearRange, 'j17yN71uJhEBdeTGu'),
      //   // this.getTotalSalespersonSalesInquiry(this.lastYearRange, 'j17yN71uJhEBdeTGu'),
      //   // this.getTotalSalespersonSalesInquiry(this.thisYearRange),
      //   // this.getTotalSalespersonSalesInquiry(this.lastYearRange)
      .subscribe(res => {
        // console.log("res", res);
      });
  }

  func1(permission) {
    if (permission['result'].length > 0) {
      if (permission['result'][0].status === 'enabled') {
        this.viewAllPermission = true;
      } else {
        let user = Meteor.user();
        let tenants = user['tenants'][0];
        if ('referredUserId' in tenants) {
          this.selectedSalesperson = tenants.referredUserId;
        } else {
          this.selectedSalesperson = Meteor.userId();
        }
        this.onSelect(this.selectedSalesperson);
      }
    }
  }

  func2(user) {
    if (user["manages"].length > 0) {
      let managedUsers = user["manages"];
      this.managedUsers = managedUsers;
    }
    return user;
  }

  func3(params) {
    if (params.view) {
      this.view = params.view;
    } else {
      this.view = null;
    }
    if (params.id && params.id !== this.customerId) {
      this.customerId = params.id;
      this.data.customerId = this.customerId;
    }
    if (params.salesId) {
      this.selectedSalesperson = params.salesId;
      this.data.selectedSalesperson = this.selectedSalesperson;
      if (this.customerId) {
        this.salespersonSelected(params.salesId);
      }
    } else {
      this.selectedSalesperson = null;
      this.data.selectedSalesperson = null;
    }
    if (params.categoryId) {
      this.getCategoryLabel(params.categoryId);
      this.data.categoryId = params.categoryId;
    }
    return params;
  }

  func4(res) {
    if (res) {
      this.customerSelected(res);
      if (this.viewAllPermission) {
        this.getSalesPeople(res._id);
      }
    }
    return res;
  }

  showView(view) {
    this.view = view;
    this._router.navigate([], { queryParams: { view }, queryParamsHandling: 'merge' })
  }

  async addCustomer(event) {
    if (event.value) {
      let customer = event.value;
      this.view = '';
      if (this.viewAllPermission) {
        this._router.navigate([], { queryParams: { id: customer._id }, })
      } else {
        if (this.selectedSalesperson) {
          this._router.navigate([], { queryParams: { id: customer._id, view: '' }, queryParamsHandling: 'merge' })
        } else {
          this._router.navigate([], { queryParams: { id: customer._id }, })
        }
      }
    }
  }

  async salespersonSelected(result) {
    let thisYearTotalSalesCustomer = await this.getTotalSalespersonSalesInquiry(this.thisYearRange, this.customerId).catch(error => console.log(error))
    let lastYearTotalSalesCustomer = await this.getTotalSalespersonSalesInquiry(this.lastYearRange, this.customerId).catch(error => console.log(error))
    let thisYearTotalSalesPerson = await this.getTotalSalespersonSalesInquiry(this.thisYearRange, null).catch(error => console.log(error))
    let lastYearTotalSalesPerson = await this.getTotalSalespersonSalesInquiry(this.lastYearRange, null).catch(error => console.log(error))

    thisYearTotalSalesCustomer = thisYearTotalSalesCustomer['result'][0] ? thisYearTotalSalesCustomer['result'][0].salesPersonTotal : 0;
    lastYearTotalSalesCustomer = lastYearTotalSalesCustomer['result'][0] ? lastYearTotalSalesCustomer['result'][0].salesPersonTotal : 0;
    thisYearTotalSalesPerson = thisYearTotalSalesPerson['result'][0] ? thisYearTotalSalesPerson['result'][0].salesPersonTotal : 0;
    lastYearTotalSalesPerson = lastYearTotalSalesPerson['result'][0] ? lastYearTotalSalesPerson['result'][0].salesPersonTotal : 0;

    let salesCustomerTotal = {
      'numerator': lastYearTotalSalesCustomer,
      'denominator': thisYearTotalSalesCustomer
    };
    let salespersonTotal = {
      'numerator': lastYearTotalSalesPerson,
      'denominator': thisYearTotalSalesPerson
    };

    let salesCustomerTotalPercentChange = await this.percentChange(salesCustomerTotal);
    let salespersonPercentChange = await this.percentChange(salespersonTotal);

    let salesPersonTotals = {
      thisYearTotalSalesCustomer: thisYearTotalSalesCustomer,
      lastYearTotalSalesCustomer: lastYearTotalSalesCustomer,
      thisYearTotalSalesPerson: thisYearTotalSalesPerson,
      lastYearTotalSalesPerson: lastYearTotalSalesPerson,
      salesCustomerTotalPercentChange: salesCustomerTotalPercentChange,
      salespersonPercentChange: salespersonPercentChange
    }

    this.customerInquiryTotals = Object.assign(this.customerInquiryTotals, salesPersonTotals);
    this.salesDoughnutChartData = [this.customerInquiryTotals.thisYearTotalSalesCustomer, this.customerInquiryTotals.thisYearTotalSalesPerson]
    this.loading = false;
  }

  async customerSelected(result) {
    this.invoiceTable.rows = [];
    this.backOrderedTable.rows = [];
    this.customerLabel = result.name;

    let thisYearCustomerSales = await this.getTotalSales(this.thisYearRange, result._id).catch(error => console.log(error));
    let lastYearCustomerSales = await this.getTotalSales(this.lastYearRange, result._id);
    let thisYearSales = await this.getTotalSales(this.thisYearRange).catch(error => console.log(error));
    let lastYearSales = await this.getTotalSales(this.lastYearRange).catch(error => console.log(error));

    thisYearCustomerSales = thisYearCustomerSales['result'][0] ? thisYearCustomerSales['result'][0].total : 0;
    lastYearCustomerSales = lastYearCustomerSales['result'][0] ? lastYearCustomerSales['result'][0].total : 0;
    thisYearSales = thisYearSales['result'][0] ? thisYearSales['result'][0].total : 0;
    lastYearSales = lastYearSales['result'][0] ? lastYearSales['result'][0].total : 0;

    let customerTotals = {
      'numerator': lastYearCustomerSales,
      'denominator': thisYearCustomerSales
    };
    let companyTotals = {
      'numerator': lastYearSales,
      'denominator': thisYearSales
    };

    let customerPercentChange = await this.percentChange(customerTotals);
    let totalPercentChange = await this.percentChange(companyTotals);

    let totals = {
      thisYearCustomerSales: thisYearCustomerSales,
      lastYearCustomerSales: lastYearCustomerSales,
      thisYearSales: thisYearSales,
      lastYearSales: lastYearSales,
      customerPercentChange: customerPercentChange,
      totalPercentChange: totalPercentChange
    }

    this.customerInquiryTotals = Object.assign(this.customerInquiryTotals, totals);

    let last5Invoices = await this.last5Invoices(result._id);
    let backOrderedItems = await this.backOrderItems(result._id);

    this.last5InvoicesArr = last5Invoices['result'];
    this.backOrderedItems = backOrderedItems['result'];

    this.last5InvoicesArr.forEach(invoice => {
      let row: any = [];
      row = [invoice._id,
      invoice.invoice,
      moment(invoice.invoiceDate).format("MMM DD, YYYY"),
      invoice.customerPurchaseOrder,
      invoice.totalSold,];
      this.invoiceTable.rows.push(row);
    });

    this.backOrderedItems.forEach(order => {
      let row: any = [];
      row = [order._id,
      order.number,
      moment(order.date).format("MMM DD, YYYY"),
      order.amount,];
      this.backOrderedTable.rows.push(row);
    });
    this.doughnutChartData = [this.customerInquiryTotals.thisYearCustomerSales, this.customerInquiryTotals.thisYearSales]
    this.loading = false;
  }

  async percentChange(percentObj) {
    return await funcs.percentChange(percentObj);
  }

  async getSalesPeople(customerId) {
    let salesPeopleArr = await funcs.salesPeople({_id: customerId});
    this.customerSalesPeople = salesPeopleArr['result'];
  }
  async getManagedUsers() {
    let salesPeopleArr = await funcs.returnUserFromArray(this.managedUsers);
    this.customerSalesPeople = salesPeopleArr['result'];
  }

  onSelect(event) {
    if (event) {
      this._router.navigate([], { queryParams: { salesId: event }, queryParamsHandling: 'merge' })
    } else {
      if (this.viewAllPermission) {
        this._router.navigate([], { queryParams: { salesId: '' }, queryParamsHandling: 'merge' })
      } else {
        this._router.navigate([], { queryParams: { salesId: Meteor.userId() }, queryParamsHandling: 'merge' })
      }
    }
  }

  async redirect(type) {
    switch (type) {
      case 'invoice':
        let filterQuery = {
          name: 'Variable'
        };
        UserFilter._findDefaultFilterByQuery$(filterQuery)
          .pipe(
          filter((filter) => !!filter),
          map((filter: UserFilterModel) => new UserFilter(filter)),
          map((filter: UserFilter) => filter._getQueryParams()),
          defaultIfEmpty({})
          )
          .subscribe(queryParams => {
            queryParams['filtername'] = this.customerLabel;
            queryParams['customerName_value'] = this.customerLabel;
            this._router.navigate(['customers/invoices/'], { queryParams });
          });
        break;
      case 'order':
        let query = {
          name: 'Backordered'
        };
        UserFilter._findDefaultFilterByQuery$(query)
          .pipe(
          filter((filter) => !!filter),
          map((filter: UserFilterModel) => new UserFilter(filter)),
          map((filter: UserFilter) => filter._getQueryParams()),
          defaultIfEmpty({})
          )
          .subscribe(queryParams => {
            console.log(queryParams);
            queryParams['columns'].push('customerName');
            queryParams['customerName_method'] = '$eq';
            queryParams['customerName_value'] = this.customerLabel;
            this._router.navigate(['customers/orders/'], { queryParams });
          });

        break;
      default:

    }
  }



  normalTableRowSelect(event, type) {
    switch (type) {
      case 'invoice':
        this._router.navigate(['customers/invoices/' + event[0]]);
        break;
      case 'order':
        this._router.navigate(['customers/orders/' + event[0]]);
        break;
      default:

    }
  }

  selectCategoryRow(event) {
    this.data.categoryId = event.value._id;
    this._router.navigate([], { queryParams: { categoryId: event.value._id, view: 'productDetails' }, queryParamsHandling: 'merge' })
  }

  getCategoryLabel(id) {
    MeteorObservable.call('findOne', 'categories', { _id: id }, {}).subscribe((res: any) => {
      this.categorySelectedLabel = res.category + ' ' + res.description;
    })
  }

  goBack(event) {
    window.history.back();
  }

  async getTotalSales(dateRange, customerId?) {
    let match = {
      ...(customerId && { 'customerId': customerId }),
      'type': {
        $in: ['standard', 'credit memo']
      },
      'status': 'complete',
      'date': dateRange,
    }

    return await funcs.getTotalSalesInquiry(match);
  }

  async getTotalSalespersonSalesInquiry(dateRange, customerId) {
    let match = {
      ...(customerId && { 'customerId': customerId }),
      'type': {
        $in: ['standard', 'credit memo']
      },
      'status': 'complete',
      'date': dateRange,
    }

    return await funcs.getTotalSalespersonSalesInquiry(match, [this.selectedSalesperson]);
  }

  async last5Invoices(customerId) {
    let match = {
      'customerId': customerId,
      'type': {
        $in: ['standard', 'credit memo']
      },
      'status': 'complete',
    }

    return await funcs.last5Invoices(match);
  }

  async backOrderItems(customerId) {
    let match = {
      'customerId': customerId,
      'status': 'Open'
    }

    return await funcs.backOrderedItems(match);
  }
}
