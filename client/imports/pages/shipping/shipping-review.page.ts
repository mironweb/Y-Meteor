import { Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit } from "@angular/core";
import { Router, ActivatedRoute, Params } from "@angular/router";
import { tap } from "rxjs/operators";
import { Subscription } from "rxjs/Subscription";
import { EventEmitterService } from "../../services";
import { MeteorObservable } from "meteor-rxjs";
import { NotificationsService } from 'angular2-notifications';
import {
  hasOpenShipment,
  getPalletBoxProduct,
  removeProductFromShipment,
} from './utils';

@Component({
  selector: "shipping-review",
  templateUrl: "shipping-review.page.html",
  styleUrls: ["shipping-review.page.scss"]
})
export class ShippingReviewPage implements OnInit, OnDestroy, AfterViewInit {
  routeSub: Subscription;
  eventSub: Subscription;
  paramSub: Subscription;
  querySub: Subscription;

  pageHeader: string = "Shipping";
  view: string = "";
  isSearching: boolean = false;
  itemCode: string = "";
  @ViewChild("searchItemCodeInput") searchInput: ElementRef;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationsService
  ) {}

  orderId: string;
  orderNumber: string;

  ngOnInit() {
    this.routeSub = this.route.params
      .pipe(
        tap(params => {
          if ("view" in params) {
            this.view = params.view;
          } else {
            this.view = "";
          }
        })
      )
      .subscribe();

    // listen on topbar search events
    this.eventSub = EventEmitterService.Events.subscribe((event: any) => {
      // when search box is opened, show systemLookup view
      if (event.type === "topbar-search-opened") {
        this.showLineItems();
      }
      // when search box is closed, hide systemLookup view
      if (event.type === "topbar-search-closed") {
        this.toView("");
      }
    });

    this.paramSub = this.route.params.subscribe((params: Params) => {
      this.orderNumber = params["orderNumber"];

      const query = {
        number: this.orderNumber,
        status: "Open",
      };
      MeteorObservable.call("findOne", "customerOrders", query).subscribe(
        (result: any) => {
          if (!result) {
            this.notificationService.error("Fetching...", "Invalid Order");
            return;
          }
          this.orderId = result._id;
          const pageHeader = `${this.pageHeader} ${this.orderNumber}`;
          EventEmitterService.Events.emit({ pageHeader });
        }
      );
    });

    this.querySub = this.route.queryParams.subscribe((params) => {
      if (params.showSearchBox) {
        setTimeout(() => {
          EventEmitterService.Events.emit({
            type: 'open-topbar-search',
          });
        }, 0);
      }
    });
  }

  ngAfterViewInit() {
    if (this.view === '' || this.view === null || this.view === undefined) {
      setTimeout(() => {
        this.searchInput.nativeElement.focus();
      }, 0);
    }
  }

  ngOnDestroy() {
    this.routeSub.unsubscribe();
    this.eventSub.unsubscribe();
    this.paramSub.unsubscribe();
    this.querySub.unsubscribe();
  }

  toView(view, queryParams = {}) {
    this.router.navigate(["./", { view }], {
      queryParams,
      relativeTo: this.route
    });
  }

  showLineItems() {
    // TODO add queryParams to show only review/pending orders
    this.toView("lineItems", {});
  }

  hideLineItems() {
    // emit event to close topbar search
    // this will also hide the customer orders lookup
    EventEmitterService.Events.emit({
      type: 'close-topbar-search',
    });
  }

  onSelectReviewItem(event: any) {
    this.router.navigate([
      "shipping/order/" +
        this.orderNumber +
        "/product/" +
        event.value["shipmentProductId"] +
        "/edit"
    ]);
  }

  select(event: any) {
    this.router.navigate([
      "shipping/order/" +
        this.orderNumber +
        "/product/" +
        encodeURIComponent(event.value["product"])
    ]);
  }

  getCustomerOrderAggregate(orderNumber, productId) {
    return [
      {
        $match: {
          number: orderNumber,
          status: 'Open',
        },
      },
      {
        $project: {
          lineItems: {
            $filter: {
              input: '$lineItems',
              as: 'item',
              cond: {
                $and: [
                  { $eq: ['$$item.productId', productId] },
                  { $lt: ['$$item.qtyShipped', '$$item.qtyOrdered'] },
                ],
              },
            },
          },
        },
      },
    ];
  }

  searchItemCode() {
    if (this.isSearching) {
      return;
    }
    if (!this.itemCode) {
      return this.showLineItems();
    }

    this.isSearching = true;
    MeteorObservable.call('findOne', 'products', {
      $or: [
        { name: this.itemCode },
        { barcode: this.itemCode },
      ],
    })
      .subscribe((productResult: any) => {
        if (!productResult) {
          this.notificationService.error('Searching...', 'Invalid Product');
          this.isSearching = false;
          return;
        }

        // search product on customerShipments
        hasOpenShipment(this.orderId)
          .subscribe((shipmentResult: any) => {
            if (shipmentResult) {
              const data = getPalletBoxProduct(
                shipmentResult,
                'productId',
                productResult._id
              );
              if (data.found && data.product) {
                this.isSearching = false;
                this.router.navigate([
                  `shipping/order/${this.orderNumber}/product/${data.product._id}/edit`
                ]);
                return;
              }
            }

            // search product on customerOrders
            const aggregate = this.getCustomerOrderAggregate(
              this.orderNumber,
              productResult._id
            );
            MeteorObservable.call('aggregate', 'customerOrders', aggregate)
              .subscribe((orderResult: any) => {
                this.isSearching = false;
    
                if (!orderResult ||
                    !orderResult.result[0] ||
                    !orderResult.result[0].lineItems.length
                ) {
                  this.notificationService.error('Searching...', 'Invalid Product');
                  return;
                }

                const productName = encodeURIComponent(productResult.name);
                this.router.navigate([
                  `shipping/order/${this.orderNumber}/product/${productName}`
                ]);
              });
          });
      });
  }

  onEventReviewItems(event) {
    const row = event.value.row;
    if (event.name === 'actions.remove') {
      removeProductFromShipment(row._id, row.shipmentProductId, true)
        .subscribe((result: any) => {
          this.notificationService.success(
            'Deleting Item',
            'Shipment Item deleted successfully.'
          );
        });
    }
  }
}
