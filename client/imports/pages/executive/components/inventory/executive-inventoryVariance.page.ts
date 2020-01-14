import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import {
    parseAll,
    runAggregate,
    setObjectValue,
} from '../../../../../../both/functions/common';
import { MeteorObservable } from "meteor-rxjs";
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from "../../../../services/UserService";
import { EventEmitterService } from "../../../../services/index";
import { SystemLookup } from "../../../../../../both/models/systemLookup.model";

@Component({
    selector: 'executive-inventoryVariance',
    template: `
    <mat-card class='fullHeight'>
      <h2 style='margin-top: 0px; float: left;'>Inventory Variance</h2>
      <span class='cardIcons'>
        <i class="material-icons" (click)="changeView('inventoryVariance')">exit_to_app</i>
        <i class="material-icons" *hasPermission="['generateExecReport']" (click)='overviewFunc()'>playlist_add</i>
      </span>
      <hr style='clear: both;'>
      <div style="overflow-x:auto;">
        <table id='tables' *ngIf="!loading">
          <tr *ngFor='let variance of inventoryVariance.result'>
            <th class="rowHead">{{variance.number}} - {{variance.description}}</th>
            <td class="alignRight">{{variance.difference | customCurrency}}</td>
          </tr>
        </table>
        <mat-spinner *ngIf="loading" style="height: 50px; width: 50px; float: left;" [hidden]="" class="app-spinner"></mat-spinner>
      </div>
    </mat-card>
  `,
    styleUrls: ['../executive-dashboard.page.scss'],
})

export class ExecutiveInventoryVariance implements OnInit, OnDestroy {

    @Input() data: any;
    filterConditions: any;
    objLocal: any = {};
    inventoryVarianceData: any= {};
    inventoryVariance: any= {};
    openOrdersTotals: any = {};
    loading: boolean = true;
    pdfLoading: boolean = false;
    pdfParsedAggregate: any;
    // rows: any;
    @Output() rows = new EventEmitter<any>();
    @Output() lookupView = new EventEmitter<any>();
    referredlookupSub: Subscription;
    inventoryVarianceSub: Subscription;

    constructor(private router: Router, private activatedRoute: ActivatedRoute, private userService: UserService) {
    }

    async init() {
      this.objLocal.parentTenantId = Session.get('parentTenantId');
      this.objLocal.tenantId = Session.get('tenantId');
      this.objLocal.data = {};
      this.objLocal.data.year = Number(moment().format('YYYY'));
      this.inventoryVarianceData.year = Number(moment().format('YYYY'));
      let id
      this.referredlookupSub = SystemLookup._GetReferredLookup$(UserService.user, 'inventoryVariance')
          .subscribe(lookup => {
              id = lookup._id;
              this.getInventoryVarianceAggregate(lookup._id);
          })
      // let query = {
      //   eligibleInventory: true,
      // }
      // const sub = MeteorObservable.subscribe('ledgerAccounts', query);
      // const autorun = MeteorObservable.autorun(); 
      // merge(sub, autorun).subscribe(() => {
      //   let result = AllCollections['ledgerAccounts'].collection.find().fetch();
      //   // if (Object.keys(this.borrowingBaseTotals).length > 0 && Object.keys(this.inventory).length) {
      //   //   this.getBorrowingBaseAggregate()
      //   //   this.projectedFutureSales()
      //   // }
      // })
    }

    ngOnInit() {
      this.init();
    }

    async overviewFunc() {
      EventEmitterService.Events.emit({
        "name": "overviewReport",
        "value": {
          // "action": "add",
          // "value": {
            "name": "inventoryVariance",
            "title": 'Variance',
            "value": await this.returnData()
          // }
        }
      });
    }
    async returnData() {
      let value = this.inventoryVariance.result;
      let rows = [];
      for (let index = 0; index < value.length; index++) {
        const el = value[index];
        let obj = {
          label: `${el.number} - ${el.description}`,
          amount: el.difference
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
            "prop": "amount",
            "type": "dollar",
          },
        ]
      }
      return table;
    }

    async getInventoryVarianceAggregate(id) {
      this.inventoryVarianceSub = MeteorObservable.call('findOne', 'systemLookups', { _id: id }).subscribe(lookup => {
        this.inventoryVariance['lookup'] = lookup;
        let method = lookup['methods'][0]
        let parsed = parseAll(lookup['methods'][0].args, this.objLocal);

        parsed = this.removeLimitAndSkipAndSort(parsed[0]);
        this.getInventoryVariance('ledgerAccounts', parsed)
      });
    }

    async getInventoryVariance(collection, pipeline) {
      pipeline = this.removeLimitAndSkipAndSort(pipeline)
      let result = await runAggregate(collection, pipeline);
      this.inventoryVariance['result'] = result['result'].sort(function (a, b) {
          return b.abs - a.abs
      });
      this.inventoryVariance['result'] = this.inventoryVariance['result'].slice(0, 5);
      this.loading = false;
    }

    changeView(lookup) {
      let lookupData = this.inventoryVarianceData
      lookupData = Object.assign({
        view: 'inventoryVariance',
        pageHeader: 'Inventory Variance',
      }, lookupData);
      this.lookupView.emit(lookupData);
    }


    getFilterConditions(action) {
      this.reducers(action);
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
      this.referredlookupSub.unsubscribe();
      if (this.inventoryVarianceSub != null) {
          this.inventoryVarianceSub.unsubscribe();
      }
    }
}
