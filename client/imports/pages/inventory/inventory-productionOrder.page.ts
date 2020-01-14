import { Component, OnInit, Input } from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';
import {MeteorObservable} from "meteor-rxjs";
import {switchMap, take, tap} from "rxjs/operators";
import {ProductionOrder, ProductionOrderModel} from "../../../../both/models/productionOrder.model";
import {of} from "rxjs";
import {EventEmitterService} from "../../services";

@Component({
  selector: 'inventory-production-order',
  template: `
    <mat-card *ngIf="view == ''">
      <div fxLayout="row" fxLayoutGap="10px" *ngIf="productionOrder">
        <mat-form-field>
          <input matInput #productionOrderInput autofocus placeholder="Work Order" [(ngModel)]="productionOrder.number" (change)="onProductionOrderNumberChange()">
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

      <mat-tab-group [selectedIndex]="tabIndex" aria-disabled="true">
        <mat-tab label="Details">
          <div fxLayout="row" style="padding: 20px;">
            <div fxFlex="" fxLayout="column">
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
                  Production Runs
                </mat-card-title>
                <mat-card-content>
                  <system-lookup
                      isModal="true"
                      lookupName="productionRunsOfProductionOrder"
                      (onEvent)="onEvents($event)"
                      [data]="productionRunsOfProductionOrderLookupData"></system-lookup>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
        <mat-tab label="Pick">
          <inventory-work-order-release-detail></inventory-work-order-release-detail>
        </mat-tab>
      </mat-tab-group>
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

export class InventoryProductionOrderPage implements OnInit{

  constructor(private router: Router, private route: ActivatedRoute) {}

  documentId: string;
  productionRunsOfProductionOrderLookupData:any = {};
  productName: string;
  productionOrder: ProductionOrder;
  orderQtyRemaining: number;
  productionOrderNumber: number;
  orderQty: number;
  orderStatus: string = 'New';
  createdUser: any;
  view = '';
  orderQtyStr:string;
  pageHeaderInput: string;
  isNew: boolean = false;
  orderStatuses = [
    {
      prop: "new",
      name: "New",
      isDisabled: true
    },
    {
      prop: "inProgress",
      name: "In Progress",
      isDisabled: false
    },
    {
      prop: "staged",
      name: "Staged",
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

  init() {
    this.productionOrder = null;
    this.productionOrderNumber = null;
    this.orderQty = 0;
    this.orderStatus = null;
    this.productionRunsOfProductionOrderLookupData = null;
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


    // let lineItems =
    this.route.queryParams
      .pipe(
        switchMap((queryParams) => {
          if ('productionOrderId' in queryParams) {
            this.documentId = queryParams.productionOrderId;
            return MeteorObservable.call('findOne', 'productionOrders', {_id: this.documentId})

          }
        }),
        tap(order => {
          if (order) {
            this.productionOrder = new ProductionOrder(order);
            this.pageHeaderInput = "Work Order > " + this.productionOrder.number;
            if (this.productionOrder.status == 'New')  {
              this.isNew = true;
            } else {
              this.isNew = false;
            }
            EventEmitterService.Events.emit( {pageHeader: this.pageHeaderInput});

            this.productionRunsOfProductionOrderLookupData = {
              productionOrderId: this.productionOrder._id
            };
            this.orderStatus = this.productionOrder.status;
            this.productionOrderNumber = this.productionOrder.number;
            this.orderQty = this.productionOrder.productionQty;
          } else {
            this.init();
          }
        }),
        switchMap((res:any) => {
          if (res) {
            return MeteorObservable.call('findOne', 'users', {_id: res.createdUserId});
          } else {
            return of(null);
          }
        }),
        tap(res => {
          if (res)
            this.createdUser = res;
        }),
        switchMap(() => {
          if (this.productionOrder) {
            return this._findProductName$();
          } else {
            return of(null);
          }
        }),
        switchMap(() => {
          if (this.productionOrder) {
            return this._calculateRemaining$();
          } else {
            return of(null);
          }
        })
      )
      .subscribe(res => {


      })
  }

  onEvent(event) {
    // this.router.navigate([`./`], {})
  }

  onSelected(event) {

  }

  searchProductionOrders() {
    this._getQueryParams$()
      .subscribe(
        (queryParams) => {
          this.router.navigate(['./', {view: "show-production-orders"}], {queryParams, relativeTo: this.route});
        }
      )
  }

  _getQueryParams$() {
    return this.route.queryParams.pipe(take(1));
  }

  toView(view) {
    this._getQueryParams$()
      .subscribe(
        (queryParams) => {
          this.router.navigate(['./', {view}], {queryParams, relativeTo: this.route});
        }
      )
  }

  onSelectProductionOrder(event) {
    this.router.navigate(["./", {view: ""}], {queryParams: {productionOrderId: event.value._id}, relativeTo: this.route});
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

  _calculateRemaining$() {
    if (this.productionOrder) {
      return this.productionOrder._calculateRemaining$()
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
  }

  onEvents(event) {
    this.router.navigate(["./inventory/production-runs"], {queryParams: {productionOrderId: event.value.productionOrderId, productionRunId: event.value._id}})
  }
}
