import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { Router, ActivatedRoute, Params } from "@angular/router";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { NotificationsService } from "angular2-notifications";
import { EventEmitterService } from "../../services";
import { MeteorObservable } from "meteor-rxjs";
import { Subscription } from "rxjs/Subscription";
import {
  hasOpenShipment,
  removeProductFromShipment,
  addProductToShipment,
  getPalletBoxProduct,
} from './utils';

@Component({
  selector: "shipping-update",
  templateUrl: "shipping-update.page.html",
  styleUrls: ["shipping-update.page.scss"],
})
export class ShippingUpdatePage implements OnInit, OnDestroy {
  paramSub: Subscription;
  eventSub: Subscription;

  pageHeader: string = "Shipping";
  shippingForm: FormGroup;
  orderNumber: string;
  shipmentProductId: string;

  customerOrder: any;
  shipment: any;
  product: any;

  public options = {
    timeOut: 5000,
    showProgressBar: true,
    pauseOnHover: false,
    clickToClose: false,
    maxLength: 10
  };

  constructor(
    private shippingFormBuilder: FormBuilder,
    private notificationsService: NotificationsService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    this.shippingForm = this.shippingFormBuilder.group({
      shipmentProductId: ["", [Validators.required]],
      productId: ["", [Validators.required]],
      customerOrderId: ["", [Validators.required]],
      palletNumber: [1, [
        Validators.required,
        Validators.pattern('[0-9]+'),
        Validators.min(1),
      ]],
      boxNumber: [1, [
        Validators.required,
        Validators.pattern('[0-9]+'),
        Validators.min(1),
      ]],
      binNumber: ["", [Validators.required]],
      qtyToShip: ["", [
        Validators.required,
        Validators.pattern('[0-9]+'),
        Validators.min(1),
      ]],
    });

    this.paramSub = this.route.params.subscribe((params: Params) => {
      this.orderNumber = params["orderNumber"];
      this.shipmentProductId = params["shipmentProductId"];

      const query = {
        number: this.orderNumber,
        status: "Open",
      };
      MeteorObservable.call("findOne", "customerOrders", query).subscribe(
        (orderResult: any) => {
          if (!orderResult) {
            this.notificationsService.error('Fetching...', 'Invalid Order');
            return;
          }

          // set the page header text
          const pageHeader = `${this.pageHeader} ${this.orderNumber}`;
          EventEmitterService.Events.emit({ pageHeader });

          this.customerOrder = orderResult;
          this.shippingForm.controls["customerOrderId"].setValue(orderResult._id);

          // search product on customerShipments
          hasOpenShipment(this.customerOrder._id)
            .subscribe((shipmentResult: any) => {
              if (!shipmentResult) {
                this.notificationsService.error('Fetching...', 'Invalid Product');
                return;
              }
              const data = getPalletBoxProduct(
                shipmentResult,
                '_id',
                this.shipmentProductId
              );
              if (!data.found || !data.product) {
                this.notificationsService.error('Fetching...', 'Invalid Product');
                return;
              }

              this.shipment = shipmentResult;
              this.shippingForm.controls["shipmentProductId"].setValue(data.product._id);
              this.shippingForm.controls["palletNumber"].setValue(data.pallet.sequence);
              this.shippingForm.controls["boxNumber"].setValue(data.box.sequence);
              this.shippingForm.controls["binNumber"].setValue(data.product.warehouseBinId);
              this.shippingForm.controls["qtyToShip"].setValue(data.product.qtyShipped);

              MeteorObservable.call("findOne", "products", {
                _id: data.product.productId,
              }).subscribe((productResult: any) => {
                if (!productResult) {
                  this.notificationsService.error('Fetching...', 'Invalid Product');
                  return;
                }

                this.product = productResult;
                this.shippingForm.controls["productId"].setValue(productResult._id);

                const itemFound = (orderResult.lineItems || []).find(lineItem => {
                  return lineItem.productId === productResult._id;
                });

                if (!itemFound) {
                    this.notificationsService.error('Fetching...', 'Invalid Product');
                    return;
                }

                this.product.qtyShipped = itemFound.qtyShipped;
                this.product.qtyOrdered = itemFound.qtyOrdered;
              });
            });
        });
    });

    // listen on topbar search events
    this.eventSub = EventEmitterService.Events.subscribe((event:any) => {
      // when search box is opened, go to shipping order page and show lineItems
      if (event.type === 'topbar-search-opened') {
        this.router.navigate(
          [`shipping/order/${this.orderNumber}`],
          {queryParams:{showSearchBox:true}}
        );
      }
    });
  }

