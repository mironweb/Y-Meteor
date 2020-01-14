import { Component, OnInit, ViewChildren, ViewChild, QueryList, OnDestroy } from "@angular/core";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { MeteorObservable } from "meteor-rxjs";
import { Subscription } from "rxjs";
import { Router, Params, ActivatedRoute } from '@angular/router';
import { EventEmitterService } from "../../../../services/index";

@Component({
  selector: 'inventory',
  templateUrl: 'inventory.page.html',
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class InventoryDashboardPage implements OnInit, OnDestroy {
  @ViewChildren('card') mycomponents: QueryList<any>;
  @ViewChild('marsInventory') marsInventory;
  data: any = {};
  pageHeader: string;
  view: string = 'dashboard';
  lookupData: any = {};
  pageHeaders = {

  }
  routeSub: Subscription;

  constructor(private activatedRoute: ActivatedRoute, private router: Router, ) {
    pdfFonts.pdfMake;
  }

  ngOnInit() {
    this.routeSub = this.activatedRoute.params.subscribe((params: Params) => {

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

  lookupView(lookupData) {
    let queryParams;
    this.lookupData = lookupData;

    if ('queryParams' in lookupData) {
      queryParams = lookupData.queryParams;
      delete lookupData.queryParams;
    }
    this.router.navigate(['./', lookupData], { relativeTo: this.activatedRoute, ...(queryParams && { queryParams }) });
  }

  ngOnDestroy(){
    this.routeSub.unsubscribe();
  }
}