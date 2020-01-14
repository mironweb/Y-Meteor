import { Component, OnInit, ViewChild } from "@angular/core";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Router, Params, ActivatedRoute } from '@angular/router';
import { EventEmitterService } from "../../../../services/index";
import { Subscriber } from "rxjs/Subscriber";

@Component({
  selector: 'accounting',
  templateUrl: 'accounting.page.html',
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class AccountingExecDashboardPage implements OnInit {
  @ViewChild('lookup') lookup;
  @ViewChild('paymentApprovals') paymentApprovals;

  eventSubscriber: Subscriber<any>;
  data: any = {};
  pageHeader: string;
  view: string = 'dashboard';
  lookupData: any = {};
  pageHeaders = {
  }

  constructor(private activatedRoute: ActivatedRoute, private router: Router, ) {
    pdfFonts.pdfMake;
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: Params) => {

      this.pageHeader = (params['view']) ? this.pageHeaders[params['view']] : null;
      if (!this.pageHeader && params['pageHeader']) {
        this.pageHeader = params['pageHeader'];
      }
      EventEmitterService.Events.emit({ pageHeader: this.pageHeader, });
      this.view = (params['view']) ? params['view'] : 'dashboard';
    })
    // this.hookEvents();
  }

  // hookEvents() {
  //   console.log('accounting hook')
  //   this.eventSubscriber = EventEmitterService.Events.subscribe(res => {
  //     console.log('~~~~~',res)
  //   })
  // }

  clearUrlParams() {
    this.router.navigate(["./", {}], { queryParams: {}, relativeTo: this.activatedRoute });
  }

  lookupDataChange(event) {
    switch (event.name) {
      case 'emitMethodName':
        this.paymentApprovals.emittedFunction(event)

        break;
      default:

    }
  }

  lookupView(lookupData) {
    let queryParams;
    this.lookupData = lookupData;

    if ('queryParams' in lookupData) {
      queryParams = lookupData.queryParams;
      delete lookupData.queryParams;
    }
    this.router.navigate(['./', lookupData], { relativeTo: this.activatedRoute, ...(queryParams && { queryParams }) });
  }

  // ngOnDestroy() {
  //   this.eventSubscriber.unsubscribe();
  // }
}