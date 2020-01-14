import {Component, OnInit, ViewChild} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { NotificationsService } from 'angular2-notifications';
import {MatDialog, MatSidenavModule} from '@angular/material';

import {FilterDialogComponent} from '../../modules/shared-module/filterDialog/filterDialog.component';

import {ActivatedRoute, Router} from '@angular/router';
import moment = require("moment");
import {take} from "rxjs/operators";

@Component({
  selector: 'inventory-work-order-release',
  template: `    
    <mat-card>
      <mat-form-field>
        <input matInput [matDatepicker]="picker" (dateChange)="onDateChange($event)" placeholder="Forecast Date" [value]="endDate">
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
      <mat-form-field style="width: 300px">
        <input matInput  placeholder="Forecast Change Percent" type="number" value="0.00" (change)="onForecastPercentChange($event)">
      </mat-form-field>

      <filterBox-component lookupName="workOrderRelease"></filterBox-component>
      <system-lookup #lookup lookupName="workOrderRelease" [data]="data" (onSelected)="onSelect($event)"></system-lookup>
    </mat-card>
  `
})

export class InventoryWorkOrderReleasePage implements OnInit {

  @ViewChild('lookup') lookup;

  endDate: Date;
  forecastStartDate: Date;
  forecastEndDate: Date;
  
  data:any = {
    forecastPercent: 1
  };
  constructor(private route: ActivatedRoute,
              private router: Router
  ) {
    this.endDate = moment().add(30, 'day').endOf('day').toDate();
    this.forecastStartDate = moment().subtract(1,'year').startOf('day').toDate();
    this.forecastEndDate = moment().subtract(1, 'year').add(30, 'day').endOf('day').toDate();

    this.data.endDate = this.endDate;
    this.data.forecastStartDate = this.forecastStartDate;
    this.data.forecastEndDate = this.forecastEndDate;
  }

  ngOnInit() {
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      Object.assign(this.data, params);
      if ('endDate' in params) {
        this.endDate = new Date(params.endDate);
        //this.data.endDate = moment(this.endDate).subtract(1, 'year').toDate();
        this.data.endDate = this.endDate;
      }
    });
  }

  onForecastPercentChange(e) {
    this.data.forecastPercent = 1 + Number(e.target.value)/100;
    let dirtyRows = this.lookup._getDirtyRows();
    let rows = this.lookup._getPristineRows();

    rows.forEach((_row, index) => {
      let qtyOrdered = _row.qtyOnHand - _row.forecast;
      qtyOrdered = qtyOrdered * this.data.forecastPercent;
      dirtyRows[index].forecast = _row.qtyOnHand - qtyOrdered;
    })
    // this.lookup.reloadData('onForecastPercentChange');
  }

  onDateChange(e) {
    this.endDate = moment(e.value).endOf('day').toDate();
    console.log(this.endDate);
    this.data.endDate = this.endDate;
    this.data.forecastEndDate = moment(this.endDate).subtract(1, 'year').toDate();
    this.router.navigate([], {queryParams: {endDate: this.endDate}, queryParamsHandling: 'merge'});
  }

  onSelect(row) {
    this.router.navigate([row.value._id], {relativeTo: this.route, queryParams: {
      endDate: this.endDate
      }});
  }
}
