// import { Component, OnInit} from '@angular/core';
// import { FormGroup, FormControl } from '@angular/forms';
// import { MeteorObservable } from 'meteor-rxjs';
// import { NotificationsService } from 'angular2-notifications';
// import { MatDialog } from '@angular/material';
//
// import {FilterDialogComponent} from '../../modules/shared-module/filterDialog/filterDialog.component';
//
// import { Router } from '@angular/router';
//
// @Component({
//   selector: 'inventory-products',
//   template: `
//     <mat-card>
//       <h2>Products <i class="material-icons" style="cursor:pointer;"(click)="openDialog()">list</i></h2>
//
//       <mat-tab-group>
//         <mat-tab label="Products">
//           <system-lookup [lookupName]="'products'" (onSelected)="onSelect($event)" [(data)]="data"></system-lookup>
//         </mat-tab>
//         <mat-tab label="Create Product">
//           <form [formGroup]="newProduct" (submit)="addProduct(newProduct)">
//             <mat-form-field>
//               <input matInput formControlName="name" type="text" placeholder="Name" required>
//             </mat-form-field>
//             <small style="color: red" [hidden]="newProduct.controls.name.valid || newProduct.controls.name.pristine">
//               Name is required
//             </small>
//             <button mat-raised-button color="warn" type="submit">Add Product</button>
//           </form>
//         </mat-tab>
//       </mat-tab-group>
//     </mat-card>
//   `
// })
//
// export class InventoryProductsPage implements OnInit{
//
//   newProduct: FormGroup;
//   pageHeader: string;
//
//   data: any = {
//     value: {
//       $in: [null, false]
//     },
//     hidden: true
//   };
//   password: string;
//   tenants: any = [];
//
//   constructor(private router: Router, private _service: NotificationsService, public dialog: MatDialog) {}
//
//   ngOnInit() {
//     this.newProduct = new FormGroup({
//       name: new FormControl('')
//     })
//
//     let selector = {
//       $or: [
//         {
//           _id: Session.get('parentTenantId'),
//         },
//         {
//           parentTenantId: Session.get('parentTenantId')
//         }
//       ]
//     };
//     let args = [selector];
//
//   }
//
//   openDialog() {
//     let dialogRef = this.dialog.open(FilterDialogComponent);
//     dialogRef.afterClosed().subscribe(event => {
//       if (event) {
//         let result = true;
//         if (event === true) {
//           result = false;
//         }
//         this.data = {
//           value : event,
//           hidden: result
//         }
//       }
//     });
//   }
//
//   onSelect(event) {
//     this.router.navigate(['/inventory/products',  event._id]);
//   }
//
//   addProduct(product) {
//     MeteorObservable.autorun().subscribe(() => {
//       if (Session.get('tenantId')) {
//         let query = {
//           name: this.newProduct.value.name,
//           tenantId: Session.get('tenantId')
//         }
//         MeteorObservable.call('insert', 'products', query).subscribe((res:any) => {
//
//           this._service.success(
//             "Product Added",
//             this.newProduct.value.name,
//             {
//               timeOut: 5000,
//               showProgressBar: true,
//               pauseOnHover: false,
//               clickToClose: false,
//               maxLength: 10
//             }
//           )
//
//           this.router.navigate(['/inventory/products', res]);
//         });
//
//       }
//     })
//   }
//
// }
