import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

import { ActivatedRoute, Router } from '@angular/router';
import {MeteorObservable} from "meteor-rxjs";
import {Categories} from '../../../../both/collections/categories.collection';
import * as funcs from "../../../../both/functions/common";
import {Observable} from "rxjs/Observable";
import { DataTableSource } from '../../../../both/classes/data-table';
import * as systemConfig from '../../../../both/config/systemConfig';
import {PageResolver} from "../../resolvers/PageResolver";
import {merge, of} from 'rxjs';
import {EventEmitterService} from "../../services";
import {Category, CategoryModel} from "../../../../both/models/category.model";
import {switchMap} from "rxjs/operators";
import {SystemLogsService} from "../../services/SystemLogs.service";
import {NotificationsService} from "angular2-notifications";
import {Action} from "../../../../both/models/systemLog.model";

@Component({
  selector: 'inventory-category',
  template: `
    <!--<page-header [(pageHeaderInput)]="pageHeader"></page-header>-->
    <mat-card>
      <div style="height: 50px">
        <div class="viewAll float-left" style="margin: 3px;" *ngFor="let user of activeUsers" [style.backgroundColor]="user.personalColor">
          {{user.firstName.substr(0, 1).toUpperCase()}}{{user.lastName.substr(0, 1).toUpperCase()}}
        </div>
      </div>
      <mat-tab-group *ngIf="category" class="p-10">
        <mat-tab label="Info">
          <div fxLayout="row wrap">
            <div fxFlex="">
              <div class="p-20">
                <mat-slide-toggle
                    [checked]="category.includeSalesReport"
                    (change)="change('includeSalesReport')"
                    labelPosition="before"
                >
                  Include on Sales Report
                </mat-slide-toggle>
                <br>
                <br>
                <mat-slide-toggle
                    [checked]="category.includeBudgetReport"
                    (change)="change('includeBudgetReport')"
                    labelPosition="before"
                >
                  Include on Budget Report
                </mat-slide-toggle>
                <br>
                <br>

                <mat-slide-toggle
                    [checked]="category.allowCustomerContract"
                    (change)="change('allowCustomerContract')"
                    labelPosition="before"
                    color="primary"
                >
                  Allow Customer Contract
                </mat-slide-toggle>
                <br>
                <br>
                <mat-slide-toggle
                    [checked]="category.allowCustomerQuote"
                    (change)="change('allowCustomerQuote')"
                    labelPosition="before"
                    color="primary"
                >
                  Allow Customer Quote
                </mat-slide-toggle>
              </div>
            </div>
            <div fxFlex="70" class="p-20">
              <div class="sales_widget">
                
              </div>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Contracts">
          <div>
            <div fxLayout="row">
              <!--<mat-table *ngIf="state.isDeveloper" #table1 fxFlex="" [dataSource]="activeUsersDataSource">-->
                <!--&lt;!&ndash; ID Column &ndash;&gt;-->
                <!--<div *ngFor="let column of userColumns">-->
                  <!--<ng-container matColumnDef="{{column.prop}}" style="cursor: pointer">-->
                    <!--<mat-header-cell *matHeaderCellDef> {{column.name}}</mat-header-cell>-->
                    <!--<mat-cell *matCellDef="let row">{{row[column.prop]}}</mat-cell>-->
                  <!--</ng-container>-->
                <!--</div>-->
                <!--<mat-header-row *matHeaderRowDef="displayedUserColumns"></mat-header-row>-->
                <!--<mat-row *matRowDef="let row; columns: displayedUserColumns;"></mat-row>-->
              <!--</mat-table>-->
            </div>
            <br>
            <div fxLayout="row" fxLayout.xs="column">
              <div fxFlex="45" fxFlex.xs="100" fxLayout="column">
                <div fxFlex>
                  <mat-form-field style="width: 200px;">
                    <mat-select placeholder="Price Level Type" [value]="category.priceLevelType" (selectionChange)="onPriceLevelTypeChange($event)">
                      <mat-option *ngFor="let type of priceLevelTypes" [value]="type.prop">
                        {{type.name}}
                      </mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>
                <div [ngSwitch]="category.priceLevelType">
                  <div *ngSwitchCase="'grossProfit'">
                    <mat-form-field fxFlex="" class="mr-20">
                      <input matInput placeholder="Level 1 %" min="0" type="number" [ngModel]="category.priceLevel1Percent" (change)="onPercentageChange('priceLevel1Percent', $event)">
                    </mat-form-field>
                    <mat-form-field fxFlex="" class="mr-20">
                      <input matInput placeholder="Level 2 %" min="0" type="number" [ngModel]="category.priceLevel2Percent" (change)="onPercentageChange('priceLevel2Percent', $event)">
                    </mat-form-field>
                    <mat-form-field fxFlex="" class="mr-20">
                      <input matInput placeholder="Level 3 %" min="0" type="number" [ngModel]="category.priceLevel3Percent" (change)="onPercentageChange('priceLevel3Percent', $event)">
                    </mat-form-field>
                    <mat-form-field fxFlex="" class="mr-20">
                      <input matInput placeholder="Level 4 %" min="0" type="number" [ngModel]="category.priceLevel4Percent" (change)="onPercentageChange('priceLevel4Percent', $event)">
                    </mat-form-field>
                  </div>
                  <div *ngSwitchCase="'multiplier'">
                    <mat-form-field fxFlex="" class="mr-20">
                      <input matInput placeholder="Level 1 Multiplier" min="0" type="number" [ngModel]="category.multiplierLevel1" (change)="onMultiplierChange('multiplierLevel1', $event)">
                    </mat-form-field>
                    <mat-form-field fxFlex="" class="mr-20">
                      <input matInput placeholder="Level 2 Multiplier" min="0" type="number" [ngModel]="category.multiplierLevel2" (change)="onMultiplierChange('multiplierLevel2', $event)">
                    </mat-form-field>
                    <mat-form-field fxFlex="" class="mr-20">
                      <input matInput placeholder="Level 3 Multiplier" min="0" type="number" [ngModel]="category.multiplierLevel3" (change)="onMultiplierChange('multiplierLevel3', $event)">
                    </mat-form-field>
                    <mat-form-field fxFlex="" class="mr-20">
                      <input matInput placeholder="Level 4 Multiplier" min="0" type="number" [ngModel]="category.multiplierLevel4" (change)="onMultiplierChange('multiplierLevel4', $event)">
                    </mat-form-field>
                  </div>
                </div>

              </div>
              <div fxFlex="55" fxFlex.xs="100">
                <!--<year-select></year-select>-->
                <mat-form-field style="width: 200px;">
                  <mat-select placeholder="Year To Date:" name="year" [(ngModel)]="selectedYear" (selectionChange)="navigateStartYear()">
                    <mat-option *ngFor="let year of years" [value]="year">
                      {{year}}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <normal-table [rows]="normalTableData.rows" [columns]="normalTableData.columns"></normal-table>
              </div>
            </div>
            
          </div>
          
          <div *ngIf="documentId">
            <system-lookup 
                #manageCategoryProductsLookup
                [lookupName]="'manageCategoryProducts'" 
                (emitDataChange)="onDataChange($event)"
                (onComplete)="onComplete($event)"
                [(config)]="config" 
                [(documentId)]="documentId" 
                [(data)]="data" 
                [(filterConditions)]="filterConditions"></system-lookup>
          </div>

        </mat-tab>
      </mat-tab-group>
    </mat-card>
  `,
  styleUrls: ['inventory.scss']
})

