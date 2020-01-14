import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from "@angular/material";
import {NotificationsService} from "angular2-notifications";
import {Note, ProductionRun, ProductionRunModel} from "../../../../both/models/productionRun.model";
import {MeteorObservable} from "meteor-rxjs";
import {ProductionOrder, ProductionOrderModel} from "../../../../both/models/productionOrder.model";
import {map, switchMap, take, tap} from "rxjs/operators";
import {of} from "rxjs";
import {Random} from "meteor/random";
import {EventEmitterService} from "../../services";
import moment = require("moment");
import {dateTimeFormat} from "../../../../both/config/systemConfig";
import {templateObj} from "../../../../both/functions/common";
import {User} from "../../../../both/models/user.model";
import {DialogSelect} from "../../modules/shared-module/system-lookup/system-lookup.component";
import {AllCollections} from "../../../../both/collections";
import {merge} from "rxjs";
import {SystemLogsService} from "../../services/SystemLogs.service";

@Component({
  selector: 'inventory-production-runs',
  styleUrls: ['inventory.scss'],
  template: `
    <mat-card *ngIf="view == ''">
      <div fxLayout="row" fxLayoutGap="10px">
        <mat-form-field>
          <input matInput #productionOrderInput autofocus placeholder="Work Order" [(ngModel)]="productionOrderNumber" (change)="onProductionOrderNumberChange()">
          <mat-icon matSuffix class="cursor-pointer" (click)="searchProductionOrders()" >search</mat-icon>
        </mat-form-field>
        <div *ngIf="productionOrder">
          <mat-form-field>
            <input matInput placeholder="Product" readonly [(ngModel)]="productName">
          </mat-form-field>
          <mat-form-field>
            <input matInput placeholder="Qty Built" readonly [(ngModel)]="orderQtyStr">
          </mat-form-field>
          <mat-form-field>
            <input matInput placeholder="Qty Remaining" readonly type="number" [(ngModel)]="orderQtyRemaining">
          </mat-form-field>
        </div>
      </div>
      
      <div *ngIf="productionOrder">
        <mat-tab-group class="single-tab-emphasis" [selectedIndex]="tabIndex" (selectedIndexChange)="onTabIndexChange($event)" aria-disabled="true">
          <mat-tab label="Details"> 
            <div fxLayout="row" style="padding: 20px;">
              <div fxFlex="" fxLayout="column">
                <div fxLayout="row">
                  <div>
                    <mat-form-field>
                      <mat-select [disabled]="runStatus == 'Complete'" placeholder="Run Status" (selectionChange)="onRunStatusChange($event)" [(value)]="runStatus">
                        <mat-option *ngFor="let status of runStatuses" [value]="status.name" [disabled]="status.isDisabled" >
                          {{status.name}}
                        </mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                </div>
                <mat-form-field>
                  <mat-select placeholder="Order Status" [(value)]="orderStatus" [disabled]="true">
                    <mat-option *ngFor="let status of orderStatuses" [value]="status.name" [disabled]="status.isDisabled" >
                      {{status.name}}
                    </mat-option>
                  </mat-select>
                  <!--<input matInput placeholder="Order Status" [value]="orderStatus" />-->
                </mat-form-field>
                <mat-form-field>
                  <input matInput placeholder="Order Date" [value]="productionOrder?.createdAt | date: 'MMM d, y, h:mm a'" />
                </mat-form-field>
                <mat-form-field>
                  <input matInput placeholder="Order By" [value]="createdUser?.profile.firstName + ' ' + createdUser?.profile.lastName" />
                </mat-form-field>
              </div>
              <div fxFlex="">
                <mat-card fxFlex="">
                  <mat-card-title>
                    Picking
                  </mat-card-title>
                  <mat-card-content>
                    <system-lookup
                        #productionRunsDetailsPickingLookup
                        isModal="true"
                        lookupName="productionRunsDetailsPicking"
                        [data]="productionRunsDetailsPickingLookupData"></system-lookup>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
            
          
          </mat-tab>
          <mat-tab label="Time">
            <div  fxLayout="row">

              <mat-card fxFlex="">
                <mat-card-title>
                  <div fxFlex>
                    Workers
                    <i class="material-icons cursor-pointer" *ngIf="runStatus != 'Complete'" (click)="showAddWorkerList()">
                      add_circle_outline
                    </i>
                  </div>
                  <div fxFlex fxLayoutAlign="space-evenly end" *ngIf="selectedWorker && runStatus != 'Complete'">
                    <button mat-raised-button color="primary" *ngIf="showLoginButton" style="background: #77dd77;" (click)="clockIn()">Log In</button>
                    <button mat-raised-button color="warning" *ngIf="!showLoginButton" style="background: #ff6961; color: white"  (click)="clockOut()">Log Out</button>
                  </div>
                </mat-card-title>
                <mat-card-content *ngIf="productionOrder">
                  <system-lookup #productionRunWorkersLookup (onComplete)="onWorkersListComplete($event); selectFirstRow('productionRunWorkersLookup', 1)" isModal="true" [data]="productionRunWorkersLookupData" lookupName="productionRunWorkers" (onSelected)="onClickWorker($event)" (onEvent)="onWorkersListEvent($event)"></system-lookup>
                </mat-card-content>

              </mat-card>
              <mat-card fxFlex="">
                <mat-card-title>
                  Time Log
                </mat-card-title>
                <mat-card-content *ngIf="selectedWorker">
                  <system-lookup 
                      #productionRunWorkerLaborDetailLookup
                      (onComplete)="onTimeLogComplete($event)"
                      (onSelected)="onTimeLogSelect($event)"
                      (onEvent)="onTimeLogEvents($event)"
                      isModal="true" 
                      lookupName="productionRunWorkerLaborDetail" 
                      [data]="productionRunWorkerLaborDetailLookupData"></system-lookup>
                </mat-card-content>
              </mat-card>
            </div>
            
          </mat-tab>
          <mat-tab label="Notes">
            <div *ngIf="productionRun">
              <div *ngFor="let note of productionRun.notes" fxLayout="column" style="padding: 10px;">
                <div class="hoverCard" style="min-height: 100px; width: 100%; position: relative">
                  <mat-card>
                    <mat-card-title>
                      {{note.user}}
                    </mat-card-title>
                    <mat-card-subtitle>
                      {{note.createdAt}}
                    </mat-card-subtitle>
                    <mat-card-content>
                      <div>
                        <span *ngIf="!note.isEdit" >
                          {{note.message}}
                        </span>  
                        <span *ngIf="note.updatedAt" style="opacity: 0.5" matTooltip="{{note.updatedAt | date: 'medium'}}">(edit)</span>
                      </div>
                      <div *ngIf="note.isEdit">
                        <mat-form-field class="full-width">
                          <input matInput [value]="note.message" (keydown.enter)="saveEditNote(note, $event)" />
                        </mat-form-field>
                      </div>
                    </mat-card-content>
                  </mat-card>
                  <div class="actions" style="position: absolute; top: 10px; right: 10px; padding: 10px;">
                    <button mat-raised-button="" style="border-radius: 0px;" color="primary" (click)="editNote(note)">Edit</button>
                    <button mat-raised-button="" style="border-radius: 0px;" color="warning" (click)="deleteNote(note)">Delete</button>
                    <!--<button mat-raised-button="" >asf</button>-->
                    <!--<mat-button-toggle-group name="fontStyle" aria-label="Font Style">-->
                    <!--<mat-button-toggle value="bold" (click)="edit()" >Edit</mat-button-toggle>-->
                    <!--<mat-button-toggle value="italic">Delete</mat-button-toggle>-->
                    <!--</mat-button-toggle-group>-->
                  </div>
                </div>
              </div>
            </div>
           

            <div fxLayout="row" fxLayoutAlign="space-between center">
              <div fxFlex="100" class="select-containter">
                <mat-form-field class="full-width">
                  <textarea matInput placeholder="Notes" style="height: 200px;" [(ngModel)]="note" (keydown.enter)="addNote()"></textarea>
                </mat-form-field>
              </div>
            </div>


            <!--<mat-form-field class="full-width" style="border: 1px solid black; border-radius: 5px;">-->
              <!--<textarea class="full-width" style="height: 350px;" matInput placeholder="Leave a comment"></textarea>-->
            <!--</mat-form-field>-->

          </mat-tab>
        </mat-tab-group>
      </div>
    </mat-card>
    <mat-card *ngIf=" view == 'add-worker'">
      <button mat-icon-button style='float: right;' (click)="toView('')">
        <mat-icon class="md-24">close</mat-icon>
      </button>

      <system-lookup lookupName="selectWarehouseTempsUsers" isModal="true" (onSelected)="onAddWorker($event)"> </system-lookup>
    </mat-card>
    <mat-card *ngIf="view == 'show-production-orders'">
      <button mat-icon-button style='float: right;' (click)="toView('')">
        <mat-icon class="md-24">close</mat-icon>
      </button>
      <br>
      <system-lookup lookupName="searchProductionOrders" (onSelected)="onSelectProductionOrder($event)"></system-lookup>
    </mat-card>
  `,
})

