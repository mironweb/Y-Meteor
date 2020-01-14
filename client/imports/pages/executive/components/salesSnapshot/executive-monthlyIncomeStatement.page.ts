import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as funcs from '../../../../../../both/functions/common';
import * as moment from 'moment';
import { FormControl } from '@angular/forms';
import { MeteorObservable } from "meteor-rxjs";
import {ActivatedRoute, Router} from '@angular/router';
import { AllCollections } from "../../../../../../both/collections/index";
import { merge } from 'rxjs';
import { EventEmitterService } from "../../../../services/index";

@Component({
  selector: 'executive-monthlyIncomeStatement',
  template: `
      <mat-card class='fullHeight'>
      <h2 style='margin-top: 0px; float: left;'> Income Statement (Monthly)</h2>
      <span class='cardIcons'>
        <i class="material-icons" (click)="toggleDatePicker()">date_range</i>
        <i class="material-icons" *hasPermission="['generateExecReport']" (click)='overviewFunc()'>playlist_add</i>
      </span>
      <hr style='clear: both;'>
        <div style="overflow-x:auto;">
        <span *ngIf='showDatePickers'>
          <mat-form-field style='float: left; width: 49%;'>
            <input matInput [matDatepicker]="startPicker" [max]="date.endMonth.value" [value]="date.startMonth.value" (dateChange)="changeDateRange('start', $event)" placeholder="Start Date">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field style='float: right; width: 49%;'>
            <input matInput [matDatepicker]="endPicker" [min]="date.startMonth.value" [value]="date.endMonth.value" (dateChange)="changeDateRange('end', $event)"placeholder="End Date">
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </span>
          <table id='tables' *ngIf="!loading">
            <tr>
              <th class="rowHead"></th>
              <th *ngFor="let header of horizontalHeadersMonth" class="col">{{header}}</th>
            </tr>
            <tr *ngFor="let row of rows" (click)='changeView(row)' [ngClass]="{pointer: 
              row.sideHeader.title === 'Revenue' ||
              row.sideHeader.title === 'Cost of Sales' ||
              row.sideHeader.title === 'Expenses'}">
              <th class="rowHead">{{row.sideHeader.title}}</th>
                <td class='alignRight'>{{row.thisMonth}}</td>
                <td class='alignRight'>{{row.thisMonthLastYear}}</td>
            </tr>
          </table>
          <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
        </div>
      </mat-card>
  `,
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutiveMonthlyIncomeStatementPage implements OnInit{

  @Input() data: any;
  filterConditions: any;
  objLocal: any = {};
  monthlyIncomeData: any = {};
  loading: boolean = true;
  date: any = {};
  currentYear: any = moment().format('YYYY');
  lastYear: any = moment().subtract(1, 'years').format('YYYY')
  matches: any = {};
  showDatePickers: boolean = false;
  rows = [];
  horizontalHeadersMonth: any;
  // rows: any;
  // @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}
  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
    // this.monthlyIncomeData.monthIndexMonthly = moment().month();
    // this.monthlyIncomeData.monthSlice = 1;
    // this.monthlyIncomeData.pastYearMonthly = parseInt(this.lastYear);
    // this.monthlyIncomeData.currentYearMonthly = parseInt(this.currentYear);
    this.date.startMonth = new FormControl(new Date(moment().startOf('month').format()));
    this.date.endMonth = new FormControl(new Date(moment().endOf('month').format()));
    this.getRangeTitles(this.date.startMonth.value, this.date.endMonth.value);
    this.updateIndexes(this.date.startMonth.value, this.date.endMonth.value);
    this.updateYears(parseInt(this.lastYear), parseInt(this.currentYear));

    // let query = {
    //   'status': 'active', 
    //   'category': {
    //     $in: ['Revenue', 'Cost of Sales', 'Expenses']}
    // }
    // const sub = MeteorObservable.subscribe('ledgerAccounts', query);
    // const autorun = MeteorObservable.autorun();
    // merge(sub, autorun).subscribe(() => {
    //   let result = AllCollections['ledgerAccounts'].collection.find().fetch();
    //   if (this.rows.length > 0) {
    //     this.getSalesDashBoardInfo(moment().month(), 1);
    //   }
    // })
  }

  ngOnInit() {
    this.init();
    this.getSalesDashBoardInfo(moment().month(), 1);
  }   

  toggleDatePicker() { 
    this.showDatePickers = !this.showDatePickers;
  }   

  async getSalesDashBoardInfo(month, slice) {
    let revenue = {};
    let costOfSale = {};
    let profit = {};
    let expenses = {};
    let netIncome = {};
    let rows = [
      revenue,
      costOfSale,
      profit,
      expenses,
      netIncome
    ]
    let currentMonthRange = {
      gte: new Date(moment().startOf('month').format()),
      lte: new Date()
    }
    let lastYearMonthRange = {
      gte: new Date(moment().startOf('month').subtract(1, 'years').format()),
      lte: new Date(moment().subtract(1, 'years').format())
    }
    let lastYearWholeMonthRange = {
      gte: new Date(moment().startOf('month').subtract(1, 'years').format()),
      lte: new Date(moment().endOf('month').subtract(1, 'years').format())
    }

    this.matches.revenue = { 'status': 'active', 'category': 'Revenue' } ;
    revenue['sideHeader'] = { title: 'Revenue', type: 'dollar' };
    revenue['thisMonth'] = await funcs.getIncomeStatementDataSubtractCredit(this.matches.revenue, this.currentYear, month, slice).catch(error => console.log(error));
    revenue['thisMonthLastYear'] = await funcs.getIncomeStatementDataSubtractCredit(this.matches.revenue, this.lastYear, month, slice).catch(error => console.log(error));
    // revenue['thisWholeMonthLastYear'] = await funcs.getIncomeStatementDataSubtractCredit(this.matches.revenue, this.lastYear, moment().month(), 1).catch(error => console.log(error));

    this.matches.costOfSale = { 'status': 'active', 'category': 'Cost of Sales' };
    costOfSale['sideHeader'] = { title: 'Cost of Sales', type: 'dollar' };;
    costOfSale['thisMonth'] = await funcs.getIncomeStatementDataSubtractDebit(this.matches.costOfSale, this.currentYear, month, slice).catch(error => console.log(error));
    costOfSale['thisMonthLastYear'] = await funcs.getIncomeStatementDataSubtractDebit(this.matches.costOfSale, this.lastYear, month, slice).catch(error => console.log(error));
    // costOfSale['thisWholeMonthLastYear'] = await funcs.getIncomeStatementDataSubtractDebit(this.matches.costOfSale, this.lastYear, moment().month(), 1).catch(error => console.log(error));

    this.matches.expenses = { 'status': 'active', 'category': 'Expenses' };
    expenses['sideHeader'] = { title: 'Expenses', type: 'dollar' };
    expenses['thisMonth'] = await funcs.getIncomeStatementDataSubtractDebit(this.matches.expenses, this.currentYear, month, slice).catch(error => console.log(error));
    expenses['thisMonthLastYear'] = await funcs.getIncomeStatementDataSubtractDebit(this.matches.expenses, this.lastYear, month, slice).catch(error => console.log(error));
    // expenses['thisWholeMonthLastYear'] = await funcs.getIncomeStatementDataSubtractDebit(this.matches.expenses, this.lastYear, moment().month(), 1).catch(error => console.log(error));

    rows.forEach(element => {
      this.fixObject(element);
    });

    profit['sideHeader'] = { title: 'Profit', type: 'dollar' };;
    profit['thisMonth'] = revenue['thisMonth'] - costOfSale['thisMonth'];
    profit['thisMonthLastYear'] = revenue['thisMonthLastYear'] - costOfSale['thisMonthLastYear'];
    // profit['thisWholeMonthLastYear'] = revenue['thisWholeMonthLastYear'] - costOfSale['thisWholeMonthLastYear'];

    netIncome['sideHeader'] = { title: 'Net Income', type: 'dollar' };
    netIncome['thisMonth'] = (profit['thisMonth'] - expenses['thisMonth']);
    netIncome['thisMonthLastYear'] = (profit['thisMonthLastYear'] - expenses['thisMonthLastYear']);
    // netIncome['thisWholeMonthLastYear'] = (profit['thisWholeMonthLastYear'] - expenses['thisWholeMonthLastYear']);

    this.monthlyIncomeData.thisPeriodTotal = revenue['thisMonth'];
    this.monthlyIncomeData.lastPeriodTotal = revenue['thisMonthLastYear'];
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
    if (row.sideHeader.title === 'Expenses' || 
      row.sideHeader.title === 'Cost of Sales' ||
      row.sideHeader.title === 'Revenue'
      ) {
      let lookupData = this.monthlyIncomeData
      let view
      switch (row.sideHeader.title) {
        case 'Expenses':
          view = {
            view: 'monthlyCreditMinusDebit',
            pageHeader: 'Income State Monthly Expenses',
            match: this.matches.expenses
          }
          break;
        case 'Cost of Sales':
          view = {
            view: 'monthlyCreditMinusDebit',
            pageHeader: 'Income State Monthly Cost of Sales',
            match: this.matches.costOfSale
          }
          break;
        case 'Revenue':
          view = {
            view: 'monthlyDebitMinusCredit',
            pageHeader: 'Income State Monthly Revenue',
            match: this.matches.revenue
          }
          break;
        default:
          
      }
      view['JSONmatch'] = JSON.stringify(view['match']);
      lookupData = Object.assign(view, lookupData);
      this.lookupView.emit(lookupData);
    }
  }

  async changeDateRange(input, event) {
    let date = event.value;
    switch (input) {
      case 'start':
        this.date.startMonth = new FormControl(new Date(moment(date).startOf('month').format()));
        break;
        case 'end':
        this.date.endMonth = new FormControl(new Date(new Date(moment(date).endOf('month').format())));
        break;
      default:
    }

    let start = this.date.startMonth.value;
    let end = this.date.endMonth.value;
    this.getRangeTitles(start, end);
    this.updateIndexes(start, end);
    this.updateYears(moment(start).year() - 1, moment(end).year());
    
    if (this.date.startMonth && this.date.endMonth) {
      this.loading = true;
      this.getSalesDashBoardInfo(this.monthlyIncomeData.monthIndexMonthly, this.monthlyIncomeData.monthSlice);
    }
  }

  updateIndexes(startDate, endDate) {
    this.monthlyIncomeData.monthIndexMonthly = moment(startDate).month();
    this.monthlyIncomeData.monthSlice = ((moment(endDate).month() + 1) - this.monthlyIncomeData.monthIndexMonthly);
  }

  updateYears(lastYear, currentYear) {
    this.monthlyIncomeData.pastYearMonthly = lastYear;
    this.monthlyIncomeData.currentYearMonthly = currentYear;
  }

  getRangeTitles(startDate, endDate) {
    let startMonth = moment(startDate).format('MMM');
    let endMonth = moment(endDate).format('MMM');
    let startYear = moment(startDate).format('YYYY');
    // let title = startMonth + " - " + endMonth
    let title = startMonth === endMonth ? startMonth : startMonth + " - " + endMonth
    
    this.horizontalHeadersMonth = [
      title + ' ' + startYear,
      title + ' ' + (parseInt(startYear) - 1),
    ];
  }

  async overviewFunc() {
    EventEmitterService.Events.emit({
      "name": "overviewReport",
      "value": {
        "name": "monthlyIncomeStatement",
        "title": 'Income Statement (Monthly)',
        "value": await this.returnData()
      }
    });
  }

  async returnData() {
    let value = this.rows;
    let rows = [
      {
        label: '',
        thisMonth: this.horizontalHeadersMonth[0],
        thisMonthLastYear: this.horizontalHeadersMonth[1],
      }
    ];
    for (let index = 0; index < value.length; index++) {
      const el = value[index];
      let obj = {
        label: el.sideHeader.title,
        thisMonth: el.thisMonth,
        thisMonthLastYear: el.thisMonthLastYear,
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
      ]
    }
    return table;
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
