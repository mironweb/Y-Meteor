import { Component } from '@angular/core';
import { HTTP } from 'meteor/http'
import { Router, Params, ActivatedRoute } from '@angular/router';
import * as pdf from '../../../../../../both/functions/pdfReports';
import { MeteorObservable } from "meteor-rxjs";
import {  EventEmitterService } from "../../../../services/index";
import * as pdfMake from 'pdfmake/build/pdfmake';

import {SystemOptionsService} from "../../../../services/SystemOptions.service";
import { OnDestroy, OnInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'customers-InvoiceReview',
  templateUrl: "customers-invoiceReview.page.html",
  styleUrls: ['customers-invoiceReview.page.scss'],
})

export class CustomersInvoiceReviewPage implements OnInit, OnDestroy {

  constructor(private router: Router, private route: ActivatedRoute, private systemOptionsService: SystemOptionsService,) {
  }
  filterConditions: any;
  documentId: string;
  sub: Subscription;
  invoice: any = {};

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
      this.documentId = params['id'];
      MeteorObservable.call('findOne', 'customerInvoices', {
        _id: params['id']
      }).subscribe(invoice => {
        this.invoice = invoice;
        (this.invoice.lineItems || []).forEach((lineItem) => {
          lineItem.qtyShipped = lineItem.qtyShipped.toNumber();
        });
        MeteorObservable.call('findOne', 'customers', { _id: this.invoice.customerId }, {}).subscribe((res: any) => {
          this.invoice['customerName'] = res.name;
          this.invoice['customerNumber'] = res.number;
        })
        MeteorObservable.call('findOne', 'customerOrders', { _id: this.invoice.customerOrderId }, {}).subscribe((res: any) => {
          this.invoice['orderInfo'] = res;
          (this.invoice.orderInfo.lineItems || []).forEach((lineItem) => {
            lineItem.qtyOrdered = lineItem.qtyOrdered.toNumber();
            lineItem.qtyBackordered = lineItem.qtyBackordered.toNumber();
          });

          this.invoice.lineItems.forEach(lineItem => {
            MeteorObservable.call('findOne', 'products', { _id: lineItem.productId }, {}).subscribe((res: any) => {
              if (res) {
                lineItem.productInfo = res;
                // res.customers.filter(alias => {
                //   if (alias._id == this.invoice.customerId) {
                //     return true;
                //   }
                // })
                lineItem.alias = '';
              }
            })
            // MeteorObservable.call('findOne', 'customerAlias', { productId: lineItem.productId, customerId: this.invoice.customerId }, {}).subscribe((res: any) => {
            //   lineItem.alias = res ? res.name : '';
            // })
            if (lineItem.type === 'product' && this.invoice['orderInfo']) {
              lineItem.orderLineItemInfo = this.invoice.orderInfo.lineItems.find(function (element) {
                return element.productId === lineItem.productId;
              });
            }
          });
        })
        // console.log(this.invoice);
        this.getInvoiceTotal();
      })
    });
    this.hookEvents();
  }

  getInvoiceTotal() {
    let invoiceTotal = new Decimal(0);
    let lineItems = this.invoice.lineItems;

    lineItems.forEach(lineItem => {
      invoiceTotal = invoiceTotal.plus(lineItem.total);
    });
    this.invoice['invoiceTotal'] = invoiceTotal;
  }

  pdf() {
    this.invoice['docTitle'] = 'Invoice'
    let docDefinition = pdf.invoiceOrOrderPdf(this.invoice);
    pdfMake.createPdf(docDefinition).open();
  }

  hookEvents() {
    let events = [];
    let pageRoute = this.systemOptionsService.getCurrentPageRoute();
    if (pageRoute.data && 'buttons' in pageRoute.data) {
      pageRoute.data.buttons.forEach(button => {
        if ('eventName' in button) {
          events.push(button.eventName);
        }
      })
    }
    if (events.length > 0) {
      this.sub = EventEmitterService.Events.subscribe(async (event) => {
        switch (event.name) {
          case 'generatePDF':
            this.pdf();
            break;
          default:
            break;
        }
      })
    }
  }

  getFilterConditions(action) {
    this.reducers(action);
  }

  select(e) {

  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
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