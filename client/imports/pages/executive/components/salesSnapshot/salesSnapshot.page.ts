import { Component, OnInit } from "@angular/core";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { MeteorObservable } from "meteor-rxjs";
import { Router, Params, ActivatedRoute } from '@angular/router';
import { EventEmitterService } from "../../../../services/index";

@Component({
  selector: 'sales-snapshot',
  templateUrl: 'salesSnapshot.page.html',
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class SalesSnapshotDashboardPage implements OnInit {
  data: any = {};
  pageHeader: string;
  view: string = 'dashboard';
  lookupData: any = {};
  pageHeaders = {
    openOrders: 'Open Orders Totals',
    freightReport: 'Freight Report Totals',
    convertedQuotesReport: 'Customer Quote Report Details',
    convertedQuotesReportSummary: 'Customer Quote Report Summary',
    monthlyPPV: 'Monthly PPV',
    yearlyPPV: 'Yearly PPV',
    monthlyExpenses: 'Monthly Expenses',
    yearlyExpenses: 'Yearly Expenses',
  }

  constructor(private activatedRoute: ActivatedRoute, private router: Router,) {
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
  }

  clearUrlParams() {
    this.router.navigate(["./", {}], { queryParams: {}, relativeTo: this.activatedRoute });
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
}