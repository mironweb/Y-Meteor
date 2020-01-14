import { Component, OnInit, Input, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';
import * as funcs from '../../../../../../both/functions/common';
import * as pdfFuncs from '../../../../../../both/functions/lookupPdf';
import { FormControl } from '@angular/forms';
import { MeteorObservable } from "meteor-rxjs";
import * as moment from 'moment';
import {ActivatedRoute, Router} from '@angular/router';
import { merge, Subscription } from 'rxjs';
import * as pdfMake from 'pdfmake/build/pdfmake';
import { UserService } from "../../../../services/UserService";
import { AllCollections } from "../../../../../../both/collections/index";
import { pipeline } from 'stream';

@Component({
  selector: 'executive-inventory',
  template: `
    <mat-card class='fullHeight'>
      <h2 style='margin-top: 0px; float: left;'>Inventory Valuation</h2>
      <span class='cardIcons'>
        <i class="material-icons" (click)="changeView('inventory')">exit_to_app</i>
        <i class="material-icons" *ngIf='viewChart' (click)="toggleChart()">table_chart</i>
        <i class="material-icons" *ngIf='!viewChart' (click)="toggleChart()">show_chart</i>
      </span>
      <span id='dashboardHeaderElement' *ngIf='viewChart'>
        <mat-form-field style='margin-top: 0px; padding: 0px 10px 0px 0px; float: right; width: 30%;'>
            <mat-select #productLineInput placeholder="Product Line" (selectionChange)='onChange($event.value, "productLine")'
              [(value)]="selectedCategories" [disabled]="notOnlyRevenue" multiple>
              <mat-select-trigger>
                {{
                  selectedCategories.length > 0 ? 
                   ((findElement(selectedCategories[0], '_id', categories).name.length>15)? (findElement(selectedCategories[0], '_id', categories).name | slice:0:15)+'..':(findElement(selectedCategories[0], '_id', categories).name))
                   : ''
                }}
                <span *ngIf="selectedCategories?.length > 1" class="example-additional-selection">
                  (+{{selectedCategories.length - 1}} {{selectedCategories?.length === 2 ? 'other' : 'others'}})
                </span>
              </mat-select-trigger>
              <span (mouseleave)="closeInput($event, 'productLineInput')">
                <button style='width: 100%' mat-raised-button class="mat-primary fill text-sm"
                (click)='onChange(categories.length > selectedCategories.length ? arrayFromArrOfObj(categories, "_id") : [], "productLine")'>
                  {{categories.length > selectedCategories.length ? 'Select All' : 'Deselect All'}}
                </button>
                <mat-option *ngFor="let category of categories" [value]="category._id">{{category.name}}</mat-option>
              </span>
            </mat-select>
        </mat-form-field>
      </span>
      <hr style='clear: both;'>
        <div style="overflow-x:auto;" *ngIf="!loading.borrowingBase && !loading.projectedFutureSales && !loading.chartLoading">
          <table id='tables' *ngIf='!viewChart'>
            <tr>
              <th class="rowHead"></th>
              <th class="col">End of Month</th>
              <th class="col">End of Year</th>
            </tr>
            <tr>
              <th class="rowHead">Current Value</th>
                <td style='text-align: center;' colspan="2">{{borrowingBaseTotals.totalInventory | customCurrency}}</td>
            </tr>
            <tr>
              <th class="rowHead">Last Year</th>
                <td class='alignRight'>{{borrowingBaseTotals.lastYearEndOfMonthTotal | customCurrency}}</td>
                <td class='alignRight'>{{borrowingBaseTotals.priorYearbalance | customCurrency}}</td>
            </tr>
            <tr>
              <th class="rowHead">Projected Future Sales</th>
                <td class='alignRight'>{{inventory.projectedFutureSales | customCurrency}}</td>
                <td class='alignRight'>{{inventory.projectedFutureSalesEndOfYear | customCurrency}}</td>
            </tr>
            <tr>
              <th class="rowHead">Projected Value</th>
                <td class='alignRight'>{{borrowingBaseTotals.totalInventory - inventory.projectedFutureSales | customCurrency}}</td>
                <td class='alignRight'>{{borrowingBaseTotals.totalInventory - inventory.projectedFutureSalesEndOfYear | customCurrency}}</td>
            </tr>
          </table>
          <br>
            <div fxLayout="row" fxLayout.xs="column" fxLayout.sm="column" *ngIf='viewChart'>
              <div class="chart-container" fxFlex="100" fxLayout="column" fxLayoutAlign="space-around">
                <span *ngIf="!loading.chartLoading" style="margin: 0; height: 45vh; width: 100%;">
                  <canvas baseChart width="400" height="400" [datasets]="lineChartData" [labels]="lineChartLabels" [options]="lineChartOptions"
                    [colors]="chartColors" [legend]="lineChartLegend" [chartType]="lineChartType" (chartHover)="chartHovered($event)"
                    (chartClick)="chartClicked($event)">
                  </canvas>
                </span>
              </div>
            </div>
          </div>
          <mat-spinner *ngIf="loading.borrowingBase || loading.projectedFutureSales || loading.chartLoading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
    </mat-card>
  `,
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutiveInventoryPage implements OnInit, OnDestroy{
  @ViewChild('productLineInput') productLineInput;
  @Input() data: any;
  today: any;
  filterConditions: any;
  objLocal: any = {};
  inventoryData: any = {};
  openOrdersReport: any = {};
  openOrdersTotals: any = {};
  loading: any = {
    borrowingBase: true,
    projectedFutureSales: true,
    chartLoading: true,
  };
  tableRows = [];
  borrowingBaseTotals: any = {};
  inventory: any = {};
  lineChartData: Array<any> = [
    { data: [], label: '' }
  ];
  lineChartLabels: Array<any> = [];
  lineChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 10
      }
    },
    elements: {
      line: {
        tension: 0
      }
    },
    tooltips: {
      callbacks: {
        label: function (tooltipItem, data) {
          tooltipItem.yLabel = (Math.round(tooltipItem.yLabel * 100) / 100).toFixed(2);
          return '$' + tooltipItem.yLabel.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
      }
    },
    scales: {
      yAxes: [{
        ticks: {
          callback: function (value, index, values) {
            let base = Math.floor(Math.log(Math.abs(value)) / Math.log(1000));
            let suffix = 'kmb'[base - 1];
            return suffix ? String(value / Math.pow(1000, base)).substring(0, 3) + suffix : value;
          }
        }
      }]
    }
  };
  chartColors = [
    { // orange
      backgroundColor: 'rgba(255, 131, 0,0.2)',
      borderColor: 'rgba(255, 131, 0,1)',
      pointBackgroundColor: 'rgba(255, 131, 0,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(255, 131, 0,1)'
    }
  ]
  lineChartLegend: boolean = false;
  lineChartType: string = 'line';
  inventoryChart: any = {};
  inventoryChartData: any;
  monthOrder: Array<any> = [];
  month = moment().month() + 1;
  categories: Array<any> = [];
  selectedCategories: Array<any> = [];
  viewChart: boolean = false;
  // rows: any;
  @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();
  mergeSub: Subscription;
  borrowingBaseSub: Subscription;

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private userService: UserService) {}
  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();

    let query = {
      eligibleInventory: true,
    }
    const sub = MeteorObservable.subscribe('ledgerAccounts', query);
    const autorun = MeteorObservable.autorun();
    this.mergeSub = merge(sub, autorun).subscribe(() => {
      let result = AllCollections['ledgerAccounts'].collection.find().fetch();
      if (Object.keys(this.borrowingBaseTotals).length > 0 && Object.keys(this.inventory).length) {
        this.getBorrowingBaseAggregate()
        this.projectedFutureSales()
      }
    })
    await this.getProductLines();
    this.selectedCategories = this.categories.map(a => a._id);
    this.chartFunctions();
  }

  ngOnInit() {
    this.today = new FormControl(new Date(this.inventoryData.beginningOfDay))
    this.inventoryData.todayMonthLastYear = moment(this.today).utc().startOf('day').subtract(1, 'years').format();
    this.inventoryData.endOfMonthLastYear = moment(this.today).utc().endOf('month').subtract(1, 'years').format();
    this.inventoryData.endOfLastYear = moment().utc().endOf('year').subtract(1, 'years').format();
    this.inventoryData.yearNumber = new Date().getFullYear();
    this.inventoryData.priorYearNumber = new Date().getFullYear() - 1;
    this.inventoryData.monthNumber = new Date().getMonth() + 1;
    this.init();
    this.getBorrowingBaseAggregate();
    this.projectedFutureSales();
    this.monthOrder = this.getMonthsOrder(this.month);
    this.getMonthLabels();
  }

  async getBorrowingBaseAggregate() {
    this.borrowingBaseSub = MeteorObservable.call('find', 'ledgerAccounts', {includeInBorrowingBase: true }).subscribe((result:any) => {
      result.forEach((account) => {
        this.calculateBalanceAddDebit(account);
      });
      this.borrowingBaseTotals = this.getTotals(result);
    });
    this.loading.borrowingBase = false;
  }

  calculateBalanceAddDebit(account) {
    const latestYearBalance = account.totals[account.totals.length - 1];
    const totalCreditAmounts = latestYearBalance.creditAmounts.reduce((a, b) => a.plus(b));
    const totalDebitAmounts = latestYearBalance.debitAmounts.reduce((a, b) => a.plus(b));
    const priorYearBalance = account.totals.length > 1 ? account.totals[account.totals.length - 2] : 0;
    const priortotalCreditAmounts = priorYearBalance ? priorYearBalance.creditAmounts.reduce((a, b) => a.plus(b)) : new Decimal(0);
    const priortotalDebitAmounts = priorYearBalance ? priorYearBalance.creditAmounts.reduce((a, b) => a.plus(b)) : new Decimal(0);

    const priorYearEndOfMonthCreditAmounts = priorYearBalance ? priorYearBalance.creditAmounts.splice(0, new Date().getMonth() + 1).reduce((a, b) => a.plus(b)) : new Decimal(0);
    const priorYearEndOfMonthDebitAmounts = priorYearBalance ? priorYearBalance.debitAmounts.splice(0, new Date().getMonth() + 1).reduce((a, b) => a.plus(b)) : new Decimal(0);

    account.latestYearFinalBalance = latestYearBalance.beginningBalance.minus(totalCreditAmounts).plus(totalDebitAmounts);
    if (priorYearBalance) {
      account.priorYearFinalBalance = priorYearBalance.beginningBalance.minus(priortotalCreditAmounts).plus(priortotalDebitAmounts);
      account.priorYearEndOfMonthTotalBalance = priorYearBalance.beginningBalance.minus(priorYearEndOfMonthCreditAmounts).plus(priorYearEndOfMonthDebitAmounts);
    } else {
      account.priorYearFinalBalance = new Decimal(0);
      account.priorYearEndOfMonthTotalBalance = new Decimal(0);
    }
  }

  toggleChart(){
    this.viewChart = !this.viewChart;
  }

  getTotals(totals) {
    let borrowingBaseTotals = {
      totalInventory: new Decimal(0),
      priorYearbalance: new Decimal(0),
      lastYearEndOfMonthTotal: new Decimal(0),
    }

    for (var i = 0; i < totals.length; i++) {
      let balance = totals[i].latestYearFinalBalance;
      let priorYearbalance = totals[i].priorYearFinalBalance;
      let priorYearEndOfMonthTotalBalance = totals[i].priorYearEndOfMonthTotalBalance;

      if (totals[i].eligibleInventory) {
        borrowingBaseTotals['totalInventory'] = borrowingBaseTotals['totalInventory'].plus(balance);
        borrowingBaseTotals['priorYearbalance'] = borrowingBaseTotals['priorYearbalance'].plus(priorYearbalance);
        borrowingBaseTotals['lastYearEndOfMonthTotal'] = borrowingBaseTotals['lastYearEndOfMonthTotal'].plus(priorYearEndOfMonthTotalBalance);
      }
    }

    borrowingBaseTotals['loanValueInventory'] = borrowingBaseTotals['totalInventory'].times(0.6);
    // convert decimals to numbers
    return {
      totalInventory: borrowingBaseTotals['totalInventory'].toNumber(),
      priorYearbalance: borrowingBaseTotals['priorYearbalance'].toNumber(),
      lastYearEndOfMonthTotal: borrowingBaseTotals['lastYearEndOfMonthTotal'].toNumber(),
      loanValueInventory: borrowingBaseTotals['loanValueInventory'].toNumber(),
    };
  }

  async projectedFutureSales() {
    let lastYearMonthRange = {
      gte: new Date(this.inventoryData.todayMonthLastYear),
      lte: new Date(this.inventoryData.endOfMonthLastYear)
    }
    let projectedFutureSales = await funcs.projectedFutureSales(lastYearMonthRange);
    if (projectedFutureSales['result'][0] !== undefined) {
      this.inventory['projectedFutureSales'] = projectedFutureSales['result'][0].total;
    } else {
      this.inventory['projectedFutureSales'] = 0.00;
    }

    let lastYearMonthRangeEndOfYear = {
      gte: new Date(this.inventoryData.todayMonthLastYear),
      lte: new Date(this.inventoryData.endOfLastYear)
    }
    let projectedFutureSalesEndOfYear = await funcs.projectedFutureSales(lastYearMonthRangeEndOfYear);
    if (projectedFutureSalesEndOfYear['result'][0] !== undefined) {
      this.inventory['projectedFutureSalesEndOfYear'] = projectedFutureSalesEndOfYear['result'][0].total;
    } else {
      this.inventory['projectedFutureSalesEndOfYear'] = 0.00;
    }
    this.loading.projectedFutureSales = false;
  }

  changeView(lookup) {
    let lookupData = this.inventoryData
    lookupData = Object.assign({
      view: 'inventory',
      secondLookup: 'selectedLedgerAccount',
      pageHeader: 'Inventory Valuation',
    }, lookupData);
    this.lookupView.emit(lookupData);
  }    

  async chartFunctions(){
    this.loading.chartLoading = true;
    this.lineChartData = [];
    let dataArr = [];
    let openPurchases = await this.openPurchases();
    let projections = await this.projectedMonthly();
    let yearTotal = await this.currentYearTotals();
    const yearTotalControl = yearTotal;
    this.monthOrder.map(x => dataArr.push(yearTotal = yearTotal + openPurchases[x] - projections[x]))
    dataArr.unshift(yearTotalControl);
    dataArr.pop();
    this.lineChartData.push({ data: dataArr })
    this.loading.chartLoading = false;
  }

  async runAggregate(collection, pipeline){
    return funcs.runAggregate(collection, pipeline)
  }

  getMonthLabels(){
    this.monthOrder.map(month => this.lineChartLabels.push(this.formatMonthName(month)))
  }

  formatMonthName(month) {
    return moment(month, 'M').startOf('month').format('MMM')
  }

  findElement(value, key, arr) {
    let index = arr.findIndex((obj => obj[key] === value));
    return arr[index];
  }

  async currentYearTotals(){
    let pipeline = [
      {
        "$match": {
          "number": {
            "$gte": "1600-00",
            "$lte": "1699-00"
          },
          "status": "active"
        }
      },
      {
        "$project": {
          "_id": 1,
          "number": 1,
          "description": 1,
          "totals": 1
        }
      },
      {
        "$lookup": {
          "from": "categories",
          "localField": "_id",
          "foreignField": "inventoryLedgerAccountId",
          "as": "categoryId"
        }
      },
      {
        "$unwind": {
          "path": "$categoryId"
        }
      },
      { $addFields: { categoryId: '$categoryId._id' } },
      {
        "$match": {
          "$expr": {
            "$in": [
              "$categoryId",
              this.selectedCategories
            ]
          }
        }
      },
      {
        "$unwind": "$totals"
      },
      {
        "$project": {
          "_id": 1,
          "number": 1,
          categoryId: 1,
          "description": 1,
          "year": "$totals.year",
          "beginningBalance": "$totals.beginningBalance",
          "debitAmounts": {
            "$slice": [
              "$totals.debitAmounts",
              0,
              this.inventoryData.monthNumber
            ]
          },
          "creditAmounts": {
            "$slice": [
              "$totals.creditAmounts",
              0,
              this.inventoryData.monthNumber
            ]
          }
        }
      },
      {
        "$match": {
          "year": {
            "$in": [
              this.inventoryData.yearNumber
            ]
          }
        }
      },
      {
        "$project": {
          "_id": 1,
          "number": 1,
          categoryId: 1,
          "description": 1,
          "year": 1,
          "beginningBalance": 1,
          "debitAmounts": {
            "$reduce": {
              "input": "$debitAmounts",
              "initialValue": 0,
              "in": {
                "$add": [
                  "$$value",
                  "$$this"
                ]
              }
            }
          },
          "creditAmounts": {
            "$reduce": {
              "input": "$creditAmounts",
              "initialValue": 0,
              "in": {
                "$add": [
                  "$$value",
                  "$$this"
                ]
              }
            }
          }
        }
      },
      {
        "$project": {
          "_id": 1,
          "number": 1,
          categoryId: 1,
          "description": 1,
          "balance": {
            "$add": [
              {
                "$subtract": [
                  "$beginningBalance",
                  "$creditAmounts"
                ]
              },
              "$debitAmounts"
            ]
          }
        }
      },
      {
        "$group": {
          "_id": "$_id",
          "number": {
            "$first": "$number"
          },
          "categoryId": {
            "$first": "$categoryId"
          },
          "description": {
            "$first": "$description"
          },
          "yearBalances": {
            "$push": {
              "year": "$year",
              "balance": "$balance"
            }
          }
        }
      },
      {
        "$project": {
          "_id": 1,
          "number": 1,
          categoryId: 1,
          "description": 1,
          "currentYear": {
            "$arrayElemAt": [
              "$yearBalances",
              0
            ]
          },
        }
      },
      {
        "$project": {
          "_id": 1,
          categoryId: 1,
          "number": 1,
          "description": 1,
          "currentYear": "$currentYear.balance"
        }
      },
      {
        $group: {
          _id: '000',
          total: { $sum: '$currentYear'}
        }
      },
      {
        $addFields: {
          total: { $toDouble: "$total" },
        },
      },
    ]
    let result: any = await funcs.runAggregate('ledgerAccounts', pipeline);
    result = result['result'][0];
    let total = result ? result.total : 0;
    return total;
  }

  async projectedMonthly(){
    let pipeline = [
      {
        "$match": {
          "date": {
            "$gte": new Date(this.inventoryData.todayMonthLastYear),
            "$lte": new Date(this.inventoryData.endOfLastYear)
          }
        }
      },
      {
        "$project": {
          "_id": 1,
          "number": 1,
          'month': { $month: '$date' },
          'year': { $year: '$date' },
          "lineItems": 1
        }
      },
      {
        "$unwind": "$lineItems"
      },
      {
        "$project": {
          "_id": 1,
          "number": 1,
          'month': 1,
          'year': 1,
          "categoryId": "$lineItems.categoryId",
          "total": "$lineItems.total"
        }
      },
      {
        "$match": {
          "$expr": {
            "$in": [
              "$categoryId",
              this.selectedCategories
            ]
          }
        }
      },
      {
        "$group": {
          "_id": "$month",
          "total": {
            "$sum": "$total"
          }
        }
      },
      {
        $addFields: {
          total: { $toDouble: "$total" },
        },
      },
    ]
      
    let result: any = await funcs.runAggregate('customerInvoices', pipeline);
    result = result['result'];
    
    let monthTotalObj = {};
    this.monthOrder.map(el => { monthTotalObj[el] = 0 })
    result.map(res => monthTotalObj[res._id] = res.total);
    return monthTotalObj;
  }

  async openPurchases(){
    let pipeline = [
      {
        "$match": {
          "status": "open"
        }
      },
      {
        "$project": {
          "_id": 1,
          "lineItems": 1,
        }
      },
      {
        "$unwind": "$lineItems"
      },
      {
        "$match": {
          "$expr": {
            "$in": [
              "$lineItems.categoryId",
              this.selectedCategories
            ]
          }
        }
      },
      {
        "$match": {
          "lineItems.status": {
            "$in": [
              "open"
            ]
          }
        }
      },
      {
        "$project": {
          "_id": "$lineItems.categoryId",
          "total": "$lineItems.total",
          "month": { "$month": "$lineItems.requiredDate" },
          "year": { "$year": "$lineItems.requiredDate" },
        }
      },
      {
        '$group': {
          '_id': '$month',
          'total': { '$sum': '$total' }
        }
      },
      {
        $addFields: {
          total: { $toDouble: "$total" },
        },
      },
    ]
    
    let result: any = await funcs.runAggregate('vendorOrders', pipeline);
    result = result['result'];
    let monthTotalObj = {};
    this.monthOrder.map(el => { monthTotalObj[el] = 0 })
    result.map(res => monthTotalObj[res._id] = res.total);
    return monthTotalObj;
  }

  getMonthsOrder(startMonthNumber){
    let order = [];
    for (let index = 0; index <= 12; index++) {
      startMonthNumber <= 12 ? order.push(startMonthNumber) : startMonthNumber = 0;
      startMonthNumber++
    }
    return order;
  }

  async getProductLines() {
    let pipeline = [
      {
        "$match": {
          "category": {
            "$in": [
              "Revenue"
            ]
          }
        }
      },
      {
        "$project": {
          "_id": 1,
          "number": 1,
          "description": 1,
          "category": 1
        }
      },
      {
        "$lookup": {
          "from": "categories",
          "let": {
            "ledgerId": "$_id"
          },
          "pipeline": [
            {
              "$match": {
                "$expr": {
                  "$eq": [
                    "$$ledgerId",
                    "$salesAccountId"
                  ]
                }
              }
            },
            {
              "$sort": {
                "name": 1
              }
            },
            {
              "$match": {
                "description": {
                  "$gt": ""
                }
              }
            },
            {
              "$group": {
                "_id": "$salesAccountId",
                'categoryId': { '$first': '$_id' },
                "number": {
                  "$first": {
                    "$concat": [
                      "$name",
                      " - ",
                      "$description"
                    ]
                  }
                }
              }
            }
          ],
          "as": "category"
        }
      },
      {
        "$unwind": "$category"
      },
      {
        "$project": {
          "_id": '$category.categoryId',
          "name": "$category.number",
          "ledgerId": "$_id"
        }
      },
      {
        "$sort": {
          "name": 1
        }
      }
    ];

    let categories = await funcs.runAggregate('ledgerAccounts', pipeline);
    this.categories = categories['result'];
  }

  onChange(event, selectName) {
    switch (selectName) {
      case 'productLine':
        this.selectedCategories = event;
        break;
      default:
    }
    this.chartFunctions();
  }

  arrayFromArrOfObj(arrOfObj, key) {
    let arr = [];
    for (var i = 0; i < arrOfObj.length; i++) {
      let element = arrOfObj[i];
      arr.push(element[key])
    }
    return arr;
  }

  closeInput(event, name) {
    this[name].close();
  }

  pdf(report) {
    let pdfInfo = this.openOrdersReport;
    let docDefinition: any = pdfFuncs.reportPdf(pdfInfo, [], []);
    pdfMake.createPdf(docDefinition).open();
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
    this.rows.emit(rows);
  }

  select(event) {
    this.router.navigate(['customers/orders/' + event['_id']]);
    // window.location.href = 'https://app.yibas.com/orders/' + event._id;
  }

  ngOnDestroy(){
    this.mergeSub.unsubscribe();
    if(this.borrowingBaseSub != null){
        this.borrowingBaseSub.unsubscribe();
    }
  }
}
