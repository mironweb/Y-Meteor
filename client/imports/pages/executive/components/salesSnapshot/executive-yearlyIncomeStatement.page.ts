import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as funcs from '../../../../../../both/functions/common';
import * as moment from 'moment';
import { MeteorObservable } from "meteor-rxjs";
import {ActivatedRoute, Router} from '@angular/router';
import { AllCollections } from "../../../../../../both/collections/index";
import { merge } from 'rxjs';
import { EventEmitterService } from "../../../../services/index";

@Component({
  selector: 'executive-yearlyIncomeStatement',
  template: `
      <mat-card class='fullHeight'>
        <h2 style='margin-top: 0px; float: left;'>Income Statement (Yearly)</h2>
        <span class='cardIcons'>
          <i class="material-icons" *hasPermission="['generateExecReport']" (click)='overviewFunc()'>playlist_add</i>
        </span>
        <hr style='clear: both;'>
        <div style="overflow-x:auto;">
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

export class ExecutiveYearlyIncomeStatementPage implements OnInit{

  @Input() data: any;
  filterConditions: any;
  objLocal: any = {};
  yearlyIncomeData: any = {};
  matches: any = {};
  loading: boolean = true;
  month: any = new Date().getMonth() + 1;
  currentYear: any = moment().format('YYYY');
  lastYear: any = moment().subtract(1, 'years').format('YYYY')
  rows = [];
  horizontalHeadersMonth = [
    this.currentYear + ' (To Date)',
    this.lastYear + ' (Month End)',
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
    this.yearlyIncomeData.monthIndexYearly = moment().month() + 1;
    this.yearlyIncomeData.pastYearYearly = parseInt(this.lastYear);
    this.yearlyIncomeData.currentYearYearly = parseInt(this.currentYear);

    // let query = {
    //   'status': 'active',
    //   'category': {
    //     $in: ['Revenue', 'Cost of Sales', 'Expenses']
    //   }
    // }
    // const sub = MeteorObservable.subscribe('ledgerAccounts', query);
    // const autorun = MeteorObservable.autorun();
    // merge(sub, autorun).subscribe(() => {
    //   let result = AllCollections['ledgerAccounts'].collection.find().fetch();
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

    
    this.matches.revenue = { 'status': 'active', 'category': 'Revenue' };
    revenue['sideHeader'] = { title: 'Revenue', type: 'dollar' };
    revenue['currentYearTotal'] = await funcs.getIncomeStatementDataSubtractCredit(this.matches.revenue, this.currentYear, 0, 12).catch(error => console.log(error));
    revenue['previousYearTotal'] = await funcs.getIncomeStatementDataSubtractCredit(this.matches.revenue,this.lastYear, 0, this.month).catch(error => console.log(error));
    revenue['previousWholeYear'] = await funcs.getIncomeStatementDataSubtractCredit(this.matches.revenue,this.lastYear, 0, 12).catch(error => console.log(error));
    
    this.matches.costOfSale = { 'status': 'active', 'category': 'Cost of Sales' };
    costOfSale['sideHeader'] = { title: 'Cost of Sales', type: 'dollar' };;
    costOfSale['currentYearTotal'] = await funcs.getIncomeStatementDataSubtractDebit(this.matches.costOfSale, this.currentYear, 0, 12).catch(error => console.log(error));
    costOfSale['previousYearTotal'] = await funcs.getIncomeStatementDataSubtractDebit(this.matches.costOfSale, this.lastYear, 0, this.month).catch(error => console.log(error));
    costOfSale['previousWholeYear'] = await funcs.getIncomeStatementDataSubtractDebit(this.matches.costOfSale, this.lastYear, 0, 12).catch(error => console.log(error));
    
    this.matches.expenses = { 'status': 'active', 'category': 'Expenses' };
    expenses['sideHeader'] = { title: 'Expenses', type: 'dollar' };
    expenses['currentYearTotal'] = await funcs.getIncomeStatementDataSubtractDebit(this.matches.expenses, this.currentYear, 0, 12).catch(error => console.log(error));
    expenses['previousYearTotal'] = await funcs.getIncomeStatementDataSubtractDebit(this.matches.expenses, this.lastYear, 0, this.month).catch(error => console.log(error));
    expenses['previousWholeYear'] = await funcs.getIncomeStatementDataSubtractDebit(this.matches.expenses, this.lastYear, 0, 12).catch(error => console.log(error));

    rows.forEach(element => {
      this.fixObject(element);
    });

    profit['sideHeader'] = { title: 'Profit', type: 'dollar' };;
    profit['currentYearTotal'] = revenue['currentYearTotal'] - costOfSale['currentYearTotal'];
    profit['previousYearTotal'] = revenue['previousYearTotal'] - costOfSale['previousYearTotal'];
    profit['previousWholeYear'] = revenue['previousWholeYear'] - costOfSale['previousWholeYear'];

    netIncome['sideHeader'] = { title: 'Net Income', type: 'dollar' };
    netIncome['currentYearTotal'] = (profit['currentYearTotal'] - expenses['currentYearTotal']);
    netIncome['previousYearTotal'] = (profit['previousYearTotal'] - expenses['previousYearTotal']);
    netIncome['previousWholeYear'] = (profit['previousWholeYear'] - expenses['previousWholeYear']);

    this.yearlyIncomeData.thisPeriodTotal = revenue['currentYearTotal'];
    this.yearlyIncomeData.lastPeriodTotal = revenue['previousYearTotal'];
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
      let lookupData = this.yearlyIncomeData
      let view
      switch (row.sideHeader.title) {
        case 'Expenses':
          view = {
            view: 'yearlyCreditMinusDebit',
            pageHeader: 'Income State Yearly Expenses',
            match: this.matches.expenses
          }
          break;
        case 'Cost of Sales':
          view = {
            view: 'yearlyCreditMinusDebit',
            pageHeader: 'Income State Yearly Cost of Sales',
            match: this.matches.costOfSale
          }
          break;
        case 'Revenue':
          view = {
            view: 'yearlyDebitMinusCredit',
            pageHeader: 'Income State Yearly Revenue',
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

  async overviewFunc() {
    EventEmitterService.Events.emit({
      "name": "overviewReport",
      "value": {
        "name": "yearlyIncomeStatement",
        "title": 'Income Statement (Yearly)',
        "value": await this.returnData()
      }
    });
  }

  async returnData() {
    let value = this.rows;
    let rows = [
      {
        label: '',
        currentYearTotal: this.horizontalHeadersMonth[0],
        previousYearTotal: this.horizontalHeadersMonth[1],
        previousWholeYear: this.horizontalHeadersMonth[2]
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
