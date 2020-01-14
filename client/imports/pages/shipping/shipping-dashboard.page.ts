import { Component, ElementRef, OnDestroy, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';
import { EventEmitterService } from '../../services';
import { MeteorObservable } from 'meteor-rxjs';
import { NotificationsService } from 'angular2-notifications';

@Component({
  selector: 'shipping-dashboard',
  templateUrl: 'shipping-dashboard.page.html',
  styleUrls: ['shipping-dashboard.page.scss'],
})
export class ShippingDashboardPage implements OnInit, OnDestroy, AfterViewInit {
  routeSub: Subscription;
  eventSub: Subscription;

  pageHeader: string = 'Shipping';
  view: string = '';
  isSearching: boolean = false;
  salesOrderNumber: string = '';
  filterConditions: any;
  @ViewChild("searchInput") searchInput: ElementRef;

  public options = {
    timeOut: 5000,
    showProgressBar: true,
    pauseOnHover: false,
    clickToClose: false,
    maxLength: 10
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationsService
  ) {}

  ngOnInit() {
    EventEmitterService.Events.emit({pageHeader: this.pageHeader});

    this.routeSub = this.route.params.pipe(
      tap((params) => {
        // always set pageHeader when route params are changed
        EventEmitterService.Events.emit({pageHeader: this.pageHeader});

        if ('view' in params) {
          this.view = params.view;
        } else {
          this.view = '';
        }
      })
    ).subscribe();

    // listen on topbar search events
    this.eventSub = EventEmitterService.Events.subscribe((event:any) => {
      // when search box is opened, show systemLookup view
      if (event.type === 'topbar-search-opened') {
        this.showCustomerOrders();
      }
      // when search box is closed, hide systemLookup view
      if (event.type === 'topbar-search-closed') {
        this.toView('');
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
  }

  toView(view, queryParams={}) {
    this.router.navigate(['./', {view}], {queryParams, relativeTo: this.route});
  }

  showCustomerOrders() {
    // TODO add queryParams to show only open orders
    this.toView('customerOrders', {
      columns: 'status',
      status_method: '$eq',
      status_value: 'Open',
      status_type: 'string',
    });
  }

  hideCustomerOrders() {
    // emit event to close topbar search
    // this will also hide the customer orders lookup
    EventEmitterService.Events.emit({
      type: 'close-topbar-search',
    });
  }

  onSelectCustomerOrder(event) {
    this.router.navigate(['shipping/order/' + event.value['orderNumber']]);
  }

  searchSalesOrder() {
    if (this.isSearching) {
      return;
    }
    if (!this.salesOrderNumber) {
      return this.showCustomerOrders();
    }

    this.isSearching = true;
    this.applyFilter(this.salesOrderNumber);
    const query = {
      number: this.salesOrderNumber,
      status: 'Open',
    };
    MeteorObservable.call('findOne', 'customerOrders', query)
      .subscribe((result: any) => {
        this.isSearching = false;

        if (result) {
          this.router.navigate([`shipping/order/${result.number}`]);
        } else {
          this.notificationService.error('Searching...', 'Invalid Order');
        }
      });
  }

  applyFilter(value: string) {
    if (value) {
      this.salesOrderNumber = parseInt(value, 10).toString();
    }
  }
}
