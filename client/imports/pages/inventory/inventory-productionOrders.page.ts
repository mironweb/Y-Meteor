import {Component, OnInit, Input, ViewChild} from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';
import {DialogSelect} from "../../modules/shared-module/system-lookup";
import {MatDialog} from "@angular/material";
import {ProductionOrder, ProductionOrderModel} from "../../../../both/models/productionOrder.model";
import {NotificationsService} from "angular2-notifications";
import {MeteorObservable} from "meteor-rxjs";
import {map, switchMap, tap} from "rxjs/operators";
import {SystemOption} from "../../../../both/models/systemOption.model";
import {of} from "rxjs";
import {Random} from "meteor/random";
import {InventoryService} from "./inventory.service";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import {SystemLogsService} from "../../services/SystemLogs.service";
import moment = require("moment");

@Component({
  selector: 'inventory-production-orders',
  template: `
    <div>
      <filterBox-component lookupName="productionOrders"></filterBox-component>
      <system-lookup #productionOrdersLookup [lookupName]="'productionOrders'" (onEvent)="onEvent($event)" (onComplete)="onComplete()"></system-lookup>
    </div>
  `,
})

export class InventoryProductionOrdersPage implements OnInit{

  rows: any;
  @ViewChild("productionOrdersLookup") productionOrdersLookup;
  constructor(private router: Router,
              private route: ActivatedRoute,
              private dialog: MatDialog,
              private _service: NotificationsService,
              private inventoryService: InventoryService,
              private logService: SystemLogsService
  ) {
    pdfFonts.pdfMake;
  }

  ngOnInit() {
  }

  onEvent(event) {
    if (event.name == 'onClickRow') {
      let value = event.value;

      if ('billId' in value) {
        this.router.navigate([`./` + value.billId], {relativeTo: this.route, queryParams: {
            productionOrderId: value._id
          }});
      }
    } else if (event.name == 'actions.delete') {
      let dialogRef = this.dialog.open(DialogSelect);

      dialogRef.afterClosed().subscribe(result => {
        if (result.value == true) {
          let productionOrder = new ProductionOrder(event.value.row);
          let update = {
            closed: true
          };
          productionOrder._remove$()
            .subscribe(res => {
              this._service.success(
                'Success',
                "Document delete successfully"
              )
              this.productionOrdersLookup.reloadData("after delete");
            })
        }
      });
    } else if (event.name == 'actions.cancel') {
      let dialogRef = this.dialog.open(DialogSelect, {
        data: {
          question: "This CANNOT be undone. Are you sure you want to cancel the Production Order?",
          yes: "Yes",
          no: "No"
        }
      });

      dialogRef.afterClosed()

        .pipe(
          switchMap((result:any) => {
            if (result.value == true) {
              let productionOrder = new ProductionOrder(event.value.row);

              let query = {
                productionOrderId: productionOrder._id,
                status: {
                  $in: ['Running', 'Paused']
                }
              };
              return MeteorObservable.call('find', 'productionRuns', query)
                .pipe(
                  switchMap((res:any) => {
                    if (res.length == 0) {
                      productionOrder.status = "Canceled";
                      return productionOrder._save$();
                    } else
                      return of(null);
                  }),
                  tap(res => {
                    if (res) {
                      this._service.success(
                        'Success',
                        "Document cancel successfully"
                      )
                      this.productionOrdersLookup.reloadData("after cancel");
                    } else {
                      this._service.success(
                        'Error',
                        "Failed"
                      )

                    }
                  })
                )
            } else {
              return of(null);
            }
          })
        )
        .subscribe(result => {


        });

    } else if (event.name == 'actions.print') {

      let productionOrder;
      this._loadProductionOrder$(event.value.row._id)
        .pipe(
          tap((res:any) => {
            if (res) {
              productionOrder =  new ProductionOrder(res);
            } else {
              return null;
            }
          }),
          tap(res => {
            if (res) {
              productionOrder.itemCode = event.value.row.productName;
              productionOrder.lineItems = event.value.row.lineItems;
              let printedBy = this.getUser(Meteor.userId());
              let createdBy = productionOrder ? this.getUser(productionOrder.createdUserId) : this.getUser(Meteor.userId());
              let dateFormat = 'MMM DD, YYYY h:mm A';
              let extraInfo = {
                version: event.value.row.version,
                printedBy: printedBy[0].profile.firstName + " " + printedBy[0].profile.lastName,
                createdBy: createdBy[0].profile.firstName + " " + createdBy[0].profile.lastName,
                printedAt: moment().format(dateFormat),
                createdAt: productionOrder ? moment(productionOrder.createdAt).format(dateFormat) : moment().format(dateFormat)
              }
              let docDefinition:any = this.inventoryService._getPDFData(productionOrder, extraInfo);
              pdfMake.createPdf(docDefinition).open();
            }
          })
        ).subscribe();
    } else if(event.name == 'actions.complete') {
      console.log("complete");
      let productionOrder = new ProductionOrder(event.value.row);
      productionOrder.status = 'Complete';

      productionOrder._saveStatus$(this.logService.systemLog)
        .subscribe(res => {
          this._service.success(
            'Success',
            "Document update successfully"
          );
          this.productionOrdersLookup.reloadData("after update");
        })

    } else if(event.name == 'actions.stage') {
      let productionOrder = new ProductionOrder(event.value.row);
      productionOrder.status = 'Staged';
      let row = event.value.row;
      let findRow = this.rows.find(_row => _row._id == row._id);

      findRow.status = 'Staged';
      row.status = 'Staged';

      productionOrder._saveStatus$(this.logService.systemLog)
        .subscribe(res => {
          if (res) {
            this._service.success(
              'Success',
              "Document update successfully"
            );
            this.productionOrdersLookup.reloadData("after update");
          } else {
            this._service.error(
              'Error',
              "Document update failed, please contact support"
            );

          }
        })

      // productionOrder._save$()
      //   .pipe(
      //     tap(res => {
      //       if (res) {
      //
      //       }
      //     })
      //   )
      //   .subscribe(res => {
      //     this._service.success(
      //       'Success',
      //       "Document update successfully"
      //     );
      //     this.productionOrdersLookup.reloadData("after update");
      //   })
    }
  }

  getUser(userId) {
    return Meteor.users.find({ _id: userId }).fetch();
  }

  _afterStage$() {

  }

  _loadProductionOrder$(productionOrderId) {
    return ProductionOrder._FindOne$({_id: productionOrderId});
  }

  onSelected(event) {
  }

  onComplete() {
    this.rows = this.productionOrdersLookup._getDirtyRows();
  }

}
