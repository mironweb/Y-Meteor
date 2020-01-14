import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import * as funcs from '../.././../../../../both/functions/common';
// import * as moment from 'moment';
import { FormControl } from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import { EventEmitterService } from "../../../../services/index";
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

import * as _moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports
import { default as _rollupMoment } from 'moment';

const moment = _rollupMoment || _moment;

export const MY_FORMATS = {
  parse: {
    dateInput: 'MMM',
  },
  display: {
    dateInput: 'MMM',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'MMM',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'executive-monthlySales',
  template: `
      <mat-card class='fullHeight'>
        <h2 style='margin-top: 0px; float: left;' (click)='dateChange(currentMonth - 1, 2019)'>Sales Dashboard (Monthly)</h2>
        <span class='cardIcons'>
          <i class="material-icons" (click)="showDate = !showDate;">date_range</i>
          <i class="material-icons" *hasPermission="['generateExecReport']" (click)='overviewFunc()'>playlist_add</i>
        </span>
        <hr style='clear: both;'>
        <div style="overflow-x:auto;">
          <span *ngIf='showDate'>
            <mat-form-field style='float: left; width: 49%;'>
              <input matInput #datePickerInput [value]='startDate.value' [matDatepicker]="picker" placeholder="Choose a date">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker startView="year" [startAt]="startDate" (monthSelected)='dateChange($event); picker.close()'></mat-datepicker>
            </mat-form-field>
          </span>
          <table id='tables' *ngIf="!loading">
            <tr>
              <th class="rowHead"></th>
              <th class="col">{{formatDate("MMM, YYYY")}} (To Date)</th>
              <th class="col">{{formatDate("MMM, YYYY")}} (To Date)</th>
              <th class="col">{{formatDate("MMM, YYYY")}} (All Month)</th>
            </tr>
            <tr *ngFor="let row of rows" (click)='changeView(row)' [ngClass]="{pointer: row.sideHeader.title === 'Expenses' || row.sideHeader.title === 'PPV'}">
              <th class="rowHead">{{row.sideHeader.title}}</th>
                <td class='alignRight'>{{row.thisMonth}}</td>
                <td class='alignRight'>{{row.thisMonthLastYear}}</td>
                <td class='alignRight'>{{row.thisWholeMonthLastYear}}</td>
            </tr>
          </table>
          <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
        </div>
      </mat-card>
  `,
  styleUrls: ['../executive-dashboard.page.scss'],
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})

export class ExecutiveMonthlySalesPage implements OnInit{

  @Input() data: any;
  @ViewChild('datePickerInput') datePickerInput;

  filterConditions: any;
  objLocal: any = {};
  monthlyIncomeData: any = {};
  loading: boolean = true;
  showDate: boolean = false;
  actualDay: any = moment().date();
  actualMonth: any = moment().month() + 1;
  currentMonth: any = this.actualMonth;
  currentYear: any = moment().format('YYYY');
  lastYear: any = moment().subtract(1, 'years').format('YYYY')
  startDate: any = new FormControl(new Date(moment(`${this.currentMonth} ${this.currentYear}`, 'M YYYY').format()));
  rows = [];
  currentMonthRange = {
    gte: new Date(moment().startOf('month').format()),
    lte: new Date()
  }
  lastYearMonthRange = {
    gte: new Date(moment().startOf('month').subtract(1, 'years').format()),
    lte: new Date(moment().subtract(1, 'years').format())
  }
  lastYearWholeMonthRange = {
    gte: new Date(moment().startOf('month').subtract(1, 'years').format()),
    lte: new Date(moment().endOf('month').subtract(1, 'years').format())
  }
  // rows: any;
  // @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}
  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
    this.monthlyIncomeData.monthIndexMonthly = moment().month();
    this.monthlyIncomeData.pastYearMonthly = parseInt(this.lastYear);
    this.monthlyIncomeData.currentYearMonthly = parseInt(this.currentYear);