export class InventoryProductionRunsPage implements OnInit{
  @ViewChild('productionOrderInput') productionOrderInput: ElementRef;
  @ViewChild("productionRunWorkersLookup") productionRunWorkersLookup;
  @ViewChild("productionRunWorkerLaborDetailLookup") productionRunWorkerLaborDetailLookup;
  productionRunWorkerLaborDetailLookupData: any;
  productionRunWorkersLookupData: any;
  productionOrderNumber: number = null;
  productionOrder: ProductionOrder;
  productionRun: ProductionRun;
  selectedWorker: any;
  productionRunQty: number;
  productName: string;
  showLoginButton: boolean = true;
  orderStatus: string;
  runStatus: string;
  orderQty = 0;
  orderQtyStr;
  orderQtyRemaining = 0;
  productionRunsDetailsPickingLookupData = {};
  note: any = '';

  notes = [
    {
      user: "Guofu Huang",
      createdAt: new Date(),
      message: "test message "
    },
    {
      user: "Guofu Huang",
      createdAt: new Date(),
      message: "test message 2"
    }
  ]
  runStatuses = [
    {
      prop: "new",
      name: "New",
      isDisabled: true
    },
    {
      prop: "running",
      name: "Running",
      isDisabled: true
    },
    {
      prop: "paused",
      name: "Paused",
      isDisabled: true
    },
    {
      prop: "canceled",
      name: "Canceled",
      isDisabled: false
    },
    {
      prop: "complete",
      name: "Complete",
      isDisabled: false
    }
  ];

