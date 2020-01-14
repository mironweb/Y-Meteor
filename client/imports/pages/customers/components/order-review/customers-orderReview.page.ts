import { Component } from '@angular/core';
import { HTTP } from 'meteor/http'
import { Router, Params, ActivatedRoute } from '@angular/router';
import * as funcs from '../../../../../../both/functions/common';
import { MeteorObservable } from "meteor-rxjs";
import { Customers } from '../../../../../../both/collections/customers.collection';
import { ObservablesService, EventEmitterService } from "../../../../services/index";
import { PageResolver } from "../../../../resolvers/PageResolver";
import * as pdf from '../../../../../../both/functions/pdfReports';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import {SystemOptionsService} from "../../../../services/SystemOptions.service";
import { OnDestroy, OnInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { Subscription } from 'rxjs/Subscription';
import {PrintService} from "../../../../services/Print.service";

@Component({
  selector: 'customers-orderReview',
  templateUrl: 'customers-orderReview.page.html',
  styleUrls: ['customers-orderReview.page.scss'],
})

export class CustomersOrderReviewPage implements OnInit, OnDestroy {

  constructor(private router: Router,
              private route: ActivatedRoute,
              private systemOptionsService: SystemOptionsService,
              private printService: PrintService
  ) {

  }
  sub: Subscription;
  filterConditions: any;
  documentId: string;
  order: any = {};
  printerId;

  ngOnInit() {

    if (this.printService.printers && this.printService.printers.length > 0) {
      let findPrinter = this.printService.printers.find(_printer => _printer.printerName == 'salesOrder');
      this.printerId = findPrinter.printerId;
    }

    this.route.params.subscribe((params: Params) => {
      this.documentId = params['id'];
      MeteorObservable.call('findOne', 'customerOrders', {
        _id: params['id']
      }).subscribe(order => {
        this.order = order;
        MeteorObservable.call('findOne', 'customers', { _id: this.order.customerId}, {}).subscribe((res: any) => {
          this.order['customerName'] = res.name;
          this.order['customerNumber'] = res.number;
        })
        this.order.lineItems.forEach(lineItem => {
          lineItem.qtyOrdered = lineItem.qtyOrdered.toNumber();

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
          // MeteorObservable.call('findOne', 'customerAlias', { productId: lineItem.productId, customerId: this.order.customerId }, {}).subscribe((res: any) => {
          //   lineItem.alias = res ? res.name : '';
          // })
        });
        // console.log(this.order);
        this.getOrderTotal();
      })
    });
    this.hookEvents();
  }

  getOrderTotal(){
    let orderTotal = new Decimal(0);
    let lineItems = this.order.lineItems;

    lineItems.forEach(lineItem => {
      orderTotal = orderTotal.plus(lineItem.total);
    });
    this.order['orderTotal'] = orderTotal;
  }

  pdf() {
    // console.log(this.order);
    this.order['docTitle'] = 'Sales Order';
    console.log('this.order', this.order);
    let docDefinition = pdf.invoiceOrOrderPdf(this.order);

    console.log(docDefinition);
    // pdfMake.createPdf(docDefinition).open();
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
          case 'printPickingSheet':
            this.printPickingSheet();
            break;
          default:
            break;
        }
      })
    }
  }

  printPickingSheet() {
    console.log(this.order);
    if (this.printerId) {

      let tableBody = [];
      this.order.lineItems.forEach(_item => {
        if (_item.type == 'product') {
          tableBody.push([_item.productInfo.product, _item.qtyOrdered]);
        }
      });
      let docDefinition = {
        content: [
          {
            layout: 'lightHorizontalLines', // optional
            table: {
              // headers are automatically repeated if the table spans over multiple pages
              // you can declare how many rows should be treated as headers
              headerRows: 1,
              widths: [ '*', '*'],
              body: [
                [ 'Product', 'Qty Ordered' ],
                ...tableBody
              ]
            }
          }
        ]
      };
      let pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.getBase64(data => {
        let printJobPayload = {
          "printerId": this.printerId,
          "title": "test printjob",
          "contentType": "pdf_base64",
          "content": data,
          "source": "javascript api client"
        };
        this.printService.print(printJobPayload);
      });
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