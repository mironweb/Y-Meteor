import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as funcs from '../../../../../../both/functions/common';
import * as pdf from '../../../../../../both/functions/borrowingBasePdf';
import { MeteorObservable } from "meteor-rxjs";
import * as moment from 'moment';
import { ActivatedRoute, Router, Params } from '@angular/router';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { AllCollections } from "../../../../../../both/collections/index";
import { merge } from 'rxjs';
import { EventEmitterService } from "../../../../services/index";
import { UserService } from "../../../../services/UserService";

@Component({
  selector: 'executive-borrowingBase',
  template: `
      <mat-card class='fullHeight'>
        <h2 style='margin-top: 0px; float: left;'>Borrowing Base</h2>
        <span class='cardIcons'>
          <i class="material-icons" *hasPermission="['generateExecReport']" (click)='overviewFunc()'>playlist_add</i>
        </span>
        <hr style='clear: both;'>
        <div>
          <span *ngIf="!loading">
            <div fxLayout="row" fxLayoutAlign="space-between stretch">
              <span fxFlex="90">
                <strong>Current Ratio</strong> = {{borrowingBaseTotals.currentAssets | customCurrency}} / {{borrowingBaseTotals.totalLiabilites
                | customCurrency}} = {{ borrowingBaseTotals.currentAssestsRatio | number}}
                <br>
                <strong>Debt to Equity</strong> = {{borrowingBaseTotals.totalLiabilites | customCurrency}} / {{borrowingBaseTotals.tangNetWorth
                | customCurrency}} = {{ borrowingBaseTotals.totalLiabilitesRatio | number}}
              </span>
              <span fxFlex="10">
                <i class="material-icons" style='float: right;' (click)="borrowingBaseReport(borrowingBaseTotals)">picture_as_pdf</i>
              </span>
            </div>
            <br>
            <div fxLayout="row" fxLayoutAlign="space-between stretch">
              <span fxFlex="90">
                <strong>Real Current Ratio</strong> = {{borrowingBaseTotalsReal.currentAssets | customCurrency}} / {{borrowingBaseTotalsReal.totalLiabilites
                | customCurrency}} = {{ borrowingBaseTotalsReal.currentAssestsRatio | number}}
                <br>
                <strong>Real Debt to Equity</strong> = {{borrowingBaseTotalsReal.totalLiabilites | customCurrency}} / {{borrowingBaseTotalsReal.tangNetWorth
                | customCurrency}} = {{ borrowingBaseTotalsReal.totalLiabilitesRatio | number}}
              </span>
              <span fxFlex="10">
                <i class="material-icons" style='float: right;' (click)="borrowingBaseReport(borrowingBaseTotalsReal)">picture_as_pdf</i>
              </span>
            </div>
          </span>
          <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
        </div>
        <br>
      </mat-card>
  `,
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutiveBorrowingBasePage implements OnInit {

  @Input() data: any;
  filterConditions: any;
  objLocal: any = {};
  borrowingBase: any = {};
  borrowingBaseData: any = {};
  borrowingBaseTotals: any = {};
  borrowingBaseTotalsReal: any = {};
  invoiceTotals90Days: any = {};
  inventory: any = {};
  loading: boolean = true;
  // detailedInfo = {
  //   'AR': [],
  //   'inventoryAsOf': [],
  //   '90Days': [],
  //   'lineOutstanding': [],
  //   'currentAssets': [],
  //   'currentLiabilities': [],
  //   'equity': [],
  //   'intangibleAssets': [],
  // };
  // rows: any;
  @Output() rows = new EventEmitter<any>();
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute) { pdfFonts.pdfMake }
  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();

    let query = {
      includeInBorrowingBase: true,
    }
    // const sub = MeteorObservable.subscribe('ledgerAccounts', query);
    // const autorun = MeteorObservable.autorun();
    // merge(sub, autorun).subscribe(() => {
    //   let result = AllCollections['ledgerAccounts'].collection.find().fetch();
    //   if (Object.keys(this.borrowingBaseTotals).length > 0 && Object.keys(this.inventory).length) {
    //     this.getBorrowingBaseAggregate()
    //     this.projectedFutureSales()
    //   }
    // })
    //borrowingBase
    this.getBorrowingBaseAggregate()
    this.projectedFutureSales()
  }

  ngOnInit() {
    this.borrowingBaseData.firstOfMonth = moment().startOf('month').format();
    this.borrowingBaseData.endOfMonth = moment().endOf('month').format();
    this.init();
  }

  calculateBalanceAddDebit(account) {
    const latestYearBalance = account.totals[account.totals.length - 1];
    const totalCreditAmounts = latestYearBalance.creditAmounts.reduce((a, b) => a.plus(b));
    const totalDebitAmounts = latestYearBalance.debitAmounts.reduce((a, b) => a.plus(b));
    const priorYearBalance = account.totals.length > 1 ? account.totals[account.totals.length - 2] : 0;
    const priortotalCreditAmounts = priorYearBalance ? priorYearBalance.creditAmounts.reduce((a, b) => a.plus(b)) : new Decimal(0);
    const priortotalDebitAmounts = priorYearBalance ? priorYearBalance.debitAmounts.reduce((a, b) => a.plus(b)) : new Decimal(0);

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

  async getBorrowingBaseAggregate() {
    let sub = MeteorObservable.call('find', 'ledgerAccounts', { includeInBorrowingBase: true }).subscribe((result:any) => {
      result.forEach((account) => {
        this.calculateBalanceAddDebit(account);
      });
      this.InvoiceTotal90Days();
      this.borrowingBaseTotals = this.getTotals(result, []);
      this.borrowingBaseTotalsReal = this.getTotals(result, ['2203-00']);
    });
  }

  async projectedFutureSales() {
    let lastYearMonthRange = {
      gte: new Date(this.borrowingBaseData.todayMonthLastYear),
      lte: new Date(this.borrowingBaseData.endOfMonthLastYear)
    }
    let projectedFutureSales = await funcs.projectedFutureSales(lastYearMonthRange);
    if (projectedFutureSales['result'][0] !== undefined) {
      this.inventory['projectedFutureSales'] = projectedFutureSales['result'][0].total;
    } else {
      this.inventory['projectedFutureSales'] = 0.00;
    }
  }

  InvoiceTotal90Days() {
    let query = [
      {
        "$match": {
          "$and": [
            {
              "dueDate": {
                "$lte": new Date(moment().subtract(90, 'days').endOf('day').format()),
              }
            },
            { 'type': { $ne: 'credit memo' } },
            {
              "balance": {
                "$ne": 0,
              }
            },
          ]
        }
      },
      {
        "$lookup": {
          "from": "customers",
          "let": {
            "customerId": "$customerId"
          },
          "pipeline": [
            {
              "$match": {
                "$expr": {
                  "$eq": [
                    "$$customerId",
                    "$_id"
                  ]
                }
              }
            },

          ],
          "as": "customer"
        }
      },
      { $unwind: '$customer' },
      {
        $addFields: {
          customer: '$customer.name'
        }
      },
      {
        $addFields: {
          freight: { $toDouble: "$freight" },
          freightCredit: { $toDouble: "$freightCredit" },
          discount: { $toDouble: "$discount" },
          balance: { $toDouble: "$balance" },
        },
      },
    ];
    let sub = MeteorObservable.call('aggregate', 'customerInvoices', query).subscribe(results => {
      let result = results['result']
      let balance = 0;
      let detailArr = []
      result.forEach((invoice) => {
        balance += invoice.balance
        detailArr.push({ number: invoice.number, description: invoice.customer, dueDate: invoice.dueDate, total: invoice.balance });
      });
      
      this.invoiceTotals90Days = {
        balance: balance,
        numberOfInvoices: result.length,
        detailArr
      }
    });
  }


  getTotals(totals, exclude?) {
    let borrowingBaseTotals = {
      totalAR: 0,
      totalInventory: 0,
      lastYearEndOfMonthTotal: 0,
      currentAssets: 0,
      totalLiabilites: 0,
      loanValueAccounts: 0,
      loanValueInventory: 0,
      totalLineOutstanding: 0,
      amountAvailable: 0,
      equity: 0,
      intangibleAsset: 0,
      tangNetWorth: 0,
      maxLoanAmmount: 0,
      revolvingLoan: 0,
      detailedInfo: {
        'AR': {arr: [], title: 'Total Accounts Receivable'},
        'inventoryAsOf': { arr: [], title: 'Inventory As Of ' + moment().format("MM/DD/YYYY")},
        '90Days': {arr: [], title: '90 Day Old Invoices'},
        'lineOutstanding': {arr: [], title: 'Total Line Outstanding'},
        'currentAssets': { arr: [], title: 'Current Assets'},
        'currentLiabilities': { arr: [], title: 'Current Liabilities'},
        'equity': { arr: [], title: 'Equity'},
        'intangibleAssets': { arr: [], title: 'Intangible Assets'},
      }
    }
    let account1000Balance = 0;

    for (var i = 0; i < totals.length; i++) {
      if (!exclude.includes(totals[i].number)) {
        let balance = totals[i].latestYearFinalBalance.toNumber();
        let priorYearbalance = totals[i].priorYearFinalBalance.toNumber();
        let priorYearEndOfMonthTotalBalance = totals[i].priorYearEndOfMonthTotalBalance.toNumber();
        // console.log(totals[i]);
        if (balance != 0){
          if (totals[i].totalAccountsReceivable) {
            borrowingBaseTotals['totalAR'] += balance;
            //add speciic accounts info
            borrowingBaseTotals.detailedInfo.AR.arr.push({ number: totals[i].number, description: totals[i].description, total: balance})
          }
          if (totals[i].eligibleInventory) {
            borrowingBaseTotals['totalInventory'] += balance;
            borrowingBaseTotals['lastYearEndOfMonthTotal'] += priorYearEndOfMonthTotalBalance;
            borrowingBaseTotals.detailedInfo.inventoryAsOf.arr.push({ number: totals[i].number, description: totals[i].description, total: balance})
          }
          if (totals[i].currentAsset && totals[i].number !== '1000-00') {
            borrowingBaseTotals['currentAssets'] += balance;
            borrowingBaseTotals.detailedInfo.currentAssets.arr.push({ number: totals[i].number, description: totals[i].description, total: balance})
          }
          if (totals[i].currentLiability) {
            borrowingBaseTotals['totalLiabilites'] += balance;
            borrowingBaseTotals.detailedInfo.currentLiabilities.arr.push({ number: totals[i].number, description: totals[i].description, total: balance})
          }
          if (totals[i].totalLineOutstanding) {
            borrowingBaseTotals['totalLineOutstanding'] += balance;
            borrowingBaseTotals.detailedInfo.lineOutstanding.arr.push({ number: totals[i].number, description: totals[i].description, total: balance})
          }
          if (totals[i].equity) {
            borrowingBaseTotals['equity'] += balance;
            borrowingBaseTotals.detailedInfo.equity.arr.push({ number: totals[i].number, description: totals[i].description, total: balance})
            if (totals[i].retainedEarningPriorYear) {
              borrowingBaseTotals['equity'] += priorYearbalance
            }
          }
          if (totals[i].intangibleAsset) {
            borrowingBaseTotals['intangibleAsset'] += balance;
            borrowingBaseTotals.detailedInfo.intangibleAssets.arr.push({ number: totals[i].number, description: totals[i].description, total: balance})
          }
          if (totals[i].number === '1000-00') {
            borrowingBaseTotals['totalLiabilites'] += balance;
            account1000Balance += balance
            borrowingBaseTotals.detailedInfo.currentLiabilities.arr.push({ number: totals[i].number, description: totals[i].description, total: balance })
          }
        }
      }
    }
    borrowingBaseTotals['totalLiabilites'] = Math.abs(borrowingBaseTotals['totalLiabilites']);
    borrowingBaseTotals['totalLineOutstanding'] = Math.abs(borrowingBaseTotals['totalLineOutstanding']) - account1000Balance;
    borrowingBaseTotals['equity'] = Math.abs(borrowingBaseTotals['equity']);
    borrowingBaseTotals['tangNetWorth'] = borrowingBaseTotals['equity'] - borrowingBaseTotals['intangibleAsset'];
    borrowingBaseTotals['loanValueAccounts'] = borrowingBaseTotals['totalAR'] * .8;
    borrowingBaseTotals['loanValueInventory'] = borrowingBaseTotals['totalInventory'] * .6;
    borrowingBaseTotals['currentAssestsRatio'] = (borrowingBaseTotals['currentAssets'] / borrowingBaseTotals['totalLiabilites']).toFixed(3);
    borrowingBaseTotals['totalLiabilitesRatio'] = (borrowingBaseTotals['totalLiabilites'] / borrowingBaseTotals['tangNetWorth']).toFixed(3);

    // let actualValue = borrowingBaseTotals['loanValueAccounts'] + borrowingBaseTotals['loanValueInventory'];
    // let maxValue = actualValue > Session.get('maxLoanValue') ? Session.get('maxLoanValue') : actualValue;
    let maxValue = Session.get('maxLoanValue');
    borrowingBaseTotals['maxLoanAmmount'] = maxValue;
    borrowingBaseTotals['amountAvailable'] = maxValue - borrowingBaseTotals['totalLineOutstanding'];
    this.loading = false;
    // console.log(borrowingBaseTotals.detailedInfo);
    
    return borrowingBaseTotals;
  }

  async overviewFunc() {
    EventEmitterService.Events.emit({
      "name": "overviewReport",
      "value": {
        "name": "borrowingBase",
        "title": 'Borrowing Base',
        "value": await this.returnData()
      }
    });
  }
  async returnData() {
    let table = {
      rows: [
        {
          label: 'Debt To Equity',
          amount: this.borrowingBaseTotalsReal.currentAssestsRatio
        },
        {
          label: 'Current Ratio',
          amount: this.borrowingBaseTotalsReal.totalLiabilitesRatio
        },
      ],
      columns: [
        {
          "prop": "label",
          "type": "string",
        },
        {
          "prop": "amount",
          "type": "dollar",
        },
      ]
    }
    return table;
  }

  borrowingBaseReport(totals) {
    totals['invoiceTotal90Day'] = this.invoiceTotals90Days.balance;
    totals.detailedInfo['90Days'].arr = this.invoiceTotals90Days.detailArr;
    totals['numberOf90DayInvoices'] = this.invoiceTotals90Days.numberOfInvoices;
    if (totals['invoiceTotal90Day'] > 0) {
      totals['eligibleReceivable'] = totals['totalAR'] - totals['invoiceTotal90Day']
    } else {
      totals['eligibleReceivable'] = totals['totalAR']
    }
    let pdfInfo = totals;
    let docDefinition = pdf.borrowingBaseReport(pdfInfo);

    if (/Edge\/\d./i.test(navigator.userAgent) || /MSIE 10/i.test(navigator.userAgent)) {
      pdfMake.createPdf(docDefinition).download('borrowingBase(' + moment().format("MM/DD/YYYY-h:mma") + ').pdf');
    } else {
      pdfMake.createPdf(docDefinition).open();
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
    this.rows.emit(rows);
  }

  select(event) {
    this.router.navigate(['customers/orders/' + event['_id']]);
    // window.location.href = 'https://app.yibas.com/orders/' + event._id;
  }
}
