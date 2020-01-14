import { Component, OnInit, ViewChild} from "@angular/core";
import { Router, Params, ActivatedRoute } from '@angular/router';
import {EventEmitterService} from "../../services";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import {MeteorObservable} from "meteor-rxjs";
import {PrintService} from "../../services/Print.service";

@Component({
  selector: 'accounting-dashboard',
  templateUrl: 'accounting-dashboard.page.html',
  styleUrls: ['accounting.scss'],
}) 

export class AccountingDashboardPage implements OnInit{
  view: string = 'dashboard';
  data: any = {};
  objLocal: any = {};
  lookupData: any = {};
  pageHeader: string;
  pageHeaders = {}

  @ViewChild('marsInventory') marsInventory;

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

  lookupView(lookupData) {
    let queryParams;
    this.lookupData = lookupData;

    if ('queryParams' in lookupData) {
      queryParams = lookupData.queryParams;
      delete lookupData.queryParams;
    }
    this.router.navigate(['./', lookupData], { relativeTo: this.activatedRoute, ...(queryParams && { queryParams }) });
  }

  clearUrlParams() {
    this.router.navigate(["./", {}], { queryParams: {}, relativeTo: this.activatedRoute });
  }

  lookupDataChange(event) {
    switch (event.name) {
      case 'marsStateTotal':
        this.marsInventory.emittedFunction(event)

        break;
      default:

    }
  }
}