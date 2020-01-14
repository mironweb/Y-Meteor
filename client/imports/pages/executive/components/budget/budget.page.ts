import { Component, OnInit, ViewChildren, ViewChild, QueryList } from "@angular/core";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { MeteorObservable } from "meteor-rxjs";
import { Router, Params, ActivatedRoute } from '@angular/router';
import { EventEmitterService } from "../../../../services/index";

@Component({
  selector: 'budget',
  templateUrl: 'budget.page.html',
  styleUrls: ['../executive-dashboard.page.scss'],
})

export class BudgetDashboardPage implements OnInit {
  @ViewChild('budgetCard') budgetCard;

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
  }

  lookupDataChange(event) {
    switch (event.name) {
      case 'budgetOverride':
        this.budgetCard.emittedFunction(event)

        break;
      default:

    }
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