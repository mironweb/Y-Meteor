import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { parseAll, getReferredLookupId, runAggregate, setObjectValue } from '../../../../../../both/functions/common';
import { MeteorObservable } from "meteor-rxjs";
import { FormControl } from '@angular/forms';
import * as moment from 'moment';
import * as pdfFuncs from '../../../../../../both/functions/lookupPdf';
import * as pdfMake from 'pdfmake/build/pdfmake';
import { ActivatedRoute, Router } from '@angular/router';
import {UserService} from "../../../../services/UserService";
import { AllCollections } from "../../../../../../both/collections/index";
import { merge } from 'rxjs';
import { EventEmitterService } from "../../../../services/index";

@Component({
  selector: 'executive-freightreport',
  template: `
      <mat-card class='fullHeight'>
        <h2 style='margin-top: 0px; float: left;'>Freight Report Totals</h2>
        <span class='cardIcons'>
          <i class="material-icons" (click)="changeView('freightReport')">exit_to_app</i>
          <i class="material-icons" (click)="pdf('freightReport')">picture_as_pdf</i>
          <i class="material-icons" *hasPermission="['generateExecReport']" (click)='overviewFunc()'>playlist_add</i>
        </span>
        <hr style='clear: both;'>
        <div>
          <mat-form-field style='float: left; width: 49%;'>
            <input matInput [matDatepicker]="startPicker" [max]="date.endOfDay.value" (dateChange)="changeDay('start', $event)" [value]="date.startOfDay.value" placeholder="Start Date">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field style='float: right; width: 49%;'>
            <input matInput [matDatepicker]="endPicker" [min]="date.startOfDay.value" (dateChange)="changeDay('end', $event)" [value]="date.endOfDay.value" placeholder="End Date">
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
          <br>
          <div style="overflow-x:auto; clear: both;">
            <table id='tables' *ngIf="!loading">
              <tr>
                <th class="rowHead">Invoice Total</th>
                <td class="alignRight">{{freightReportTotals.invoiceTotal | customCurrency}}</td>
              </tr>
              <tr>
                <th class="rowHead">COGS</th>
                <td class="alignRight">{{freightReportTotals.cogs | customCurrency}}</td>
              </tr>
              <tr>
                <th class="rowHead">Gross Profit</th>
                <td class="alignRight">{{freightReportTotals.grossProfit | customCurrency}}</td>
              </tr>
              <tr>
                <th class="rowHead">Gross Profit %</th>
                <td class="alignRight">{{freightReportTotals.grossProfitPercentage | number : '1.2-2'}}%</td>
              </tr>
              <tr>
                <th class="rowHead">Freight Cost</th>
                <td class="alignRight">{{freightReportTotals.freightCost | customCurrency}}</td>
              </tr>
              <tr>
                <th class="rowHead">Freight %</th>
                <td class="alignRight">{{freightReportTotals.freightCostPercentage | number : '1.2-2'}}%</td>
              </tr>
              <tr>
                <th class="rowHead">Net Profit</th>
                <td class="alignRight">{{freightReportTotals.netProfit | customCurrency}}</td>
              </tr>
              <tr>
                <th class="rowHead">Net Profit %</th>
                <td class="alignRight">{{freightReportTotals.netProfitPercentage | number : '1.2-2'}}%</td>
              </tr>
            </table>
            <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
          </div>
        </div>
      </mat-card>
  `,
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutiveFreightreportPage implements OnInit{

  @Input() data: any;
  today: any;
  date: any = {};
  freightData: any = {};
  filterConditions: any;
  objLocal: any = {};
  freightReport: any = {};
  freightReportTotals: any = {};
  loading: boolean = true;
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private route: ActivatedRoute, private userService: UserService) {}

  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
    this.freightData.beginningOfDay = moment(this.today).startOf('day').format();
    this.freightData.endOfDay = moment(this.today).endOf('day').format()
    // this.freightData.beginningOfDay = moment(this.today).startOf('day').format();
    // this.freightData.endOfDay = moment(this.today).endOf('day').format()
    this.today = new FormControl(new Date(this.freightData.beginningOfDay))
    this.date.startOfDay = new FormControl(new Date(this.freightData.beginningOfDay))
    this.date.endOfDay = new FormControl(new Date(this.freightData.endOfDay))

    let query = {
      type: 'standard', 
      date: {
        $gte: new Date(this.freightData.beginningOfDay),
        $lte: new Date(this.freightData.endOfDay)
      }
    }
    let id = await getReferredLookupId(this.userService.user, 'freightReport');
    this.getFreightReportAggregate(id)
    let sub = MeteorObservable.subscribe('customerInvoices', query);
    const autorun = MeteorObservable.autorun();

    merge(sub, autorun).subscribe(() => {
      let result = AllCollections['customerInvoices'].collection.find().fetch();
      if (this.freightReport['totals']) {
        this.getFreightReportAggregate(id)
      }
    })

  }

  ngOnInit() {

    this.init();
  }

  changeView(lookup) {
    let lookupData = this.freightData;
    lookupData = Object.assign({
      view: 'freightReport',
      // lookup: 'freightReport',

    }, lookupData);
    this.lookupView.emit(lookupData);
  } 

  async getFreightReportAggregate(id) {
    let sub = MeteorObservable.call('findOne', 'systemLookups', { _id: id }).subscribe(lookup => {
      this.freightReport['lookup'] = lookup;
      let method = lookup['methods'][0]
      let parsed = parseAll(lookup['methods'][0].args, this.objLocal);
      let totalLogic = parseAll(lookup['totalLogic'], this.objLocal);
      let date;
      if ('datePaths' in method.args[0]) {
        method.args[0].datePaths.forEach(datePath => {
          if (datePath.indexOf('$gte') !== -1) {
            date = this.freightData.beginningOfDay
          } else if (datePath.indexOf('$lte') !== -1) {
            date = this.freightData.endOfDay
          }
          setObjectValue(parsed[0], datePath, new Date(date));
        })
      }
      // we remove the last pipeline part ($addFields: { ...$toDouble })
      // so we can do the computations using NumberDecimal type
      let totalAggragate = parsed[0].filter(i => !i.$addFields).concat(totalLogic[0])
      this.getFreightReport('customerInvoices', parsed[0], totalAggragate)
    });
  }

  async getFreightReport(collection, pipeline, totalAggragate) {
    let result = await runAggregate(collection, pipeline);
    this.freightReport['result'] = result['result'];

    let freightReportTotals = {
      invoiceTotal: 0,
      cogs: 0,
      grossProfit: 0,
      grossProfitPercentage: 0,
      freightCost: 0,
      freightCostPercentage: 0,
      netProfit: 0,
      netProfitPercentage: 0,
    }

    let totalResults = await runAggregate(collection, totalAggragate);
    if (totalResults['result'].length > 0) {
      freightReportTotals = totalResults['result'][0];
    }

    this.freightReportTotals = freightReportTotals;
    this.freightReport['totals'] = freightReportTotals;
    this.loading = false;
  }

  async changeDay(input, event) {
    this.loading = true;
    switch (input) {
      case 'start':
      this.freightData.beginningOfDay = moment(event.value).startOf('day').format()
      // this.freightData.beginningOfDay = moment(event.value).startOf('day').format()
        break;
      case 'end':
      this.freightData.endOfDay = moment(event.value).endOf('day').format()
      // this.freightData.endOfDay = moment(event.value).endOf('day').format()
        break;
      default:
    }

    this.date.startOfDay = new FormControl(new Date(this.freightData.beginningOfDay))
    this.date.endOfDay = new FormControl(new Date(this.freightData.endOfDay))

    let id = await getReferredLookupId(this.userService.user, 'freightReport');
    this.getFreightReportAggregate(id)
  }

  async overviewFunc() {
    EventEmitterService.Events.emit({
      "name": "overviewReport",
      "value": {
        "name": "freightReport",
        "title": 'Freight Report',
        "value": await this.returnData()
      }
    });
  }
  async returnData() {
    let table = {
      rows: [
        {
          label: 'Invoice Total',
          amount: this.freightReportTotals.invoiceTotal
        },
        {
          label: 'COGS',
          amount: this.freightReportTotals.cogs
        },
        {
          label: 'Gross Profit',
          amount: this.freightReportTotals.grossProfit
        },
        {
          label: 'Gross Profit %',
          amount: this.freightReportTotals.grossProfitPercentage
        },
        {
          label: 'Freight Cost',
          amount: this.freightReportTotals.freightCost
        },
        {
          label: 'Freight %',
          amount: this.freightReportTotals.freightCostPercentage
        },
        {
          label: 'Net Profit',
          amount: this.freightReportTotals.netProfit
        },
        {
          label: 'Net Profit %',
          amount: this.freightReportTotals.netProfitPercentage
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

  async pdf(report) {
    let pdfInfo = this.freightReport
    this.freightReport['date'] = this.freightData.beginningOfDay;;
    let docDefinition: any = await pdfFuncs.reportPdf(pdfInfo, [], []);
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
  select(event) {
    this.router.navigate(['customers/invoices/' + event['_id']]);
    // window.location.href = 'https://app.yibas.com/invoices/' + event._id;
  }
}
