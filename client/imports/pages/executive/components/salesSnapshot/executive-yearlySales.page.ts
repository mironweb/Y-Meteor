import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as funcs from '../../../../../../both/functions/common';
import * as moment from 'moment';
import {ActivatedRoute, Router} from '@angular/router';
import { MeteorObservable } from "meteor-rxjs";
import { AllCollections } from "../../../../../../both/collections/index";
import { merge } from 'rxjs';
import { EventEmitterService } from "../../../../services/index";

@Component({
  selector: 'executive-yearlySales',
  template: `
      <mat-card class='fullHeight'>
        <h2 style='margin-top: 0px; float: left;'>Sales Dashboard (Yearly)</h2>
        <span class='cardIcons'>
          <i class="material-icons" *hasPermission="['generateExecReport']" (click)='overviewFunc()'>playlist_add</i>
        </span>
        <hr style='clear: both;'>
        <div style="overflow-x:auto;">
          <table id='tables' *ngIf="!loading">
            <tr>
              <th class="rowHead"></th>
              <th *ngFor="let header of horizontalHeadersYear" class="col">{{header}}</th>
            </tr>
            <tr *ngFor="let row of rows" (click)='changeView(row)' [ngClass]="{pointer: row.sideHeader.title === 'Expenses' || row.sideHeader.title === 'PPV'}">
              <th class="rowHead">{{row.sideHeader.title}}</th>
                <td class='alignRight'>{{row.currentYearTotal}}</td>
                <td class='alignRight'>{{row.previousYearTotal}}</td>
                <td class='alignRight'>{{row.previousWholeYear}}</td>
            </tr>
          </table>
          <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
        </div>
      </mat-card>
  `,
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutiveYearlySalesPage implements OnInit{

  @Input() data: any;
  filterConditions: any;
  objLocal: any = {};
  yearlyIncomeData: any = {};
  loading: boolean = true;
  month: any = new Date().getMonth() + 1;
  currentYear: any = moment().format('YYYY');
  lastYear: any = moment().subtract(1, 'years').format('YYYY')
  rows = [];
  horizontalHeadersYear = [
    this.currentYear + ' (To Date)',
    this.lastYear + ' (To Date)',
    this.lastYear + ' (All Year)',
  ];
  // rows: any;
  // @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}
  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
    this.yearlyIncomeData.monthIndexYearly = this.month;
    this.yearlyIncomeData.pastYearYearly = parseInt(this.lastYear);
    this.yearlyIncomeData.currentYearYearly = parseInt(this.currentYear);

    // let query = {
    //   status: 'open',
    //   date: {
    //     $gte: new Date(moment().startOf('year').format()),
    //     $lte: new Date()
    //   }
    // }
    // const sub = MeteorObservable.subscribe('customerInvoices', query);
    // const autorun = MeteorObservable.autorun();
    // merge(sub, autorun).subscribe(() => {
    //   let result = AllCollections['customerInvoices'].collection.find().fetch();
    //   // console.log(result);
    //   if (this.rows.length > 0) {
    //     this.getSalesDashBoardInfo();
    //   }
    // })
  }

  ngOnInit() {
    this.init();
    this.getSalesDashBoardInfo();
  }   

  async getSalesDashBoardInfo() {
    let sales = {};
    let cost = {};
    let invoices = {};
    let profit = {};
    let profitPercent = {};
    let expenses = {};
    let netIncome = {};
    let ppv = {};
    let rows = [
      sales, cost, profit, profitPercent, invoices, expenses, netIncome, ppv
    ]
    let thisYearRange = {
      gte: new Date(moment().startOf('year').format()),
      lte: new Date()
    }
    let lastYearRange = {
      gte: new Date(moment().startOf('year').subtract(1, 'years').format()),
      lte: new Date(moment().subtract(1, 'years').format())
    }
    let lastWholeYearRange = {
      gte: new Date(moment().startOf('year').subtract(1, 'years').format()),
      lte: new Date(moment().endOf('year').subtract(1, 'years').format())
    }

    sales['sideHeader'] = { title: 'Sales', type: 'dollar' };
    sales['currentYearTotal'] = await funcs.getTotalSales(thisYearRange).catch(error => console.log(error));
    sales['previousYearTotal'] = await funcs.getTotalSales(lastYearRange).catch(error => console.log(error));
    sales['previousWholeYear'] = await funcs.getTotalSales(lastWholeYearRange).catch(error => console.log(error));

    cost['sideHeader'] = { title: 'Cost', type: 'dollar' };;
    cost['currentYearTotal'] = await funcs.getTotalCost(thisYearRange).catch(error => console.log(error));
    cost['previousYearTotal'] = await funcs.getTotalCost(lastYearRange).catch(error => console.log(error));
    cost['previousWholeYear'] = await funcs.getTotalCost(lastWholeYearRange).catch(error => console.log(error));

    invoices['sideHeader'] = { title: 'Invoices', type: 'number' };;
    invoices['currentYearTotal'] = await funcs.countInvoices(thisYearRange).catch(error => console.log(error));
    invoices['previousYearTotal'] = await funcs.countInvoices(lastYearRange).catch(error => console.log(error));
    invoices['previousWholeYear'] = await funcs.countInvoices(lastWholeYearRange).catch(error => console.log(error));

    expenses['sideHeader'] = { title: 'Expenses', type: 'dollar' };
    expenses['currentYearTotal'] = await funcs.getExpenses(this.currentYear, 0, 12).catch(error => console.log(error));
    expenses['previousYearTotal'] = await funcs.getExpenses(this.lastYear, 0, this.month).catch(error => console.log(error));
    expenses['previousWholeYear'] = await funcs.getExpenses(this.lastYear, 0, 12).catch(error => console.log(error));

    ppv['sideHeader'] = { title: 'PPV', type: 'dollar' };
    ppv['currentYearTotal'] = await funcs.ppv(this.currentYear, 0, 12).catch(error => console.log(error));
    ppv['previousYearTotal'] = await funcs.ppv(this.lastYear, 0, this.month).catch(error => console.log(error));
    ppv['previousWholeYear'] = await funcs.ppv(this.lastYear, 0, 12).catch(error => console.log(error));

    rows.forEach(element => {
      this.fixObject(element);
    });

    profit['sideHeader'] = { title: 'Profit', type: 'dollar' };;
    profit['currentYearTotal'] = sales['currentYearTotal'] - cost['currentYearTotal'];
    profit['previousYearTotal'] = sales['previousYearTotal'] - cost['previousYearTotal'];
    profit['previousWholeYear'] = sales['previousWholeYear'] - cost['previousWholeYear'];

    profitPercent['sideHeader'] = { title: 'Profit %', type: 'percent' };;
    profitPercent['currentYearTotal'] = (profit['currentYearTotal'] / sales['currentYearTotal'] * 100);
    profitPercent['previousYearTotal'] = (profit['previousYearTotal'] / sales['previousYearTotal'] * 100);
    profitPercent['previousWholeYear'] = (profit['previousWholeYear'] / sales['previousWholeYear'] * 100);

    netIncome['sideHeader'] = { title: 'Net Income', type: 'dollar' };
    netIncome['currentYearTotal'] = (profit['currentYearTotal'] - expenses['currentYearTotal']);
    netIncome['previousYearTotal'] = (profit['previousYearTotal'] - expenses['previousYearTotal']);
    netIncome['previousWholeYear'] = (profit['previousWholeYear'] - expenses['previousWholeYear']);

    this.rows = rows;
    this.formatRows(rows);
  }

  fixObject(obj) {
    Object.keys(obj).forEach(function (key) {
      if (obj[key]['result']) {
        if (obj[key]['result'].length > 0) {
          if (obj[key]['result'][0]['total'] || obj[key]['result'][0]['total'] === 0) {
            obj[key] = obj[key]['result'][0]['total'] !== 0 ? obj[key]['result'][0]['total'] : 0.00;
          } else if (obj[key]['result'][0]['count'] || obj[key]['result'][0]['count'] === 0) {
            obj[key] = obj[key]['result'][0]['count'] !== 0 ? obj[key]['result'][0]['count'] : 0.00;
          }
        } else {
          obj[key] = 0.00;
        }
      }
    })
  }

  formatRows(rowArr) {
    for (var i = 0; i < rowArr.length; i++) {
      let obj = rowArr[i];
      let type = obj.sideHeader.type;
      Object.keys(obj).forEach(function (key) {
        if (key !== 'sideHeader') {
          switch (type) {
            case 'dollar':
              obj[key] = funcs.formatMoney(obj[key]);
              break;
            case 'percent':
              obj[key] = isNaN(obj[key]) ? '0.00%' : obj[key].toFixed(2) + '%';
              break;
            default:
              obj[key] = obj[key]
          }
        }
      })
    }
    this.loading = false;
  }

  async overviewFunc() {
    EventEmitterService.Events.emit({
      "name": "overviewReport",
      "value": {
        "name": "yearlySales",
        "title": 'Sales Dashboard (Yearly)',
        "value": await this.returnData()
      }
    });
  }

  async returnData() {
    let value = this.rows;
    let rows = [
      {
        label: '',
        currentYearTotal: this.horizontalHeadersYear[0],
        previousYearTotal: this.horizontalHeadersYear[1],
        previousWholeYear: this.horizontalHeadersYear[2]
      }
    ];
    for (let index = 0; index < value.length; index++) {
      const el = value[index];
      let obj = {
        label: el.sideHeader.title,
        currentYearTotal: el.currentYearTotal,
        previousYearTotal: el.previousYearTotal,
        previousWholeYear: el.previousWholeYear
      }
      rows.push(obj)
    }
    let table = {
      rows: rows,
      columns: [
        {
          "prop": "label",
          "type": "string",
        },
        {
          "prop": "currentYearTotal",
          "type": "string",
        },
        {
          "prop": "previousYearTotal",
          "type": "string",
        },
        {
          "prop": "previousWholeYear",
          "type": "string",
        },
      ]
    }
    return table;
  }

  changeView(row) {
    if (row.sideHeader.title === 'Expenses' || row.sideHeader.title === 'PPV') {
      let lookupData = this.yearlyIncomeData
      let view
      switch (row.sideHeader.title) {
        case 'Expenses':
          view = {
            view: 'yearlyExpenses',
          }
          break;
        case 'PPV':
          view = {
            view: 'yearlyPPV',
          }
          break;
        default:

      }
      lookupData = Object.assign(view, lookupData);
      this.lookupView.emit(lookupData);
    }
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

  getRows(rows) {
    // console.log(rows);
    // this.rows.emit(rows);
  }

  select(event) {
    this.router.navigate(['customers/orders/' + event['_id']]);
    // window.location.href = 'https://app.yibas.com/orders/' + event._id;
  }
}
