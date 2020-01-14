import { Component, OnInit, ViewChildren, ViewChild, QueryList, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material';
import * as _ from "underscore";
import { EventEmitterService } from "../../../services/index";

import { Router, Params, ActivatedRoute } from '@angular/router';
import { PageHeader } from 'client/imports/modules/shared-module/pageHeader/pageHeader';

@Component({
  selector: 'executive-dashboard',
  templateUrl: 'executive-dashboard.page.html',
  styleUrls: ['executive-dashboard.page.scss'],
})

export class ExecutiveDashboardPage implements OnInit{
  @ViewChildren('card') mycomponents: QueryList<any>;
  @ViewChild('marsInventory') marsInventory;

  view: string = 'dashboard';
  pageHeader: string;
  objLocal: any = {};
  data: any = {};
  openOrdersReport: any = {};
  openOrdersTotals: any = {};
  freightReport: any = {};
  freightReportTotals: any = {};
  borrowingBase: any = {};
  borrowingBaseTotals: any = {};
  invoiceTotals90Days: any = {};
  inventory: any = {};
  lookupData: any = {};
  result: any;
  startOfMonth: Date;
  endOfMonth: Date;
  bankingBalanceAccounts = [];
  rows = [];
  horizontalHeadersMonth = [
    'This Month (To Date)',
    'This Month Last Year (To Date)',
    'This Month Last Year (All Month)',
  ];
  horizontalHeadersYear = [
    'This Year (To Date)',
    'Last Year (To Date)',
    'Last Year (All Year)',
  ];
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
    inventoryVariance: 'Inventory Variances',
    customerInvoices: 'Customer Invoices',
  }
  filterConditions: any;
  // @Input() data: any;
  componentsLoad: any = {
    row1: true,
    row2: false,
    row3: false,
    row4: false,
    row5: false,
    row6: false,
    row7: false,
  }
  rowNumber: number = 1;
  showButton: boolean = true;

  constructor(private router: Router, private dialog: MatDialog, private activatedRoute: ActivatedRoute) {}
  init() {
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
    
  }
  ngOnInit() {

    // this.loadNextRow();

    // this.activatedRoute.params.subscribe((params: Params) => {

    //   this.pageHeader = (params['view']) ? this.pageHeaders[params['view']] : null;
    //   if (!this.pageHeader && params['pageHeader']) {
    //     this.pageHeader = params['pageHeader'];
    //   }
    //   EventEmitterService.Events.emit({ pageHeader: this.pageHeader, });
    //   this.view = (params['view']) ? params['view'] : 'dashboard';

    // })
    // this.init();
  }
  
  ngAfterViewInit(){
    // console.log(this.mycomponents['_results']);
  }

  loadNextRow(){
    if (Object.keys(this.componentsLoad).length === this.rowNumber) {
      this.showButton = false;
    }
    if (Object.keys(this.componentsLoad).length >= this.rowNumber) {
      this.componentsLoad['row' + this.rowNumber] = true;
      this.rowNumber++;
    }
  }

  changedKeys(o1, o2){
    let keys = _.union(_.keys(o1), _.keys(o2));
    return _.filter(keys, function (key) {
      if (!isNaN(o1[key]) || !isNaN(o2[key])) {
        return parseInt(o1[key]) !== parseInt(o2[key]);
      } else {
        return o1[key] !== o2[key];
      }
    })
  }

  clearUrlParams(){
    this.router.navigate(["./", {}], {queryParams: {}, relativeTo: this.activatedRoute});
  }

  lookupView(lookupData) {
    let queryParams;
    this.lookupData = lookupData;

    if ('queryParams' in lookupData) {
      queryParams = lookupData.queryParams;
      delete lookupData.queryParams;
    }
    this.router.navigate(['./', lookupData], { relativeTo: this.activatedRoute, ...(queryParams && {queryParams}) });
  }
  getRows(rows) {
    // this.calculateTotalsOpenOrders(rows);
    // this.rows = rows;
  }

  lookupDataChange(event) {
    switch (event.name) {
      case 'marsStateTotal':
      this.marsInventory.emittedFunction(event)

        break;
      default:
        
    }
  }

  selectAccount(event) {
    if (this.view !== 'inventoryLastYear') {
      this.view = 'ledgerAccount';
      this.data.ledgerAccountId = event._id;
      this.router.navigate([], { queryParams: { view: this.view, ledgerId: event._id }, queryParamsHandling: 'merge' });
    }
  }

  getFilterConditions(action) {
    this.reducers(action);
  }
  reducers(action) {
    switch (action.type) {
      case 'UPDATE_FILTERCONDITIONS':
        this.filterConditions = action.value;
        return;
      case 'ADD_FILTER':
        this.filterConditions = action.value;
        return;
      default:
        return;
    }
  }
}
