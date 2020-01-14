import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router, ActivatedRoute, Params } from "@angular/router";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { NotificationsService } from "angular2-notifications";
import { EventEmitterService } from "../../services";
import { MeteorObservable } from "meteor-rxjs";
import { Subscription } from "rxjs/Subscription";
import {
  hasOpenShipment,
  createShipment,
  addProductToShipment,
  getProductBinName,
} from './utils';

@Component({
  selector: "shipping-create",
  templateUrl: "shipping-create.page.html",
  styleUrls: ["shipping-create.page.scss"]
})
export class ShippingCreatePage implements OnInit, OnDestroy {
  paramSub: Subscription;
  eventSub: Subscription;

  pageHeader: string = "Shipping";
  shippingForm: FormGroup;
  orderNumber: string;
  itemCode: string;

  customerOrder: any;
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
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.shippingForm = this.shippingFormBuilder.group({
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
      this.itemCode = decodeURIComponent(params["itemCode"]);

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

          MeteorObservable.call("findOne", "products", {
            name: this.itemCode
          }).subscribe((productResult: any) => {
            if (!productResult) {
              this.notificationsService.error('Fetching...', 'Invalid Product');
              return;
            }

            this.product = productResult;
            this.shippingForm.controls["productId"].setValue(productResult._id);

            // get binNumber from products
            getProductBinName(productResult).subscribe((binNumber) => {
              this.shippingForm.controls["binNumber"].setValue(binNumber);
            });

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
        }
      );
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

  addProductToShipment() {
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

    hasOpenShipment(this.customerOrder._id).subscribe((shipmentResult: any) => {
      // console.log('hasOpenShipment', shipmentResult);

      // if the current customer order does not have an open shipment
      // then create a new open shipment
      if (!shipmentResult) {
        createShipment(this.customerOrder._id, this.shippingForm.value)
          .subscribe((result: any) => {
            this.router.navigate([
              `shipping/order/${this.customerOrder.number}`,
              {view:'lineItems'},
            ]);
          });
        return;
      }
      // else update the open shipment
      addProductToShipment(shipmentResult._id, this.shippingForm.value)
        .subscribe((result: any) => {
          this.router.navigate([
            `shipping/order/${this.customerOrder.number}`,
            {view:'lineItems'},
          ]);
        });
    });
  }

  cancelProductToShipment() {
    this.router.navigate([
      `shipping/order/${this.customerOrder.number}`,
      {view:'lineItems'},
    ]);
  }
}