    let query = {
      status: 'open',
      date: {
        $gte: new Date(moment().startOf('month').format()),
        $lte: new Date()
      }
    }
    // const sub = MeteorObservable.subscribe('customerInvoices', query);
    // const autorun = MeteorObservable.autorun();
    // merge(sub, autorun).subscribe(() => {
      // let result = AllCollections['customerInvoices'].collection.find().fetch();
      // if (this.rows.length > 0) {
        // this.getSalesDashBoardInfo();
      // }
    // })
  }

  ngOnInit() {
    this.init();
    this.getSalesDashBoardInfo();
  }   

  dateChange(event){
    this.loading = true;
    this.startDate.value = new Date(event);
    let month = moment(event).month() + 1;
    let year = moment(event).year();
    
    this.currentMonthRange = {
      gte: new Date(moment(`${month} ${year}`, 'M YYYY').startOf('month').format()),
      lte: new Date(moment(`${month} ${year}`, 'M YYYY').endOf('month').format())
    }
    this.lastYearMonthRange = {
      gte: new Date(moment(`${month} ${year}`, 'M YYYY').startOf('month').subtract(1, 'years').format()),
      lte: new Date(moment(`${month} ${this.actualDay} ${year}`, 'M D YYYY').subtract(1, 'years').format())
    }
    this.lastYearWholeMonthRange = {
      gte: new Date(moment(`${month} ${year}`, 'M YYYY').startOf('month').subtract(1, 'years').format()),
      lte: new Date(moment(`${month} ${year}`, 'M YYYY').endOf('month').subtract(1, 'years').format())
    }
    this.currentMonth = month;
    this.currentYear = year.toString();

    this.getSalesDashBoardInfo();
  }

  // setDatePicker(date){
  //   console.log(date)
  //   console.log(this.datePickerInput)
  //   console.log(this.datePickerInput.nativeElement.value)
  //   this.datePickerInput.nativeElement.value = moment(date).format('MMMM');
  //   // this.datePickerInput.value
  // }

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

    sales['sideHeader'] = { title: 'Sales', type: 'dollar' };
    sales['thisMonth'] = await funcs.getTotalMonthSales(this.currentMonthRange);
    sales['thisMonthLastYear'] = await funcs.getTotalMonthSales(this.lastYearMonthRange);
    sales['thisWholeMonthLastYear'] = await funcs.getTotalMonthSales(this.lastYearWholeMonthRange);

    cost['sideHeader'] = { title: 'Cost', type: 'dollar' };
    cost['thisMonth'] = await funcs.getTotalMonthCost(this.currentMonthRange);
    cost['thisMonthLastYear'] = await funcs.getTotalMonthCost(this.lastYearMonthRange);
    cost['thisWholeMonthLastYear'] = await funcs.getTotalMonthCost(this.lastYearWholeMonthRange);

    invoices['sideHeader'] = { title: 'Invoices', type: 'number' };
    invoices['thisMonth'] = await funcs.countInvoices(this.currentMonthRange);
    invoices['thisMonthLastYear'] = await funcs.countInvoices(this.lastYearMonthRange);
    invoices['thisWholeMonthLastYear'] = await funcs.countInvoices(this.lastYearWholeMonthRange);

    expenses['sideHeader'] = { title: 'Expenses', type: 'dollar' };
    expenses['thisMonth'] = await funcs.getExpenses(this.currentYear, this.currentMonth, 1);
    expenses['thisMonthLastYear'] = await funcs.getExpenses(this.lastYear, this.currentMonth, 1);
    expenses['thisWholeMonthLastYear'] = await funcs.getExpenses(this.lastYear, this.currentMonth, 1);

    ppv['sideHeader'] = { title: 'PPV', type: 'dollar' };
    ppv['thisMonth'] = await funcs.ppv(this.currentYear, this.currentMonth, 1);
    ppv['thisMonthLastYear'] = await funcs.ppv(this.lastYear, this.currentMonth, 1);
    ppv['thisWholeMonthLastYear'] = await funcs.ppv(this.lastYear, this.currentMonth, 1);

    rows.forEach(element => {
      this.fixObject(element);
    });

    profit['sideHeader'] = { title: 'Profit', type: 'dollar' };
    profit['thisMonth'] = sales['thisMonth'] - cost['thisMonth'];
    profit['thisMonthLastYear'] = sales['thisMonthLastYear'] - cost['thisMonthLastYear'];
    profit['thisWholeMonthLastYear'] = sales['thisWholeMonthLastYear'] - cost['thisWholeMonthLastYear'];

    profitPercent['sideHeader'] = { title: 'Profit %', type: 'percent' };
    profitPercent['thisMonth'] = (profit['thisMonth'] / sales['thisMonth'] * 100);
    profitPercent['thisMonthLastYear'] = (profit['thisMonthLastYear'] / sales['thisMonthLastYear'] * 100);
    profitPercent['thisWholeMonthLastYear'] = (profit['thisWholeMonthLastYear'] / sales['thisWholeMonthLastYear'] * 100);

    netIncome['sideHeader'] = { title: 'Net Income', type: 'dollar' };
    netIncome['thisMonth'] = (profit['thisMonth'] - expenses['thisMonth']);
    netIncome['thisMonthLastYear'] = (profit['thisMonthLastYear'] - expenses['thisMonthLastYear']);
    netIncome['thisWholeMonthLastYear'] = (profit['thisWholeMonthLastYear'] - expenses['thisWholeMonthLastYear']);

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

  changeView(row) {
    if (row.sideHeader.title === 'Expenses' || row.sideHeader.title === 'PPV') {
      let lookupData = this.monthlyIncomeData
      let view
      switch (row.sideHeader.title) {
        case 'Expenses':
          view = {
            view: 'monthlyExpenses',
          }
          break;
        case 'PPV':
          view = {
            view: 'monthlyPPV',
          }
          break;
        default:
          
      }
      lookupData = Object.assign(view, lookupData);
      this.lookupView.emit(lookupData);
    }
  }

  async overviewFunc() {
    EventEmitterService.Events.emit({
      "name": "overviewReport",
      "value": {
        "name": "monthlySales",
        "title": ' Sales Dashboard (Monthly)',
        "value": await this.returnData()
      }
    });
  }

  async returnData() {
    let value = this.rows;
    let rows = [
      {
        label: '',
        thisMonth: `${this.formatDate("MMM, YYYY")} (To Date)`,
        thisMonthLastYear: `${this.formatDate("MMM, YYYY")} (To Date)`,
        thisWholeMonthLastYear: `${this.formatDate("MMM, YYYY")} (All Month)`
      }
    ];
    for (let index = 0; index < value.length; index++) {
      const el = value[index];
      let obj = {
        label: el.sideHeader.title,
        thisMonth: el.thisMonth,
        thisMonthLastYear: el.thisMonthLastYear,
        thisWholeMonthLastYear: el.thisWholeMonthLastYear
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
          "prop": "thisMonth",
          "type": "string",
        },
        {
          "prop": "thisMonthLastYear",
          "type": "string",
        },
        {
          "prop": "thisWholeMonthLastYear",
          "type": "string",
        },
      ]
    }
    return table;
  }

  formatDate(format){
    return moment(`${this.currentMonth} ${this.currentYear}`, "M YYYY").format(format)
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