export class InventoryCategoryPage implements OnInit, OnDestroy {

  @ViewChild("manageCategoryProductsLookup") manageCategoryProductsLookup;
  activeUsers = [];
  test: '';
  config = {
    isReactiveUpdate: false,
    enableMultipleUsersUpdate: true
  };
  state:any = {
    isDeveloper: false
  };
  priceLevelTypes = [
    {
      prop: "grossProfit",
      name: "Gross Profit"
    },
    {
      prop: "manual",
      name: "Manual"
    },
    {
      prop: "multiplier",
      name: "Multiplier"
    }
  ]
  pageHeader: string;
  subscription: Subscription;
  category: Category;
  documentId: string;
  systemLog: any;
  columns = [];
  userColumns = [];
  selectedYear: number = new Date().getFullYear();
  years = systemConfig.years;
  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true,
    gt: new Date()
  };
  dataSource: DataTableSource | null;
  activeUsersDataSource: DataTableSource | null;
  displayedColumns = [];
  displayedUserColumns = [];
  normalTableData: any;

  constructor(private route: ActivatedRoute,
              private _router: Router,
              private _logService: SystemLogsService,
              private _service: NotificationsService
  ) {}

  navigateStartYear() {
    this._router.navigate([], {queryParams: {"startYear": this.selectedYear, "endYear": this.selectedYear + 1}, queryParamsHandling: 'merge'})
  }

  ngOnInit() {
    this.onInit();

    this.normalTableData = {
      columns:[],
      rows: []
    };

    this.normalTableData.columns = [
      {
        prop: 'year',
        label: 'Year',
      }, {
        prop: 'units',
        label: 'Units',
        cellTemplate: 'number'
      },
      {
        prop: 'revenue',
        label: 'Revenue',
        cellTemplate: 'currency'
      },
      {
        prop: 'cost',
        label: 'Cost',
        cellTemplate: 'currency'
      },
      {
        prop: 'gp',
        label: 'GP',
        cellTemplate: 'percent'
      },
      {
        prop: 'net',
        label: 'Net',
        cellTemplate: 'currency'
      }
    ];
    this.normalTableData.rows = [];


    this.columns = [
      {
        prop: 'year',
        name: 'Year'
      }, {
        prop: 'units',
        name: 'Units',
        cellTemplate: 'qtyTmpl'
      },
      {
        prop: 'revenue',
        name: 'Revenue',
        cellTemplate: 'currencyTmpl'
      },
      {
        prop: 'cost',
        name: 'Cost',
        cellTemplate: "currencyTmpl"
      },
      {
        prop: 'gp',
        name: 'GP',
        cellTemplate: "percentTmpl"
      },
      {
        prop: 'net',
        name: 'Net',
        cellTemplate: 'currencyTmpl'
      }
    ];

    this.displayedColumns = ['year', 'units', 'revenue', 'cost', 'gp', 'net'];
    this.getActiveUsers();
  }

  async getSystemLog() {
    const query = {sessionId: localStorage.getItem('sessionId')};
    const options = {fields: {sessionId: 1, createdUserId: 1}};
    this.systemLog = PageResolver.systemLog;
  }

  async funcIsDeveloper() {
    this.state.isDeveloper = PageResolver.isDeveloper;
    return PageResolver.isDeveloper;
  }

  async onInit() {
    let queryParams:any = await funcs.callbackToPromise(this.route.queryParams);

    if (!('startYear' in queryParams)) {
      this.navigateStartYear();
    }

    let params = await funcs.callbackToPromise(this.route.params);
    this.documentId = params['documentId'];
    // let obj = await funcs.callbackToPromise(this.route.queryParams);

    this.route.queryParams.subscribe((params) => {
      this.setYear(params);
    });

    this.funcIsDeveloper();

    const subscription = MeteorObservable.subscribe('categories', {_id: this.documentId});
    const autorun = MeteorObservable.autorun();

    this.subscription = merge(subscription, autorun).subscribe(() => {
      let doc = Categories.collection.findOne(this.documentId);
      if (doc) {
        this.pageHeader = 'Product Lines > ' + doc.name + ' - ' + doc.description;
        EventEmitterService.Events.emit({
          name: "",
          pageHeader: this.pageHeader
        })
        this.category = new Category(doc);
        Object.assign(this.data, {category: doc});
      }
    });
    this.getSystemLog();
  }

  setYear(params) {
    if ('startYear' in params) {
      this.selectedYear = Number(params['startYear']);
    }

    const years = [this.selectedYear, this.selectedYear-1];

    this.normalTableData.rows = [];

    years.forEach(async(year=2017) => {

      const result:any = await funcs.getCategorySales(year, this.documentId);

      let row:any = [];
      if (result.length > 0) {
        row = [year,
          result[0].units,
          Number(result[0].revenue.toFixed(2)),
          Number(result[0].cost.toFixed(2)),
          result[0].gp,
          Number(result[0].net.toFixed(2))];
      } else {
        row = [year, 0, 0, 0, 0, 0];
      }
      this.normalTableData.rows.push(row);
    })

  }

  getActiveUsers() {
    this.userColumns = [
      {
        prop: 'firstName',
        name: 'First Name'
      },
      {
        prop: 'idle',
        name: 'Idle'
      },
      {
        prop: 'editable',
        name: 'Editable'
      },
      {
        prop: 'lastActivity',
        name: 'Last Activity'
      },
      {
        prop: 'landTime',
        name: 'Land Time'
      }
    ];
    this.displayedUserColumns = ['firstName', 'idle', 'editable', 'lastActivity', 'landTime'];

    // userstatus
    // const sub = MeteorObservable.subscribe('userStatus',
    //   {
    //     'status.online': true
    //   }
    // );
    // const autorun1 = MeteorObservable.autorun();
    // merge(sub, autorun1).subscribe(async (res) => {
    //
    //   Meteor.users.find({"status.connections.pathname": window.location.pathname}, {fields: {"status.connections": 1}}).fetch();
    //   let allConnections:any = await funcs.getPageConnections(window.location.pathname);
    //   this.activeUsers = allConnections;
    //
    //   // let isEditableSet = false;
    //
    //   if (this.activeUsers.length > 0 ) {
    //     const database = new BehaviorSubject<any[]>([]);
    //     this.activeUsers.forEach(async (user) => {
    //       const copiedData = database.value.slice();
    //       copiedData.push(user);
    //       database.next(copiedData);
    //     });
    //     this.activeUsersDataSource = new DataTableSource(database);
    //   }
    // });
  }

  onMultiplierChange(field, event) {
    let update = {
      $set: {
        [field]: new Decimal(event.target.value)
      }
    };
    this.category._update$(update)
      .subscribe(res => {
        if (res == 1) {
          this.manageCategoryProductsLookup.reloadData('onMultiplierChange');
        }

    })
  }

  onPercentageChange(field, event) {
    let update = {
      $set: {
        [field]: new Decimal(event.target.value)
      }
    };
    this.category._update$(update)
      .pipe(
        switchMap(res => {
          if (res) {
            let logMessage = 'Update ' + field + ' to ' + event.target.value + ' from ' + this.category[field];
            let action = {
              documentId: this.documentId,
              collectionName: 'categories',
              type: 'update',
              field: field,
              log: logMessage,
              createdAt: new Date(),
              value: event.target.value,
              previousValue: this.category[field].toNumber()
            };
            return this._logService._log$(action);
          }
        })
      ).subscribe(res => {
        if (res) {
          this.manageCategoryProductsLookup.reloadData("onCategoryLevelChange");
        }
    })
  }

  change(field) {
    let action:Action = {
      collectionName: "categories",
      type: "UPDATE",
      documentId: this.category._id,
      fieldPath: `${field}_boolean`,
      createdAt: new Date(),
      url: window.location.pathname,
      log: `update ${field} to ${this.category[field]}`,
    };

    this.category._update$({
      $set: {
        [field]: !this.category[field]
      }
    })
      .pipe(
        switchMap(res => {
          if (res) {
            return this._logService._log$(action)
          } else {
            return of(null);
          }
        })
      )
      .subscribe();


    // funcs.update('categories', query, update);
  }

  onPriceLevelTypeChange(event) {
    this.category._update$({
      $set: {
        'priceLevelType': event.value
      }
    })
      .pipe(
        switchMap(() => {
          let action:Action = {
            collectionName: "categories",
            type: "UPDATE",
            documentId: this.category._id,
            fieldPath: `priceLevelType_string`,
            createdAt: new Date(),
            url: window.location.pathname,
            log: `update price level type from ${this.category.priceLevelType} to ${event.value}`,
          }
          return this._logService._log$(action)
        })
      )
      .subscribe(res => {
      if (res == 1) {
        this.manageCategoryProductsLookup.columns
          .forEach(_column => {
            if (['priceLevel1', 'priceLevel2', 'priceLevel3', 'priceLevel4'].indexOf(_column.prop) > -1 ) {
              if (event.value == 'manual') {
                _column.cellTemplate = 'inputTmpl_price';
              } else {
                _column.cellTemplate = 'priceLevelTmpl';
              }
            }
          });

        this.manageCategoryProductsLookup.reloadData('onPriceLevelTypeChange');
      }
    });
  }



  onDataChange(event) {
    if (event.name == 'onLoadColumns') {
      event.value.forEach(_column => {
        if (['priceLevel1', 'priceLevel2', 'priceLevel3', 'priceLevel4'].indexOf(_column.prop) > -1 ) {
          if (this.category.priceLevelType == 'manual') {
            _column.cellTemplate = 'inputTmpl_price';
          } else {
            _column.cellTemplate = 'priceLevelTmpl';
          }
        }
      });
    } else if (event.name == "onManualPriceChange") {
      let column = event.value.column;
      let row = event.value.row;
      let query = {
        _id: row._id
      };
      let update = {
        $set: {
          [event.value.column.prop]: new Decimal(event.value.row[column.prop])
        }
      };

      MeteorObservable.call('update', 'products', query, update)
        .subscribe();
    } else if (event.name == 'onCheckboxChange') {
      console.log('on changebox change');
      this._onCheckboxChange$(event)
        .pipe(
          switchMap(res => {
            if (res) {
              let row = event.value.row;
              let action = {
                collectionName: "products",
                type: "UPDATE",
                documentId: row._id,
                fieldPath: `allowCustomerContract_boolean`,
                createdAt: new Date(),
                url: window.location.pathname,
                log: `update allowCustomerContract to ${row.allowCustomerContract}`
              }
              return this._logService._log$(action);
            } else {
              return of(null);
            }
          })
        )
        .subscribe(res => {
          if (res) {
            if (res) {
              this._service.success(
                'Success',
                'Update Success'
              )
            }
          }
        })
    }
  }

  _onCheckboxChange$(event) {
    let row = event.value.row;
    let column = event.value.column;
    let query = {
      _id: row._id
    };
    let update = {
      $set: {
        allowCustomerContract: row.allowCustomerContract
      }
    };
    return MeteorObservable.call('update', 'products', query, update)
      // .subscribe(res => {
      //   if (res) {
      //     this._service.success(
      //       'Success',
      //       'Update Success'
      //     )
      //   }
      // });

  }

  onCheckboxChange(event) {
    let row = event.value.row;
    let column = event.value.column;
    let query = {
      _id: row._id
    };
    let update = {
      $set: {
        allowCustomerContract: row.allowCustomerContract
      }
    };
    MeteorObservable.call('update', 'products', query, update)
      .subscribe(res => {
      if (res) {
        this._service.success(
          'Success',
          'Update Success'
        )
      }
    });

  }

  onComplete(event) {
    let dirtyRows = this.manageCategoryProductsLookup._getDirtyRows();
    // if (this.category._id == "hwUd1zq7BMAM1q5vd") {
    //   MeteorObservable.call('find', 'products', {_id: {$in: ["BjUw3ec6cZPIP4hBq", "Y69mpKnjOzhE8zUrh"]}})
    //     .subscribe((res:any) => {
    //       res.forEach(row => {
    //         let findRow = dirtyRows.find(_row => _row._id == row._id);
    //         findRow.priceLevel1 = row.priceLevel1;
    //         findRow.priceLevel2 = row.priceLevel2;
    //         findRow.priceLevel3 = row.priceLevel3;
    //         findRow.priceLevel4 = row.priceLevel4;
    //       })
    //     });
    // }
  }

  ngOnDestroy() {
    // this.subscription.unsubscribe();
  }
}


