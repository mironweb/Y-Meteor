import { Component, ViewChild, OnInit, OnChanges, EventEmitter, Output, OnDestroy} from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd, Params} from "@angular/router";
import { MatMenuTrigger } from '@angular/material'
import {SystemOptionsService} from "../../../services/SystemOptions.service";
import { EventEmitterService } from "../../../services";
import {Subscriber} from "rxjs/Subscriber";
import * as pdfFuncs from '../../../../../both/functions/overviewReport';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

@Component({
  selector: `dashboard-report`,
  template: `
  <div class="float-right" style="padding: 10px; position: fixed; right: 0px; top: 50px;">
    <button mat-raised-button 
      *ngIf='returnFilteredArray(reportArray).length > 0'
      matBadge="{{returnFilteredArray(reportArray).length}}" 
      [matBadgeHidden]="returnFilteredArray(reportArray).length == 0" 
      matBadgeColor="accent" 
      style='float: right; height: 30px; line-height: 30px; margin-right: 5px;' 
      [matMenuTriggerFor]="menu"
      #menuTrigger="matMenuTrigger"
      >
      Selected Cards
    </button>
    <mat-menu #menu="matMenu">
      <span
        (mouseleave)="closeMenu()"
        (click)="$event.stopPropagation()">
        <mat-checkbox class="mat-menu-item" *ngFor="let report of reportArray" 
        [(ngModel)]="report.selected">{{report.title}}</mat-checkbox>
        <button style='width: 100%' mat-raised-button class="mat-primary fill" (click)='generateReport()'>
          Generate Report
        </button>
      </span>
    </mat-menu>
  </div>
  `,
  styles: [ 'dashboardReport.scss' ]
})

export class DashboardReportComponent implements OnInit, OnChanges, OnDestroy {
  @Output() showDashboardHeader = new EventEmitter<any>();
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  eventSubscriber: Subscriber<any>;
  hookedEvent: boolean = false;
  reportArray: Array<any> = [];
  constructor(private _router: Router, private _route: ActivatedRoute,
              private systemOptionsService: SystemOptionsService) 
              {pdfFonts.pdfMake}

  ngOnInit() {
    this.hookEvents();
  }

  hookEvents() {
    this.eventSubscriber = EventEmitterService.Events.subscribe(res => {
      if (res.name == 'overviewReport') {
        console.log('overviewReport', res)
        this.handleData(res);
      }
      if (res.name == 'execReport') {
        this.generateReport();
      }
    })
    
  }

  closeMenu() {
    this.trigger.closeMenu();
  }

  handleData(result) {
    let index = this.reportArray.findIndex(report => report.name === result.value.name);
    console.log('index', index);
    if (index > -1) {
      console.log(result[index])
      this.reportArray[index].selected = true;
      // this.reportArray.splice(index, 1);
    } else {
      result.value.selected = true;
      this.reportArray.push(result.value);
    }

    console.log(this.reportArray);
  }

  returnFilteredArray(arr){
    return arr.filter(el => el.selected == true)
  }

  async generateReport() {
    console.log('REPORT',this.reportArray)
    
    let pdf = await pdfFuncs.reportPdf(this.returnFilteredArray(this.reportArray));
    pdfMake.createPdf(pdf).open();
  }


  onAbsoluteUrlChange() {
    // let pageHeader = this.systemOptionsService.getPageheader();
  }

  ngOnChanges(changes) {
    console.log(changes)
  }

  ngOnDestroy() {
    this.eventSubscriber.unsubscribe();
  }
}