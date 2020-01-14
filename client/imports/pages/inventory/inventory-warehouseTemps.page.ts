import {Component, OnInit} from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from "@angular/material";
import {NotificationsService} from "angular2-notifications";
import {ProductionRun, ProductionRunModel} from "../../../../both/models/productionRun.model";
import {MeteorObservable} from "meteor-rxjs";
import {ProductionOrder, ProductionOrderModel} from "../../../../both/models/productionOrder.model";
import {switchMap, take, tap} from "rxjs/operators";
import {of} from "rxjs";
import {Random} from "meteor/random";

@Component({
  selector: 'inventory-warehouse-temps',
  template: `
    <mat-card>
      <filterBox-component [lookupName]="'warehouseTempUsers'"></filterBox-component>

      <system-lookup lookupName="warehouseTempUsers" (onSelected)="onSelected($event)"></system-lookup>
    </mat-card>
  `,
})

export class InventoryWarehouseTempsPage implements OnInit{
  productionOrderNumber: number = null;
  productionOrder: ProductionOrder;
  productionRun: ProductionRun;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private dialog: MatDialog,
              private _service: NotificationsService
  ) {}

  ngOnInit() {

  }

  onSelected(event) {
    console.log('eent', event);
    if (event.name == 'onClickRow') {
      this.router.navigate(['./' + event.value._id], {relativeTo: this.route});
    }
  }
}
