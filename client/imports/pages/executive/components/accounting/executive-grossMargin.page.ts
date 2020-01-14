import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import * as moment from 'moment';
import { MeteorObservable } from "meteor-rxjs";
import { SystemLookup } from "../../../../../../both/models/systemLookup.model";
import { UserService } from "../../../../services/UserService";
import * as funcs from '../../../../../../both/functions/common';
import { EventEmitterService } from "../../../../services/index";

@Component({
  selector: 'executive-grossMargin',
  template: `
    <mat-card class='fullHeight'>
      <h2 style='margin-top: 0px; float: left;' (click)='loading = !loading'>Gross Margin</h2>
      <span class='cardIcons'>
        <i class="material-icons" (click)='showToggles = !showToggles'>toggle_off</i>
        <i class="material-icons" (click)="changeView('grossMarginProductLines')">exit_to_app</i>
        <i class="material-icons" *hasPermission="['generateExecReport']" (click)='overviewFunc()'>playlist_add</i>
      </span>
      <hr style='clear: both;'>
      <div *ngIf='showToggles' style='padding-bottom: 5px; text-align: right;'>
        <span>
          <strong>YTD </strong> 
            <mat-slide-toggle
              color="primary"
              [checked]="!selectedToggle.showYTD"
              (change)="change($event.checked, 'showYTD')">
            </mat-slide-toggle>
          <strong> MTD </strong>
        </span>
        <br>
        <span>
          <strong><i class="material-icons">arrow_downward</i></strong> 
            <mat-slide-toggle
              color="primary"
              [checked]="!selectedToggle.descendingOrder"
              (change)="change($event.checked, 'descendingOrder')">
            </mat-slide-toggle>
          <strong><i class="material-icons">arrow_upward</i></strong>
        </span>
      </div>
      <div style="overflow-x:auto;">
        <span *ngIf="!loading">
          <mat-tab-group #mtg class="header-less-tabs">
              <span *ngFor="let table of tables; let i=index">
                <mat-tab label="">
                    <table id='tables'>
                      <tr>
                          <th class="rowHead"></th>
                          <th class="col">Current {{selectedToggle.showYTD ? 'YTD' : 'MTD'}}</th>
                          <th class="col">GP % {{selectedToggle.showYTD ? 'YTD' : 'MTD'}}</th>
                          <th class="col">Previous {{selectedToggle.showYTD ? 'YTD' : 'MTD'}}</th>
                          <th class="col">GP % {{selectedToggle.showYTD ? 'YTD' : 'MTD'}}</th>
                          <th class="col"></th>
                      </tr>
                      <tr *ngFor="let row of grossMarginProductLines | slice:table.slice:table.limit; let i=index">

                         <!-- <th *ngIf='selectedToggle.showPercentage' class="rowHead">{{row.category}}</th>
                          <td *ngIf='selectedToggle.showPercentage' class="alignRight">{{(selectedToggle.showYTD ? row.averageGrossProfitCurrent : row.averageGrossProfitCurrentMTD) |  number : '1.2-2'}}%</td>
                          <td *ngIf='selectedToggle.showPercentage' class="alignRight">{{(selectedToggle.showYTD ? row.averageGrossProfitPrevious : row.averageGrossProfitPrevMTD) |  number : '1.2-2'}}%</td>
                          <td *ngIf='selectedToggle.showPercentage' class="alignRight" style='text-align: center;' [ngClass]="{
                            greenBackground: (selectedToggle.showYTD ? row.direction : row.directionMTD) == 'green',
                            yellowBackground: (selectedToggle.showYTD ? row.direction : row.directionMTD) == 'yellow',
                            redBackground: (selectedToggle.showYTD ? row.direction : row.directionMTD) == 'red'
                            }"><i class="material-icons">{{returnIcon(selectedToggle.showYTD ? row.direction : row.directionMTD)}}</i></td>
                            -->
                            
                          <th class="rowHead">{{row.category}}</th>
                          <td class="alignRight">{{(selectedToggle.showYTD ? row.grossProfitActualCurrent : row.grossProfitActualCurrentMTD) | customCurrency}}</td>
                          <td class="alignRight">{{(selectedToggle.showYTD ? row.averageGrossProfitCurrent : row.averageGrossProfitCurrentMTD) |  number : '1.2-2'}}%</td>
                          <td class="alignRight">{{(selectedToggle.showYTD ? row.grossProfitActualPrevious : row.grossProfitActualPrevMTD) | customCurrency}}</td>
                          <td class="alignRight">{{(selectedToggle.showYTD ? row.averageGrossProfitPrevious : row.averageGrossProfitPrevMTD) |  number : '1.2-2'}}%</td>
                         <!-- <td class="alignRight">{{getPercentChange((selectedToggle.showYTD ? row.grossProfitActualCurrent : row.grossProfitActualCurrentMTD), (selectedToggle.showYTD ? row.grossProfitActualPrevious : row.grossProfitActualPrevMTD))}}</td> -->
                          <td class="alignRight" style='text-align: center;' [ngClass]="{
                            greenBackground: (selectedToggle.showYTD ? row.directionActual : row.directionActualMTD) == 'green',
                            yellowBackground: (selectedToggle.showYTD ? row.directionActual : row.directionActualMTD) == 'yellow',
                            redBackground: (selectedToggle.showYTD ? row.directionActual : row.directionActualMTD) == 'red'
                            }"><i class="material-icons">{{returnIcon(selectedToggle.showYTD ? row.directionActual : row.directionActualMTD)}}</i></td>
                      </tr>
                    </table>
                </mat-tab>
              </span>
          </mat-tab-group>
          <span style='display: table; margin: 0 auto; padding-top: 10px;'>
              <mat-button-toggle-group class='noBoxShadow' value='0'>
                <mat-button-toggle value="0" (click)="mtg.selectedIndex=0;">1</mat-button-toggle>
                <mat-button-toggle value="1" (click)="mtg.selectedIndex=1;">2</mat-button-toggle>
                <mat-button-toggle value="2" (click)="mtg.selectedIndex=2;">3</mat-button-toggle>
              </mat-button-toggle-group>
          </span>
        </span>
      </div>
      <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
    </mat-card>
  `,
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutiveGrossMarginPage implements OnInit {

  @Input() data: any;
  @Output() lookupView = new EventEmitter<any>();
  glControl = new FormControl();
  filterConditions: any;
  objLocal: any = {};
  loading: boolean = true;
  grossMarginProductLines: any = [];
  topLimit = 5;
  showToggles: boolean = false;
  selectedToggle: any = {
    showYTD: true,
    showPercentage: true,
    descendingOrder: true
  };
  tables = [
    { slice: 0, limit: 5 }, 
    { slice: 5, limit: 10 }, 
    { slice: 10, limit: 15 }
  ];
  lookupData: any = {
    data: {
      startDate: moment().startOf('year').format(),
      endDate: moment().startOf('day').add(1, 'day').format()
    }
  };
  constructor(private router: Router, private activatedRoute: ActivatedRoute, private userService: UserService) {}
  
  async init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();

    SystemLookup._GetReferredLookup$(UserService.user, 'grossMarginProductLines')
      .subscribe(lookup => {
        let id = lookup._id;
        this.grossMarginAggregate(id);
      })
  }
  
  ngOnInit() {
    this.init();
  }

  change(event, variable){
    let sortField = '';
    event = event ? !true : !false;
    this.selectedToggle[variable] = event;
    let descendingOrder = this.selectedToggle['descendingOrder'];
    sortField = this.selectedToggle.showYTD ? 'diffActual' : 'diffMTDActual';

    this.grossMarginProductLines = this.grossMarginProductLines.sort(function (a, b) {
      return descendingOrder ? a[sortField] - b[sortField] : b[sortField] - a[sortField];
    });
  }

  async grossMarginAggregate(id) {
    let sub = MeteorObservable.call('findOne', 'systemLookups', { _id: id }).subscribe(lookup => {
      let method = lookup['methods'][0]
      let parsed = funcs.parseAll(lookup['methods'][0].args, this.objLocal);
      let date;
      if ('datePaths' in method.args[0]) {
        method.args[0].datePaths.forEach(datePath => {
          if (datePath.indexOf('startDate') !== -1) {
            date = this.lookupData.data.startDate
          } else if (datePath.indexOf('endDate') !== -1 || datePath.indexOf('$lt') !== -1) {
            date = this.lookupData.data.endDate
          }
          funcs.setObjectValue(parsed[0], datePath, new Date(date));
        })
      }

      parsed = this.removeLimitAndSkipAndSort(parsed[0]);
      // console.log(JSON.stringify(parsed))
      this.runGrossMarginAggregate(lookup['methods'][0].collectionName, parsed);
    });
  }

  async runGrossMarginAggregate(collection, pipeline) {
    let results = await funcs.runAggregate(collection, pipeline);
    results = results['result'];
    this.grossMarginProductLines = results;
    // console.log(this.grossMarginProductLines)
    this.loading = false;
  }

  removeLimitAndSkipAndSort(pipeline) {
    let removeValFromIndex = [];
    let arr = pipeline;
    arr.forEach((element, index, object) => {
      if ('$limit' in element || '$skip' in element) {
        removeValFromIndex.push(index)
      }
    });
    for (let i = removeValFromIndex.length - 1; i >= 0; i--) {
      arr.splice(removeValFromIndex[i], 1)
    }
    return arr;
  }

  returnIcon(direction) {
    switch (direction) {
      case 'green':
        return 'arrow_upward'
      case 'red':
        return 'arrow_downward'
      case 'yellow':
        return 'remove'
      default:
        break;
    }
  }

  async overviewFunc() {
    EventEmitterService.Events.emit({
      "name": "overviewReport",
      "value": {
        "name": "executive-grossMargin",
        "title": 'Gross Margins',
        "value": await this.returnData()
      }
    });
  }
  async returnData() {
    let value = this.grossMarginProductLines;
    let rows = [
      {
        label: '',
        current: `Current ${this.selectedToggle.showYTD ? 'YTD' : 'MTD'}`,
        currentGP: `GP % ${this.selectedToggle.showYTD ? 'YTD' : 'MTD'}`,
        previous: `Previous ${this.selectedToggle.showYTD ? 'YTD' : 'MTD'}`,
        previousGP: `GP % ${this.selectedToggle.showYTD ? 'YTD' : 'MTD'}`,
      }
    ];
    for (let index = 0; index < 15; index++) {
      const el = value[index];
      let obj = {
        label: el.category,
        current: funcs.formatMoney(this.selectedToggle.showYTD ? el.grossProfitActualCurrent : el.grossProfitActualCurrentMTD),
        currentGP: (this.selectedToggle.showYTD ? el.averageGrossProfitCurrent : el.averageGrossProfitCurrentMTD).toFixed(2) + '%',
        previous: funcs.formatMoney(this.selectedToggle.showYTD ? el.grossProfitActualPrevious : el.grossProfitActualPrevMTD),
        previousGP: (this.selectedToggle.showYTD ? el.averageGrossProfitPrevious : el.averageGrossProfitPrevMTD).toFixed(2) + '%',
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
          "prop": "current",
          "type": "string",
        },
        {
          "prop": "currentGP",
          "type": "string",
        },
        {
          "prop": "previous",
          "type": "string",
        },
        {
          "prop": "previousGP",
          "type": "string",
        },
      ]
    }
    return table;
  }

  getPercentChange(numerator, denominator) {
    return funcs.percentChange({ numerator, denominator});
  }

  changeView(lookup) {
    let lookupData = Object.assign({
      view: lookup,
      pageHeader: 'Gross Margin',
      hideColumns: this.getColumns()
    }, this.lookupData.data);
    this.lookupView.emit(lookupData);
  }

  getColumns(){
    return this.selectedToggle.showYTD ? 
      ["averageGrossProfitCurrentMTD", "averageGrossProfitPrevMTD", "diffMTD", "grossProfitActualCurrentMTD", "grossProfitActualPrevMTD", "diffMTDActual"] : 
      ["averageGrossProfitCurrent", "averageGrossProfitPrevious", "diff", "grossProfitActualCurrent", "grossProfitActualPrevious", "diffActual"];
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

}