  orderStatuses = [
    {
      prop: "new",
      name: "New",
      isDisabled: true
    },
    {
      prop: "staged",
      name: "Staged",
      isDisabled: false
    },
    {
      prop: "inProgress",
      name: "In Progress",
      isDisabled: false
    },
    {
      prop: "open",
      name: "Open",
      isDisabled: true
    },
    {
      prop: "canceled",
      name: "Canceled",
      isDisabled: false
    },
    {
      prop: "complete",
      name: "Complete",
      isDisabled: false
    }
  ];

  createdUser: User;

  view = "";

  tabIndex = 0;


  constructor(private router: Router,
              private route: ActivatedRoute,
              private dialog: MatDialog,
              private _service: NotificationsService,
              private _systemLogService: SystemLogsService
  ) {}

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.productionOrderInput) {
        this.productionOrderInput.nativeElement.focus();
      }
    }, 0);
  }

  ngOnInit() {
    this.route.params.pipe(
      tap((params) => {
        if ('view' in params) {
          this.view = params.view;
        } else {
          this.view = '';
        }
      })
    )
      .subscribe();

    this.route.queryParams.pipe(
      /*
       1. get tabIndex, productionOrderId
      */
      switchMap(queryParams => {
        this.init();

        if ('tabIndex' in queryParams) {
          this.tabIndex = Number(queryParams.tabIndex);
        }
        if ('productionOrderId' in queryParams) {
          this.selectedWorker = null;
          this.productionRunsDetailsPickingLookupData = {
            productionOrderId: queryParams.productionOrderId
          };

          return this._findOrder$(queryParams.productionOrderId);
        } else {
          return of(null);
        }
      }),
      /*
      load production order, if no productionOrderId, then init
       */
      switchMap((order) => {
        if (order) {
          return this._loadProductionOrder$(order._id);
          // this.productionOrder = new ProductionOrder(order);
          // this.orderStatus = this.productionOrder.status;
          // this.productionOrderNumber = this.productionOrder.number;
          // this.orderQty = this.productionOrder.productionQty;
        } else {
          this.init();
          return of(order);
        }
      }),
      /*
      if order exists, load productionRun
       */
      // switchMap((order) => {
      //   if (order) {
      //     console.log('here1');
      //
      //     return this._loadProductionRun$(order);
      //   } else {
      //     return of(null);
      //   }
      // }),
      switchMap(() => {
        if (this.productionOrder) {
          return this._findProductName$();
        } else {
          return of(null);
        }
      }),
      switchMap(() => {

        if (this.productionOrder) {
          return this._findOrderUser$()
        } else {
          return of(null)
        }
      }),
      switchMap(() => {
        if (this.productionOrder) {
          return this._calculateRemaining$();
        } else {
          return of(null);
        }
      })
    ).subscribe(res => {
    })
  }





  init() {
    this.productionOrder = null;
    this.productionRun = null;
    this.productionOrderNumber = null;
    this.orderQty = 0;
    this.orderStatus = null;
    this.selectedWorker = null;
    this.productionRunWorkersLookupData = null;

    this.productionRunWorkerLaborDetailLookupData = null;
  }

  _findProductName$() {
    return MeteorObservable.call('findOne', 'products', {_id: this.productionOrder.productId})
      .pipe(
        tap((res:any) => {
          if (res) {
            this.productName = res.name;
          }
        }),
      )
  }

  _addNote$(note) {
    this.productionRun._addNote$(note)
      .pipe(switchMap((res) => {
        if (res) {
          this.productionRun.notes.push(note);
        } else {
          return of(null);
        }
      }))
      .subscribe(res => {

      })
  }

  _loadNotes$() {
    this.productionRun._loadNotes$()
      .subscribe(res => {
      });
  }

  _findOrderUser$() {
    return MeteorObservable.call('findOne', 'users', {_id: this.productionOrder.createdUserId})
      .pipe(
        tap((res:any) => {
          if (res) {
            this.createdUser = res;
          }
        })
      )
  }

  _calculateRemaining$() {
    return this.productionRun._calculateRemaining$()
      .pipe(
        tap(res => {
          if (res) {
            this.orderQtyRemaining = res;
          } else {
            this.orderQtyRemaining = 0;
          }
          this.orderQtyStr = `${this.orderQty - this.orderQtyRemaining} of ${this.orderQty}`;
        })
      )
  }

  _findOrder$(productionOrderId) {
    return MeteorObservable.call('findOne', 'productionOrders', {_id: productionOrderId});
  }

  _loadProductionRun$(orderId) {
    return this.route.queryParams
      .pipe(
        take(1),
        /*
        if productionRunId exists, load it, else try to find a existing run.
         */
        switchMap((queryParams) => {
          if ('productionRunId' in queryParams) {
            return MeteorObservable.call('findOne', 'productionRuns', {_id: queryParams.productionRunId})
          } else {
            let query = {
              productionOrderId: orderId,
              status: {
                $in: ["New", "Running", 'Paused']
              }
            };
            return MeteorObservable.call('findOne', 'productionRuns', query)
          }
        }),

        /*
        if can find the run, load it, else insert a new run
         */
        switchMap(run => {
          if (run) {
            return of(run);
          } else {
            let newRun = {
              ...templateObj(),
              productionOrderId: this.productionOrder._id,
              productionQty: 0,
              tenantId: Session.get('tenantId'),
              workers: [],
              status: 'New',
              createdAt: new Date()
            };
            return of('start')
              .pipe(
                switchMap(() => {
                  return ProductionRun._Insert$(newRun);
                }),
                switchMap(((res:any) => {
                  this.productionOrder.status = 'In Progress';
                  return this.productionOrder._save$();
                })),
                map(res => {
                  if (res) {
                    return newRun;
                  } else {
                    return null;
                  }
                })
              );
          }
        }),
        /*
        get the run, and load it
         */
        map((run:any) => {
          this.productionRun = new ProductionRun(run);
          EventEmitterService.Events.emit({
            pageHeader: `Production Run > ${this.productionOrder.number}`
          });

          this.productionRunWorkersLookupData = {
            productionRunId: this.productionRun._id,
            startDay: moment().startOf('day').toDate(),
            endDay: moment().endOf('day').toDate()
          };
          this.runStatus = this.productionRun.status;
          let userIds = [];
          if ('notes' in this.productionRun) {
            let notes = this.productionRun.notes;
            notes.forEach(note => {
              userIds.push(note.createdUserId);
            });
          }
          return userIds;
        }),
        switchMap((userIds) => {
          let pipeline = [
            {
              $match: {
                _id: {
                  $in: userIds
                }
              }
            },
            {
              $project: {
                firstName: "$profile.firstName",
                lastName: "$profile.lastName"
              }
            }
          ]
          return MeteorObservable.call('runAggregate', 'users', pipeline)
        }),
        tap((res: any) => {
          if (res && res.length > 0) {
            this.productionRun.notes.map((_note:any) => {
              let findUser = res.find(_temp => _temp._id == _note.createdUserId);
              _note.user = findUser.firstName + " " + findUser.lastName;
            })
          }
        })
      )
  }

  onProductionOrderNumberChange() {
    // find production order
    MeteorObservable.call('findOne', 'productionOrders', {number: this.productionOrderNumber})
      .pipe(
        switchMap((res: ProductionOrderModel) => {
          if (res) {
            // if can find the production order

            return this._loadProductionOrder$(res._id)



            // this.productionOrder = new ProductionOrder(res);
            // this.orderQty = this.productionOrder.productionQty;
            // return of('start')
            //   .pipe(
            //     // switchMap(() => {
            //     //   if (this.productionOrder.status == 'New') {
            //     //     this.productionOrder.status = 'Staged';
            //     //     return this.productionOrder._saveStatus$(this._systemLogService.systemLog)
            //     //   } else {
            //     //     return of(null);
            //     //   }
            //     // }),
            //     switchMap(() => {
            //       return this._findProductionRun$(res)
            //     }),
            //     tap((res) => {
            //       if (res) {
            //         this.router.navigate([], {queryParams: {productionOrderId: this.productionOrder._id}, queryParamsHandling: 'merge'});
            //       }
            //     })
            //   );
          } else {
            // if can not find production order,
            EventEmitterService.Events.emit({
              componentName: "dashboard",
              name: "error",
              title: "No production order found"
            });

            return of(null);
          }
        }),
        tap(res => {
          if (res) {
            this.router.navigate([], {queryParams: {productionOrderId: this.productionOrder._id}, queryParamsHandling: 'merge'});
          }
        })
      )
      .subscribe((res: any) => {
      })
  }

  _findProductionRun$(res) {
    return MeteorObservable.call('findOne', 'productionRuns', {productionOrderId: res._id})
      .pipe(
        switchMap((res: ProductionRunModel) => {
          // if find production run
          if (res) {
            return of(res);
          } else {
            // if can not find production run
            let productionRunModel: ProductionRunModel = {
              _id: Random.id(),
              productionOrderId: this.productionOrder._id,
              productionQty: this.productionOrder.productionQty,
              createdUserId: Meteor.userId(),
              tenantId: Session.get('tenantId'),
              status: 'New'
            }
            return ProductionRun._Insert$(productionRunModel)
          }
        })
      )
  }

  onClickWorker(event) {
    let row = event.value;
    let dirtyRows = this.productionRunWorkersLookup._getDirtyRows();
    dirtyRows.forEach(_row => _row.highlightRow = null);
    row.highlightRow = true;
    if (!this.selectedWorker) {
      this.productionRunWorkerLaborDetailLookupData = {
        selectedWorkerId: row._id,
        productionRunId: this.productionRun._id
      };
      this.selectedWorker = row;
    } else if (this.selectedWorker._id != row._id) {
      this.selectedWorker = row;
      this.productionRunWorkerLaborDetailLookupData = {
        selectedWorkerId: row._id,
        productionRunId: this.productionRun._id
      };
    }
  }

  selectFirstRow(lookup, tabIndex){
    if (this.tabIndex == tabIndex) {
      let dirtyRows = this[lookup]._getDirtyRows();      
      this.onClickWorker({value: dirtyRows[0]})
    }
  }

  clockIn() {
    if (this.productionRun && this.selectedWorker) {
      let findWorker:any = this.productionRun.workers.find(_worker => _worker._id == this.selectedWorker._id);

      if (findWorker) {
        if ('days' in findWorker) {
          let latestDate = findWorker.days[0];
          if (moment().isSame(latestDate.date, 'day')) {
            // is same day?
            if (latestDate && 'times' in latestDate) {
              let latestTime = latestDate.times[0];
              if (!latestTime || 'loggedOut' in latestTime) {
                let newLaborTime:any = templateObj();
                newLaborTime.loggedIn = new Date();
                latestDate.times.unshift(newLaborTime);
                this.productionRun.status = 'Running';
              }
            }

          } else {
            // not same day
            let newDay = {
              ...templateObj(),
              date: new Date(),
              times: [
                {
                  ...templateObj(),
                  loggedIn: new Date()
                }
              ]
            };
            findWorker.days.unshift(newDay);

            this.productionRun.status = 'Running';
          }
        } else {
          let newLaborDate: any = templateObj();
          let newLaborTime: any = templateObj();
          newLaborTime.loggedIn = new Date();
          newLaborDate.times = [newLaborTime];
          newLaborDate.date = new Date();
          findWorker.days = [newLaborDate];
          this.productionRun.status = 'Running';
        }


        this.productionRun._save$()
          .subscribe(res => {
            this.afterClockInAndOut();
          })

      } else {
        // // no worker is found, add new worker to this productionRun
        // findWorker = {
        //   _id: this.selectedWorker._id,
        //   createdUserId: Meteor.userId(),
        //   createdAt: new Date(),
        //   cost: 0,
        //   days: [{
        //     ...templateObj(),
        //     date: new Date(),
        //     times: [
        //       {
        //         ...templateObj(),
        //         loggedIn: new Date()
        //       }
        //     ]
        //   }]
        // };
        // this.productionRun.workers.push(findWorker);
        // // this.productionRun._save$()
        // //   .subscribe(res => {
        // //     this.productionRunWorkerLaborDetailLookup.reloadData("reload");
        // //     this.showLoginButton = false;
        // //   })
      }
    }
    this.resetWorker();
  }

  afterClockInAndOut() {
    this.productionRunWorkerLaborDetailLookup.reloadData("reload");
    this.productionRunWorkersLookup.reloadData("reload");
  }

  clockOut() {
    if (this.productionRun && this.selectedWorker) {
      let findWorker:any = this.productionRun.workers.find(_worker => _worker._id == this.selectedWorker._id);
      if (findWorker) {
        if ('days' in findWorker) {
          let latestDate = findWorker.days[0];
          let latestTime = latestDate.times[0];

          latestTime.loggedOut = new Date();
          let isLastLoggedOut:boolean = true;
          this.productionRun.workers.forEach(_worker => {
            if ('days' in _worker) {
              if (moment(_worker.days[0].date).isSame(new Date(), 'day')) {
                // is today
                let latestTime = _worker.days[0].times[0];
                if ('loggedIn' in latestTime && !('loggedOut' in latestTime)) {
                  isLastLoggedOut = false;
                }
              }
            }
          });

          if (isLastLoggedOut) {
            this.productionRun.status = 'Paused';
          }
          this.productionRun._save$()
            .subscribe(res => {
              this.afterClockInAndOut();
              this.showLoginButton = false;
            });
        }
      } else {
        this._service.error(
          'Failed',
          "This worker is not logged in"
        )
      }
    }
    this.resetWorker();
  }

  showAddWorkerList() {
    this.view = 'add-worker';
    this._getQueryParams$()
      .subscribe(
        (queryParams) => {
          this.router.navigate(['./', {view: "add-worker"}], {queryParams, relativeTo: this.route});
        }
      )
  }

  _getQueryParams$() {
    return this.route.queryParams.pipe(take(1));
  }
  onAddWorker(event) {
    if (this.productionRun) {
      if (!('workers' in this.productionRun)) {
        this.productionRun.workers = [];
      }

      let findWorker = this.productionRun.workers.find(_worker => _worker._id == event.value._id);
      if (!findWorker) {
        let newWorker = {
          _id: event.value._id,
          cost: 0,
          createdUserId: Meteor.userId(),
          createdAt: new Date()
        };
        this.setSelectWorker(newWorker);
        this.productionRun.workers.push(newWorker);
        this.productionRun._save$()
          .subscribe(res => {
            if (res){
              let queryParams:any = {};
              if (this.productionOrder) {
                queryParams.productionOrderId = this.productionOrder._id;
              }
              if (this.tabIndex != null) {
                queryParams.tabIndex = this.tabIndex;
              }

              this._getQueryParams$()
                .subscribe(
                  (queryParams) => {
                    this.router.navigate(['./', {view: ""}], {queryParams, relativeTo: this.route});
                  }
                )
            }
          })
      } else {
        EventEmitterService.Events.emit({
          componentName: "dashboard",
          name: "error",
          title: "Duplicate Worker"
        });
      }
    }
  }

  onTabIndexChange(index) {
    this._getQueryParams$()
      .subscribe(
        (queryParams:any) => {
          let params = Object.assign({}, queryParams);
          params.tabIndex = index;
          this.router.navigate([], {queryParams: params, relativeTo: this.route});
        }
      )
  }

  onTimeLogComplete(event) {
    let dirtyRows = this.productionRunWorkerLaborDetailLookup._getDirtyRows();
    let latestDate = dirtyRows[0];
    dirtyRows.forEach(_row => {
      let minutes = Number(_row.minutes) % 60;
      let hour =  Math.floor((_row.minutes) / 60);
      _row.minutes = `${hour} hours, ${Math.floor(minutes)} minutes`;
      if(this.productionRun && this.productionRun.status == 'Complete') {
        _row.disabled = true;
      }
    })
    if (latestDate && moment().isSame(latestDate.date, "day")) {
      let latestTime = latestDate.times[0];
      if (!latestTime || 'loggedOut' in latestTime) {
        this.showLoginButton = true;
      } else {
        this.showLoginButton = false;
      }
    } else {
      this.showLoginButton = true;
    }
  }

  onTimeLogSelect(event) {
    let row = event.value;
    let arr = [
      "Logged In",
      "Logged Out"
    ];
    let activities = [];
    let i = 0;
    row.times.forEach(_time => {
      i++;
      if (_time.loggedIn) {
        activities.push(moment(_time.loggedIn).format('hh:mm A'));
      }
      if (_time.loggedOut) {
        activities.push(moment(_time.loggedOut).format('hh:mm A'));
      } else {
        activities.push("");
      }
    });
    row.expandableData = [...arr, ...activities];
  }

  resetWorker() {
    // this.selectedWorker
    // let findRow = this.productionRunWorkersLookup._getDirtyRows().find(_row => _row._id == this.selectedWorker._id);
    // findRow.backgroundColor = null;
    // this.selectedWorker = null;
  }

  searchProductionOrders() {
    this._getQueryParams$()
      .subscribe(
        (queryParams) => {
          this.router.navigate(['./', {view: "show-production-orders"}], {queryParams, relativeTo: this.route});
        }
      )
  }

  onRunStatusChange(event) {
    switch(event.value) {
      case 'Canceled':
        let dialogRef = this.dialog.open(DialogSelect, {
          data: {
            question: "This CANNOT be undone. Are you sure you want to cancel the Production Run?",
            yes: "Yes",
            no: "No"
          }
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result.value) {
            this.productionRun.status = event.value;

            this.productionRun._saveStatus$()
              .pipe(
                switchMap((res) => this._loadProductionOrder$(this.productionRun.productionOrderId))
              )
              .subscribe(() => {
                this.router.navigate([]);
              });
          } else {
            this.runStatus = this.productionRun.status;
          }
        });

        break;
      case 'Complete':
        let qty = 0;
        this.productionRun.workers.forEach(_worker => {
          _worker.days.forEach(_day => {
            qty = qty + _day.productionQty
          })
        });

        let config:any = {
          data: {
            question: "This CANNOT be undone. Are you sure you want to complete the Production Run?",
            template: "",
            yes: "Yes",
            no: "No"
          }
        };
        if (this.orderQtyRemaining > 0) {
          config.data.template = "enableCompleteOrder";
        }
        dialogRef = this.dialog.open(DialogSelect, config);
        dialogRef.afterClosed().subscribe((result) => {

          if (result.value) {
            this.productionRun.status = 'Complete';
            let enableCompleteOrder = false;
            if (this.orderQtyRemaining > 0) {
              enableCompleteOrder = result.options.enableCompleteOrder;
            } else
              enableCompleteOrder = true;
            this.productionRun._completeRun$(this._systemLogService.systemLog, enableCompleteOrder)
              // .pipe(
              //   switchMap((res) => this._loadProductionOrder$(this.productionOrder._id)),
              // )
              .subscribe(() => {
                this.init();
                this.router.navigate([]);
              });
          } else {
            this.runStatus = this.productionRun.status;
          }
        });
        break;
      case 'Staged':
        this.productionRun.status = event.value;
        this.productionRun._saveStatus$()
          .pipe(
            switchMap((res) => this._loadProductionOrder$(this.productionOrder._id))
          )
          .subscribe();
        break;
      default:
        break;
    }
  }

  _loadProductionOrder$(productionOrderId) {
    return of('start')
      .pipe(
        switchMap(() => {
          if (productionOrderId) {
            return ProductionOrder._FindOne$({_id: productionOrderId});
          } else {
            return of(null);
          }
        }),
        switchMap(res => {
          this.productionOrder = new ProductionOrder(res);
          if (res.status == 'New') {
            this.productionOrder.status = 'Staged';
            return this.productionOrder._saveStatus$(this._systemLogService.systemLog)
              .pipe(
                switchMap(() => {
                  this.productionOrder.status = 'In Progress';
                  return this.productionOrder._saveStatus$(this._systemLogService.systemLog);
                })
              );
          } else if (res.status == 'Complete'){

            return of(null);
          } else if (res.status == 'Canceled') {
            return of(null);
          } else if (res.status == 'Staged') {
            this.productionOrder.status = 'In Progress';
            return this.productionOrder._save$();
          } else if (res.status == 'In Progress') {
            return of(this.productionOrder);
          }
        }),
        tap(() => {
          if (this.productionOrder) {
            this.orderStatus = this.productionOrder.status;
            this.productionOrderNumber = this.productionOrder.number;
            this.orderQty = this.productionOrder.productionQty;
          } else {
            this.init();
          }
        }),
        switchMap(res => {
          if (this.productionOrder) {
            return this._loadProductionRun$(this.productionOrder._id);
          } else {
            return of(null);
          }
        })

      )
  }

  onTimeLogEvents(event) {
    if (event.name == 'onNumberChange') {
      let qty = event.value.row.qty;
      let row = event.value.row;
      row.qty = qty;
      let findWorker = this.productionRun.workers.find(_worker => _worker._id == this.selectedWorker._id);
      let findDate = findWorker.days.find(_day => moment(_day.date).isSame(row.date, 'day'));
      findDate.productionQty = qty;

      let originRows:any = this.productionRunWorkerLaborDetailLookup._getPristineRows();
      let findOriginRow = originRows.find(_row => _row._id == row._id);
      if ((this.orderQtyRemaining + findOriginRow.qty - qty) < 0) {
        this._service.error(
          'Error',
          `The max qty is ${this.orderQtyRemaining + findOriginRow.qty}`
        )
      } else {
        this.productionRun._save$()
          .pipe(
            switchMap((res:any) => {
              if (res) {
                return this._calculateRemaining$();
              } else {
                return of(null);
              }
            })
          )
          .subscribe(() => {
            findOriginRow.qty = qty;
          });
      }
    }
  }

  onSelectProductionOrder(event) {
    this.router.navigate(["./", {view: ""}], {queryParams: {productionOrderId: event.value._id}, relativeTo: this.route});
  }

  onWorkersListComplete(event) {
    // console.log('hit',event);
    

    let dirtyRows = this.productionRunWorkersLookup._getDirtyRows();

    dirtyRows.forEach(_row => {
      if (_row.status == 'loggedIn') {
        _row.backgroundColor = 'green';
      } else {
        _row.backgroundColor = 'red';
      }
    });

    if (this.selectedWorker) {
      let findRow = dirtyRows.find(_row => _row._id == this.selectedWorker._id);
      if (findRow) {
        findRow.highlightRow = true;
      }
    }
  }

  setSelectWorker(worker) {
    this.selectedWorker = worker;

    if (this.productionRunWorkerLaborDetailLookupData) {
      this.productionRunWorkerLaborDetailLookupData.selectedWorkerId = worker._id;
    } else {
      this.productionRunWorkerLaborDetailLookupData = {
        selectedWorkerId: worker._id,
        productionRunId: this.productionRun._id
      }
    }
  }

  addNote() {
    let note: Note = {
      _id: Random.id(),
      createdAt: new Date(),
      createdUserId: Meteor.userId(),
      message: this.note
    }

    if (this.productionRun) {
      this.productionRun._addNote$(note)
        .pipe(
          switchMap((res) => {
            if (res) {
              this.note = "";
              return this._loadProductionRun$(this.productionOrder);
            } else {
              return of(null);
            }
          })
        )
        .subscribe(res => {
        })
    } else {
      this.note = '';
      this._service.warn(
        "No production run found"
      )
    }
  }

  editNote(note) {
    let findIndex = this.productionRun.notes.findIndex(_note => _note._id == note._id);
    this.productionRun.notes[findIndex].isEdit = true;
  }

  deleteNote(note) {

    let dialogRef = this.dialog.open(DialogSelect, {
      data: {
        question: "This CANNOT be undone. Are you sure you want to delete this note?",
        yes: "Yes",
        no: "No"
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.value) {
        let findIndex = this.productionRun.notes.findIndex(_note => _note._id == note._id);
        this.productionRun.notes.splice(findIndex, 1);
        this.productionRun._save$()
          .subscribe();
      } else {
      }
    });
  }

  saveEditNote(note, event) {
    delete note.isEdit;
    note.message = event.target.value;
    note.updatedAt = new Date();
    this.productionRun._save$()
      .pipe(switchMap( () => this._loadProductionRun$(this.productionOrder)))
      .subscribe();
  }

  toView(view) {
    this._getQueryParams$()
      .subscribe(
        (queryParams) => {
          this.router.navigate(['./', {view}], {queryParams, relativeTo: this.route});
        }
      )
  }

  onWorkersListEvent(event) {
    if (event.name == 'actions.remove') {
      let dialogRef = this.dialog.open(DialogSelect, {
        data: {
          question: "Are you sure you want to delete this worker?",
          yes: "Yes",
          no: "No"
        }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result.value) {
          let findIndex = this.productionRun.workers.findIndex(_worker => _worker._id == event.value.row._id);
          this.productionRun.workers.splice(findIndex, 1);
          this.productionRun._save$()
            .subscribe(() => {
              this.productionRunWorkersLookup.reloadData('reload');
            });

        } else {
          this.runStatus = this.productionRun.status;
        }
      });
    }
  }
}
