// import { Component, OnInit, OnDestroy } from '@angular/core';
// import {MatSnackBar} from '@angular/material';
// import { MatDialog } from '@angular/material';
// import {ActivatedRoute, Router} from '@angular/router';
// import { NotificationsService } from 'angular2-notifications';
// import { Subscription } from 'rxjs/Subscription';
//
// @Component({
//   selector: 'customers-contract',
//   templateUrl: 'customers-contract.page.html',
// })
//
// export class CustomersContractPage implements OnInit, OnDestroy {
//
//   constructor(
//     public snackBar: MatSnackBar,
//     private route: ActivatedRoute,
//     private dialog: MatDialog,
//     private router: Router,
//     private _service: NotificationsService
//   ) {}
//   filterConditions: any;
//
//   pageHeader: string = 'Customer Contracts > test';
//   documentId: string;
//   subscription: Subscription;
//
//   data: any = {
//     value: {
//       $in: [null, false]
//     },
//     hidden: true,
//     customerId: ''
//   };
//
//   ngOnInit() {
//     // this.route.params.subscribe((params: any) => {
//     //   this.documentId = params['documentId'];
//     //   const subscription = MeteorObservable.subscribe('customers', {contractId: this.documentId});
//     //   const autorun = MeteorObservable.autorun();
//     //
//     //   this.subscription = merge(subscription, autorun).subscribe(() => {
//     //     let doc:any = Customers.collection.findOne({contractId: this.documentId});
//     //     if (doc) {
//     //       this.pageHeader = 'Customer > ' + doc.customers;
//     //     }
//     //   });
//     // });
//   }
//   ngOnDestroy() {
//     // this.subscription.unsubscribe();
//   }
// }
