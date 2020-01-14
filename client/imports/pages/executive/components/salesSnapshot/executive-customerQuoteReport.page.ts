import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { parseAll, getReferredLookupId, runAggregate, setObjectValue } from '../../../../../../both/functions/common';
import { MeteorObservable } from "meteor-rxjs";
import { FormControl } from '@angular/forms';
import * as moment from 'moment';
import * as funcs from '../../../../../../both/functions/common';
import * as pdfFuncs from '../../../../../../both/functions/lookupPdf';
import * as pdfMake from 'pdfmake/build/pdfmake';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from "../../../../services/UserService";
import { AllCollections } from "../../../../../../both/collections/index";
import { map, switchMap, tap } from "rxjs/operators";
import { merge } from 'rxjs';
import { EventEmitterService } from "../../../../services/index";

@Component({
  selector: 'executive-customerQuoteReport',
  template: `
      <mat-card class='fullHeight'>
        <h2 style='margin-top: 0px; float: left;'>Quote Totals</h2>
        <span class='cardIcons'>
          <i class="material-icons" (click)="changeView('convertedQuotesReportSummary')">view_headline</i>
          <i class="material-icons" (click)="changeView('convertedQuotesReport')">exit_to_app</i>
          <i class="material-icons" (click)="pdf()">picture_as_pdf</i>
          <i class="material-icons" *hasPermission="['generateExecReport']" (click)='overviewFunc()'>playlist_add</i>
        </span>
        <hr style='clear: both;'>
        <div>
          <mat-form-field style='float: left; width: 49%;'>
            <input matInput [matDatepicker]="startPicker" [max]="date.endOfRange.value" (dateChange)="changeDay('start', $event)" [value]="date.startOfRange.value" placeholder="Start Date">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field style='float: right; width: 49%;'>
            <input matInput [matDatepicker]="endPicker" [min]="date.startOfRange.value" (dateChange)="changeDay('end', $event)" [value]="date.endOfRange.value" placeholder="End Date">
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
          <br>
          <div style="overflow-x:auto; clear: both;">
            <table id='tables' *ngIf="!loading">
              <tr>
                <th></th>
                <th>Appd</th>
                <th>Rej</th>
                <th>Convt</th>
              </tr>
              <tr *ngFor="let row of quoteReport.results">
                <th class="rowHead">{{row.user}}</th>
                <td class="alignRight">{{row.approved}}</td>
                <td class="alignRight">{{row.rejected}}</td>
                <td class="alignRight">{{row.converted}}</td>
              </tr>
            </table>
            <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
          </div>
        </div>
      </mat-card>
  `,
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutiveCustomerQuoteReportPage implements OnInit {

  @Input() data: any;
  today: any;
  date: any = {};
  quoteData: any = {};
  filterConditions: any;
  objLocal: any = {};
  quoteReport: any = {};
  quoteReportTotal: any = {};
  loading: boolean = false;
  @Output() lookupView = new EventEmitter<any>();

  constructor(private router: Router, private route: ActivatedRoute, private userService: UserService) { }

  async init() {
    MeteorObservable.call('findOne', 'systemLookups', { name: 'convertedQuotesReport', tenantId: Session.get('tenantId') })
      .pipe(
      switchMap(lookup => this.parseLookupMethod(lookup, 0)),
      switchMap((parsed:any) => {
        if (parsed) {
          let totalAggregate = this.groupLogic(this.quoteReport['lookup'], parsed)
          totalAggregate.unshift({
            "$match": {
              "createdAt": {
                "$gte": new Date(this.quoteData.startOfRange),
                "$lte": new Date(this.quoteData.endOfRange)
              }
            }
          })
          return funcs.runAggregate('customerQuotes', totalAggregate);
        }
      }),
      tap((res) => {
        this.quoteReport['results'] = res['result'];
        this.quoteReport['results'].sort(function (a, b) {
          return b.quoted - a.quoted;
        });
        this.loading = false;
      }),
      switchMap(lookup => this.parseLookupMethod(this.quoteReport['lookup'], 0)),
      switchMap((parsed:any) => {
        parsed.unshift({
          "$match": {
            "createdAt": {
              "$gte": new Date(this.quoteData.startOfRange),
              "$lte": new Date(this.quoteData.endOfRange)
            }
          }
        })
        if (parsed) {
          return funcs.runAggregate('customerQuotes', parsed);
        }
      }),
    ).subscribe(res => {
      this.quoteReport['result'] = res['result'];
      this.quoteReport['result'].sort(function (a, b) {
        let convertedA = a.converted.toUpperCase();
        let convertedB = b.converted.toUpperCase();
        if (convertedA < convertedB) {
          return 1;
        }
        if (convertedA > convertedB) {
          return -1;
        }
        return 0;
      });
    });
  }

  ngOnInit() {
    let beginningOfRange = moment().subtract(30, 'day').startOf('day').format();
    let endOfRange = moment().endOf('day').format();
    this.setDateVariables(beginningOfRange, endOfRange);

    let query = {
      $and: [
        { $or: [{ status: 'approved' }, { status: 'rejected' }] },
        { "createdAt": { "$gte": new Date(beginningOfRange), "$lte": new Date(endOfRange) } }
      ]
    }
    this.loading = true;
    const sub = MeteorObservable.subscribe('customerQuotes', query);
    const autorun = MeteorObservable.autorun();
    merge(sub, autorun).subscribe(() => {
      let result = AllCollections['customerQuotes'].collection.find().fetch();
      this.init();
    })
  }

  setDateVariables(beginningOfRange, endOfRange) {
    this.date.startOfRange = new FormControl(new Date(beginningOfRange));
    this.date.endOfRange = new FormControl(new Date(endOfRange));
    // this.quoteData.startOfRange = beginningOfRange;
    // this.quoteData.endOfRange = endOfRange;
    this.quoteData.startOfRange = new Date(beginningOfRange);
    this.quoteData.endOfRange = new Date(endOfRange);
  }

  parseLookupMethod(lookup, index) {
    this.quoteReport['lookup'] = lookup;
    let method = lookup['methods'][index]
    let parsed = parseAll(lookup['methods'][index].args, this.objLocal);
    let date;
    if ('datePaths' in method.args[0]) {
      method.args[0].datePaths.forEach(datePath => {
        if (datePath.indexOf('$gte') !== -1) {
          date = this.quoteData.startOfRange;
        } else if (datePath.indexOf('$lte') !== -1) {
          date = this.quoteData.endOfRange;
        }
        setObjectValue(parsed[0], datePath, new Date(date));
      })
    }
    return parsed;
  }

  groupLogic(lookup, aggregate) {
    let dashboardLogic = parseAll(lookup['dashboardLogic'], this.objLocal);
    let totalAggragate = aggregate.concat(dashboardLogic[0]);
    return totalAggragate;
  }

  async changeDay(input, event) {
    this.loading = true;
    switch (input) {
      case 'start':
        let beginningOfRange = moment(event.value).startOf('day').format()
        this.date.startOfRange = new FormControl(new Date(beginningOfRange));
        // this.quoteData.startOfRange = beginningOfRange;
        this.quoteData.startOfRange = new Date(beginningOfRange);
        break;
      case 'end':
        let endOfRange = moment(event.value).endOf('day').format();
        this.date.endOfRange = new FormControl(new Date(endOfRange));
        // this.quoteData.endOfRange = endOfRange;
        this.quoteData.endOfRange = new Date(endOfRange);
        break;
      default:
    }
    this.init();
  }

  changeView(view) {
    let range = this.quoteData;
    let beginningOfRange = moment(range.startOfRange).startOf('day').format();
    let endOfRange = moment(range.endOfRange).endOf('day').format();
    let paramObj = {
      lookupName: view,
      filterName: 'dateRange',
      columns: 'date',
      date_method: '<>',
      date_value: [beginningOfRange, endOfRange],
    }

    if (!range.endOfRange) {
      paramObj.date_method = '$gte';
      paramObj.date_value = [beginningOfRange];
    } if (!range.startOfRange) {
      paramObj.date_method = '$lte';
      paramObj.date_value = [endOfRange];
    }

    let lookupData = {};
    lookupData = Object.assign({
      view: view,
      queryParams: paramObj,
    }, lookupData);

    this.lookupView.emit(lookupData);
  }

  async overviewFunc() {
    EventEmitterService.Events.emit({
      "name": "overviewReport",
      "value": {
        "name": "quoteReport",
        "title": 'Quote Report',
        "value": await this.returnData()
      }
    });
  }
  async returnData() {
    let value = this.quoteReport.results;
    let rows = [
      {
        label: '',
        approved: 'Appd',
        rejected: 'Rej',
        converted: 'Convt'
      }
    ];
    for (let index = 0; index < value.length; index++) {
      const el = value[index];
      let obj = {
        label: el.user,
        approved: el.approved,
        rejected: el.rejected,
        converted: el.converted
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
          "prop": "approved",
          "type": "string",
        },
        {
          "prop": "rejected",
          "type": "string",
        },
        {
          "prop": "converted",
          "type": "string",
        },
      ]
    }
    return table;
  }


  async pdf() {
    let pdfInfo = this.quoteReport;
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