  ngOnDestroy() {
    this.paramSub.unsubscribe();
    this.eventSub.unsubscribe();
  }

  increment(field) {
    const value: any = this.shippingForm.get(field).value || 0;
    const newValue = parseInt(value) + 1;
    this.shippingForm.controls[field].setValue(newValue);
  }

  decrement(field) {
    const value: any = this.shippingForm.get(field).value || 0;
    const newValue = Math.max(parseInt(value) - 1, 1);
    this.shippingForm.controls[field].setValue(newValue);
  }

  validate() {
    const errors = [];

    const shipmentProductId = this.shippingForm.get("shipmentProductId");
    if (shipmentProductId.invalid && shipmentProductId.errors.required) {
      errors.push("Shipment Product Id is required.");
    }

    const productId = this.shippingForm.get("productId");
    if (productId.invalid && productId.errors.required) {
      errors.push("Product Id is required.");
    }

    const customerOrderId = this.shippingForm.get("customerOrderId");
    if (customerOrderId.invalid && customerOrderId.errors.required) {
      errors.push("Customer Order Id is required.");
    }

    const palletNumber = this.shippingForm.get("palletNumber");
    if (palletNumber.invalid && palletNumber.errors.required) {
      errors.push("Pallet Number is required.");
    }

    const boxNumber = this.shippingForm.get("boxNumber");
    if (boxNumber.invalid && boxNumber.errors.required) {
      errors.push("Box Number is required.");
    }

    const binNumber = this.shippingForm.get("binNumber");
    if (binNumber.invalid && binNumber.errors.required) {
      errors.push("Bin Number is required.");
    }

    const qtyToShip = this.shippingForm.get("qtyToShip");
    if (qtyToShip.invalid && qtyToShip.errors.required) {
      errors.push("Qty to Ship is required.");
    }

    return errors;
  }

  updateProductOnShipment() {
    const errors = this.validate();
    if (errors.length) {
      this.notificationsService.error("Validation", errors.join("<br>"));
      return;
    }

    if (!this.shippingForm.valid) {
      this.notificationsService.error("Validation", "Form is invalid.");
      return;
    }

    this.shippingForm.controls['palletNumber'].setValue(
      Number(this.shippingForm.value.palletNumber)
    );
    this.shippingForm.controls['boxNumber'].setValue(
      Number(this.shippingForm.value.boxNumber)
    );
    this.shippingForm.controls['qtyToShip'].setValue(
      Number(this.shippingForm.value.qtyToShip)
    );

    const { shipmentProductId } = this.shippingForm.value;
    // update logic is removeProductFromShipment plus addProductToShipment
    removeProductFromShipment(this.shipment._id, shipmentProductId)
      .subscribe((deleteResult: any) => {
        addProductToShipment(this.shipment._id, this.shippingForm.value)
          .subscribe((insertResult: any) => {
            this.router.navigate([
              `shipping/order/${this.customerOrder.number}`,
              {view:'lineItems'},
            ]);
          });
      });
  }

  removeProductFromShipment() {
    this.openDialog({
      title: 'Deleting Item',
      content: 'Are you sure you want to delete this item?',
      type: 'confirm',
    }, (result) => {
      if (result !== 'yes') return;

      const { shipmentProductId } = this.shippingForm.value;
      removeProductFromShipment(this.shipment._id, shipmentProductId, true)
        .subscribe((result: any) => {
          this.router.navigate([
            `shipping/order/${this.customerOrder.number}`,
            {view:'lineItems'},
          ]);
        });
    });
  }

  openDialog(data, callback): void {
    const options = { width: '300px', data };
    const dialogRef = this.dialog.open(ShippingFormDialogComponent, options);
    if (callback) {
      dialogRef.afterClosed().subscribe(callback);
    }
  }
}

@Component({
  selector: 'shipping-form-dialog',
  template: `
    <h1 mat-dialog-title>{{data.title}}</h1>
    <div mat-dialog-content><p [innerHTML]="data.content"></p></div>
    <div mat-dialog-actions>
      <button mat-raised-button color="primary" [mat-dialog-close]="'ok'"
        cdkFocusInitial *ngIf="data.type !== 'confirm'">
        OK
      </button>
      <button mat-raised-button color="primary" [mat-dialog-close]="'yes'"
        cdkFocusInitial *ngIf="data.type === 'confirm'">
        YES
      </button>
      <button mat-raised-button [mat-dialog-close]="'no'"
        cdkFocusInitial *ngIf="data.type === 'confirm'">
        NO
      </button>
    </div>
  `,
  styles: [`
    h1 {
      margin-bottom: 0;
    }
  `],
})
export class ShippingFormDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ShippingFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
