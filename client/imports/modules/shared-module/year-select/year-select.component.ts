import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import * as systemConfig from '../../../../../both/config/systemConfig';
import * as funcs from '../../../../../both/functions/common';

@Component({
  selector: 'year-select',
  template: `
    <mat-select placeholder="Year To Date:" name="year" [(ngModel)]="selectedYear">
      <mat-option *ngFor="let year of years" [value]="year">
        {{year}}
      </mat-option>
    </mat-select>
  `
})

export class YearSelectComponent implements OnInit{
  years = systemConfig.years;
  selectedYear: number;

  constructor(private router: Router, private route: ActivatedRoute){ }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      let url:any = funcs.parseUrlParams(params);
      Object.keys(url).forEach(key => {
        if (key == 'startYear') {
          this.selectedYear = Number(url[key]);
        }
      });
    });
  }
}