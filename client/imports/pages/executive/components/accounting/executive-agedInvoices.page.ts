import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import * as funcs from '../../../../../../both/functions/common';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from "../../../../services/UserService";
import { PageResolver } from "../../../../resolvers/PageResolver";
import { EventEmitterService } from "../../../../services/index";
import { SystemLookup } from "../../../../../../both/models/systemLookup.model";
import { MeteorObservable } from "meteor-rxjs";

@Component({
    selector: 'executive-agedInvoices',
    template: `
    <mat-card class='fullHeight'>
      <h2 style='margin-top: 0px; float: left;'>Aged Invoices</h2>
      <span class='cardIcons'>
        <i class="material-icons" (click)="agedView = !agedView">repeat</i>
        <i class="material-icons" *hasPermission="['generateExecReport']" (click)='overviewFunc()'>playlist_add</i>
      </span>
      <mat-form-field *ngIf="!agedView" style='margin-top: 0px; float: right; width: 10%;'>
        <mat-select  [(value)]="topLimit" placeholder="Limit" (selectionChange)='topLimit = $event.value'>
          <span>
            <mat-option [value]="5">5</mat-option>
            <mat-option [value]="10">10</mat-option>
            <mat-option [value]="15">15</mat-option>
          </span>
        </mat-select>
      </mat-form-field>
      <span *ngIf='isDeveloper' style='margin-top: 0px; float: right;'>
        <mat-form-field class="example-full-width">
          <input matInput placeholder="CustomerID" [(ngModel)]="devCustomerId">
        </mat-form-field>
        <button mat-button (click)="reload()">Reload</button>
      </span>
      <hr style='clear: both;'>
        <table #tableId id='tables' *ngIf='!loading && agedView'>
          <tr>
            <th class="rowHead"></th>
            <th class="col">Net</th>
          </tr>
          <tr (click)='changeView(agedInvoiceRanges.current, "$currentDue")' class='pointer'>
            <th class="rowHead">Current</th>
            <td class="alignRight">{{agedInvoiceRangeTotals.current.total | customCurrency}}</td>
          </tr>
          <tr (click)='changeView(agedInvoiceRanges.range15, "$pastDue1")' class='pointer'>
            <th class="rowHead">15 Days</th>
            <td class="alignRight">{{agedInvoiceRangeTotals.range15.total | customCurrency}}</td>
          </tr>
          <tr (click)='changeView(agedInvoiceRanges.range30, "$pastDue2")' class='pointer'>
            <th class="rowHead">30 Days</th>
            <td class="alignRight">{{agedInvoiceRangeTotals.range30.total | customCurrency}}</td>
          </tr>
          <tr (click)='changeView(agedInvoiceRanges.range60, "$pastDue3")' class='pointer'>
            <th class="rowHead">60 Days</th>
            <td class="alignRight">{{agedInvoiceRangeTotals.range60.total | customCurrency}}</td>
          </tr>
          <tr (click)='changeView(agedInvoiceRanges.range90, "$pastDue4")' class='pointer'>
            <th class="rowHead">90 Days</th>
            <td class="alignRight">{{agedInvoiceRangeTotals.range90.total | customCurrency}}</td>
          </tr>
          <tr>
            <th class="rowHead">Total</th>
            <td class="alignRight" style="border-top: 2px solid;">{{totalCreditDebit(agedInvoiceRangeTotals, 'total') | customCurrency}}</td>
          </tr>
        </table>
        <table id='tables' *ngIf='!loading && !agedView'>
          <tr *ngFor="let row of topPastDueResults | slice:0:topLimit; let i=index">
            <th class="rowHead">{{row.customer}}</th>
            <td class="alignRight">{{row.sumTotal | customCurrency}}</td>
          </tr>
        </table>
        <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
    </mat-card>
  `,
    styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutiveAgedInvoices implements OnInit {

    @Input() data: any;
    @ViewChild('tableId') tableId;
    isDeveloper;
    agedView: boolean = true;
    devCustomerId:any;
    filterConditions: any;
    debitCreditObject = {debit: 0, credit: 0, total: 0};
    topPastDueResults = [];
    topLimit = 5;
    agedInvoiceRanges: any = {
      current: { start: -14 },
      range15: { start: -29, end: -15 },
      range30: {start: -59, end: -30},
      range60: {start: -89, end: -60},
      range90: {end: -90},
    };
    agedInvoiceRangeTotals: any = {
      current: this.debitCreditObject,
      range15: this.debitCreditObject,
      range30: this.debitCreditObject,
      range60: this.debitCreditObject,
      range90: this.debitCreditObject,
    };
    objLocal: any = {};
    loading: boolean = true;
    pdfLoading: boolean = false;
    @Output() rows = new EventEmitter<any>();
    @Output() lookupView = new EventEmitter<any>();

    constructor(
      private router: Router, 
      private activatedRoute: ActivatedRoute) {
    }

    async init() {
      // let result = await this.getAgedInvoivesTotals(this.agedInvoiceRanges);
      // this.agedInvoiceRangeTotals.current = this.getElement(result, 'current');
      // this.agedInvoiceRangeTotals.range15 = this.getElement(result, '15');
      // this.agedInvoiceRangeTotals.range30 = this.getElement(result, '30');
      // this.agedInvoiceRangeTotals.range60 = this.getElement(result, '60');
      // this.agedInvoiceRangeTotals.range90 = this.getElement(result, '90');
      // this.topPastDue();

      //Data From Customer Collection
      this.agedInvoicesAndTopCustomers()

      this.loading = false;
    }

    async agedInvoicesAndTopCustomers(){
      let pipeline = [
        {
          $project: {
            _id: 1,
            name: 1,
            currentDue: 1,
            pastDue1: 1,
            pastDue2: 1,
            pastDue3: 1,
            pastDue4: 1,
            pastDue3and4: { $add: ['$pastDue3', '$pastDue4'] }
          }
        },
        { $sort: { pastDue3and4: -1 } },
        {
          "$group": {
            "_id": "000",
            "currentDue": {
              "$sum": "$currentDue"
            },
            "pastDue1": {
              "$sum": "$pastDue1"
            },
            "pastDue2": {
              "$sum": "$pastDue2"
            },
            "pastDue3": {
              "$sum": "$pastDue3"
            },
            "pastDue4": {
              "$sum": "$pastDue4"
            },
            "topCustomers": {
              "$push": {
                customer: '$name',
                sumTotal: { $toDouble: '$pastDue3and4' }
              }
            }
          }
        },
        {
          $addFields: {
            "currentDue": { $toDouble: "$currentDue" },
            "pastDue1": { $toDouble: "$pastDue1" },
            "pastDue2": { $toDouble: "$pastDue2" },
            "pastDue3": { $toDouble: "$pastDue3" },
            "pastDue4": { $toDouble: "$pastDue4" },
            topCustomers: { $slice: ["$topCustomers", 15] }
          }
        }
      ];

      let agedInvoicesAndTopCustomers = await funcs.runAggregate('customers', pipeline);
      agedInvoicesAndTopCustomers = agedInvoicesAndTopCustomers['result'][0];
      
      this.agedInvoiceRangeTotals.current = { debit: 0, crdit: 0, total: agedInvoicesAndTopCustomers['currentDue'] };
      this.agedInvoiceRangeTotals.range15 = { debit: 0, crdit: 0, total: agedInvoicesAndTopCustomers['pastDue1'] };
      this.agedInvoiceRangeTotals.range30 = { debit: 0, crdit: 0, total: agedInvoicesAndTopCustomers['pastDue2'] };
      this.agedInvoiceRangeTotals.range60 = { debit: 0, crdit: 0, total: agedInvoicesAndTopCustomers['pastDue3'] };
      this.agedInvoiceRangeTotals.range90 = { debit: 0, crdit: 0, total: agedInvoicesAndTopCustomers['pastDue4'] };
      this.topPastDueResults = agedInvoicesAndTopCustomers['topCustomers'];
    }

    ngOnInit() {
      this.init();
      this.isDeveloper = PageResolver.isDeveloper;
    }

    async reload(){
      this.init();
    }

    async getAgedInvoivesTotals(range){
      let invoices = await funcs.agedInvoices(range, this.devCustomerId);
      return invoices['result'];
    }

    getElement(array, _id){
      let index = array.findIndex(obj => obj._id === _id);
      return array[index] ? array[index] : this.debitCreditObject;
    }

    totalCreditDebit(o, keyValue){
      let sum = 0 
      sum += Object.keys(o).reduce(function (previous, key) {
        return previous + o[key][keyValue];
      }, 0);
      return sum;
    }

    topPastDue() {
      SystemLookup._GetReferredLookup$(UserService.user, 'agedInvoices')
      .subscribe(lookup => {
        this.pastDueAggregate(lookup._id);
        // let id = lookup._id;
        // (lookup._id);
      })
      // console.log('agedInvoice')
    }

    async pastDueAggregate(id) {
      let beginningOfRange = function (date) { return moment().add(date, 'day').startOf('day').format() }
      let endOfRange = function (date) { return moment().add(date, 'day').endOf('day').format() };
      let sub = MeteorObservable.call('findOne', 'systemLookups', { _id: id }).subscribe(async(lookup) => {
        let method = lookup['methods'][0]
        let parsed = funcs.parseAll(lookup['methods'][0].args, this.objLocal);
        let date;
        if ('datePaths' in method.args[0]) {
          method.args[0].datePaths.forEach(datePath => {
            if (datePath.indexOf('$gte') !== -1) {
              date = moment('2017', 'YYYY').startOf('year').format();
            } else if (datePath.indexOf('$lte') !== -1 || datePath.indexOf('$lt') !== -1) {
              date = beginningOfRange(this.agedInvoiceRanges.range60.end)
            }
            funcs.setObjectValue(parsed[0], datePath, new Date(date));
          })
        }

        parsed = this.removeLimitAndSkipAndSort(parsed[0]);
        parsed = parsed.concat([{ '$sort': { sumTotal: -1 }}, {'$limit': 15}])
        // console.log(JSON.stringify(parsed))
        let res = await funcs.runAggregate('customerInvoices', parsed);
        // console.log(res)
        this.topPastDueResults = res['result'];
      });
    }

    removeLimitAndSkipAndSort(pipeline) {
      let removeValFromIndex = [];
      let arr = pipeline;
      arr.forEach((element, index, object) => {
        if ('$limit' in element || '$skip' in element || '$sort' in element) {
          removeValFromIndex.push(index)
        }
      });
      for (let i = removeValFromIndex.length - 1; i >= 0; i--) {
        arr.splice(removeValFromIndex[i], 1)
      }
      return arr;
    }

    async overviewFunc() {
      EventEmitterService.Events.emit({
        "name": "overviewReport",
        "value": {
            "name": "agedInvoice",
            "title": 'Aged Invoices',
            "value": await this.returnData()
        }
      });
      EventEmitterService.Events.emit({
        "name": "overviewReport",
        "value": {
            "name": "topPastDue",
            "title": 'Top Past Due By Amount',
            "value": await this.topCustomers()
        }
      });
      console.log('HIT AGED INVOICE')
    }


    async returnData() {
      let table = {
        rows: [
          {
            label: 'Current',
            amount: this.agedInvoiceRangeTotals.current.total
          },
          {
            label: '15 Days',
            amount: this.agedInvoiceRangeTotals.range15.total
          },
          {
            label: '30 Days',
            amount: this.agedInvoiceRangeTotals.range30.total
          },
          {
            label: '60 Days',
            amount: this.agedInvoiceRangeTotals.range60.total
          },
          {
            label: '90 Days',
            amount: this.agedInvoiceRangeTotals.range90.total
          },
          {
            label: 'Total',
            amount: this.totalCreditDebit(this.agedInvoiceRangeTotals, 'total')
          },
        ],
        columns : [
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

    async topCustomers() {
      let value = this.topPastDueResults;
      let rows = [];
      for (let index = 0; index < this.topLimit; index++) {
        const el = value[index];
        let obj = {
          label: `${el.customer}`,
          amount: el.sumTotal
        }
        rows.push(obj)
      }
      let table = {
        rows: rows,
        columns : [
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

    // changeView(range) {
    //   let beginningOfRange = moment().add(range.start, 'day').startOf('day').format();
    //   let endOfRange = moment().add(range.end, 'day').startOf('day').format();
    //   let lookupData = {};
    //   lookupData = Object.assign({
    //     view: 'agedInvoices',
    //     start: beginningOfRange,
    //     end: endOfRange
    //   }, lookupData);
    //   this.lookupView.emit(lookupData);
    // }

    changeView(range, bucket) {
      let beginningOfRange = moment().add(range.start, 'day').startOf('day').format();
      let endOfRange = moment().add(range.end, 'day').startOf('day').format();
      let lookupData = {};
      lookupData = Object.assign({
        view: 'agedInvoices',
        start: beginningOfRange,
        end: endOfRange,
        bucket: bucket
      }, lookupData);
      this.lookupView.emit(lookupData);
    }
}
