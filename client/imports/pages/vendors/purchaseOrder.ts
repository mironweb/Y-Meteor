import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from '@angular/router';
import { MeteorObservable } from "meteor-rxjs";
import { switchMap, tap } from "rxjs/operators";

@Component({
  selector: 'purchase-order',
  styleUrls: ['vendors.scss'],
  template: `    
    <mat-card>
      <div class="fontSize floatLeft" [ngStyle.xs]="{'width':'100%'}" [ngStyle.sm]="{'width':'100%'}">
        <strong>Vendor: </strong> <span class="floatRight"> {{order.vendor.name }}</span>
        <br>
        <strong><span class="floatLeft">Order Total:</span></strong>
        <span class="floatRight" *ngIf="order.orderTotal"> {{order.orderTotal.toString() | currency:'USD':'symbol':'1.2-2'}}</span>
      </div>
      <div class="fontSize floatRight" [ngStyle.xs]="{'float':'left', 'width':'100%'}" [ngStyle.sm]="{'float':'left', 'width':'100%'}">
        <strong>Order Number: </strong> <span class="floatRight">{{order.number}}</span>
        <br>
        <strong>Order Date: </strong> <span class="floatRight">{{order.date | date:'fullDate'}}</span>
        <br>
        <strong>Type: </strong> <span class="floatRight">{{order.type}}</span>
        <br>
      </div>
      <div style="clear: both; margin-bottom: 10px;" class="floatLeft">
        <strong>Purchase Address:</strong>
        <br>
        <span>{{order.purchaseFromName}}</span>
        <br>
        <span>{{order.purchaseFromAddress1}}</span>
        <br>
        <span *ngIf="order.purchaseFromAddress2">{{order.purchaseFromAddress2}}</span>
        <br *ngIf="order.purchaseFromAddress2">
        <span *ngIf="order.purchaseFromAddress3">{{order.purchaseFromAddress3}}</span>
        <br *ngIf="order.purchaseFromAddress3">
        <span>{{order.purchaseFromCity}}, {{order.purchaseFromState}}</span>
        <br>
        <span>{{order.purchaseFromZipCode}}</span>
        <br>
      </div>
      <strong> </strong>
      <div style="clear: both;" class="floatLeft">
        <strong>Ship To Address:</strong>
        <br>
        <span>{{order.shipToName}}</span>
        <br>
        <span>{{order.shipToAddress1}}</span>
        <br>
        <span *ngIf="order.shipToAddress2">{{order.shipToAddress2}}</span>
        <br *ngIf="order.shipToAddress3">
        <span *ngIf="order.shipToAddress2">{{order.shipToAddress3}}</span>
        <br *ngIf="order.shipToAddress3">
        <span>{{order.shipToCity}}, {{order.shipToState}}</span>
        <br>
        <span>{{order.shipToZipCode}}</span>
        <br>
      </div>

      <div style="clear: both;">
        <div fxLayout="row" fxLayoutAlign="space-between center">
          <filterBox-component fxFlex='100' [lookupName]="'purchaseOrder'"></filterBox-component>
        </div>
        <section id="customerOrder">
          <system-lookup [lookupName]="'purchaseOrder'" [isModal]="false" (onSelected)="onSelect($event)" [documentId]="documentId"></system-lookup>
        </section>
      </div>
    </mat-card>  
  `
})

export class PurchaseOrder implements OnInit {
  documentId: string;
  order: any = {
    vendor: {}
  };
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    this.activatedRoute.params
      .pipe(
        tap((params) => {
          this.documentId = params['documentId'];
        }),
        switchMap((params) => this.findVendor(params))
      )
      .subscribe((orders) => {
        if (orders[0]) {
          this.order = orders[0];
          let total = new Decimal(0);
          this.order.lineItems.forEach(item => {
            total = total.plus(item.total);
          });
          this.order.orderTotal = total;
        }
    })
  }

  findVendor(params) {
    return MeteorObservable.call('runAggregate', 'vendorOrders', this.getPipeline());
  }

  onSelect(e) {

  }

  getPipeline() {
    return [
      {
        $match: {
          _id: this.documentId
        }
      },
      {
        $lookup: {
          from: "vendors",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendor"
        }
      },
      {
        $unwind: "$vendor"
      },
      {
        $addFields: {
          lineItems: {
            $map: {
              input: "$lineItems",
              as: "row",
              in: {
                $mergeObjects: [
                  "$$row",
                  { total: { $toDouble: "$$row.total" } },
                ],
              },
            },
          },
        },
      },
    ];
  }
}