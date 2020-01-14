import { Component, OnInit} from "@angular/core";
import {EventEmitterService} from "../../services";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import {MeteorObservable} from "meteor-rxjs";
import {PrintService} from "../../services/Print.service";
import { Router, Params, ActivatedRoute } from '@angular/router';
import * as _ from "underscore";

@Component({
  selector: 'sales-dashboard',
  templateUrl: 'sales-dashboard.page.html',
  styleUrls: ['sales.scss'],
}) 

export class SalesDashboardPage implements OnInit{
  view: string = 'dashboard';
  pageHeader: string;
  objLocal: any = {};
  data: any = {};
  lookupData: any = {};
  pageHeaders = {
    openOrders: 'Open Orders Totals',
    freightReport: 'Freight Report Totals',
    inventory: 'Inventory Valuation',
    convertedQuotesReport: 'Customer Quote Report Details',
    convertedQuotesReportSummary: 'Customer Quote Report Summary',
    monthlyPPV: 'Monthly PPV',
    yearlyPPV: 'Yearly PPV',
    monthlyExpenses: 'Monthly Expenses',
    yearlyExpenses: 'Yearly Expenses',
  }

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    pdfFonts.pdfMake;
  }

  init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();

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
    this.init();
  }
  changedKeys(o1, o2) {
    let keys = _.union(_.keys(o1), _.keys(o2));
    return _.filter(keys, function (key) {
      if (!isNaN(o1[key]) || !isNaN(o2[key])) {
        return parseInt(o1[key]) !== parseInt(o2[key]);
      } else {
        return o1[key] !== o2[key];
      }
    })
  }

  clearUrlParams() {
    this.router.navigate([], { queryParams: {} });
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

  getRows(rows) {
    // console.log(rows);
    // this.calculateTotalsOpenOrders(rows);
    // this.rows = rows;
  }
}