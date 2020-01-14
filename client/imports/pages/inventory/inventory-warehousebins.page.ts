// import { Component, OnInit, Input } from '@angular/core';
// import { Router } from '@angular/router';
// import { Warehouses } from '../../../../both/collections/warehouses.collection';
// import {MeteorObservable} from "meteor-rxjs";
// import {FilterDialogComponent} from '../../modules/shared-module/filterDialog/filterDialog.component';
// import { MatDialog } from '@angular/material';
// import { NotificationsService } from 'angular2-notifications';
//
// @Component({
//   selector: 'inventory-warehousebins',
//   template: `
//     <mat-card>
//       <h2>Warehouse Bins <i class="material-icons" style="cursor:pointer;"(click)="openDialog()">list</i></h2>
//
//       <mat-tab-group>
//         <mat-tab label="Warehouse Bins">
//           <mat-select placeholder="Select Warehouse" [(ngModel)]="selectedWarehouse" name="module" (ngModelChange)="onChange($event)">
//             <mat-option *ngFor="let warehouse of warehouses" [value]="warehouse">
//               {{ warehouse.name }}
//             </mat-option>
//           </mat-select>
//
//           <system-lookup [lookupName]="'warehouseBins'" (onSelected)="onSelect($event)" [(data)]="data"></system-lookup>
//         </mat-tab>
//         <!--<mat-tab label="Create Product">-->
//         <!--<form [formGroup]="newProduct" (submit)="addProduct(newProduct)">-->
//         <!--<mat-form-field>-->
//         <!--<input matInput formControlName="name" type="text" placeholder="Name" required>-->
//         <!--</mat-form-field>-->
//         <!--<small style="color: red" [hidden]="newProduct.controls.name.valid || newProduct.controls.name.pristine">-->
//         <!--Name is required-->
//         <!--</small>-->
//         <!--<button mat-raised-button color="warn" type="submit">Add Product</button>-->
//         <!--</form>-->
//         <!--</mat-tab>-->
//       </mat-tab-group>
//     </mat-card>
//   `
// })
//
// export class InventoryWarehouseBinsPage implements OnInit{
//   data: any = {
//     value: {
//       $in: [null, false]
//     },
//     hidden: true,
//     query: {}
//   };
//   password: string;
//   tenants: any = [];
//   warehouses:any = [];
//   warehouseIds:any = [];
//
//   constructor(private router: Router, private _service: NotificationsService, public dialog: MatDialog) {}
//
//   ngOnInit() {
//     MeteorObservable.autorun().subscribe(() => {
//       if (Session.get('tenantId')) {
//         MeteorObservable.subscribe('warehouses', {tenantId: Session.get('tenantId')}, {}, '').subscribe(() => {
//           MeteorObservable.autorun().subscribe(() => {
//             this.warehouses = Warehouses.collection.find().fetch();
//             if (this.warehouses.length > 0) {
//               this.warehouses.forEach(warehouse => {
//                 this.warehouseIds.push(warehouse._id)
//               });
//               let temp = Object.assign({}, this.data);
//
//               temp.query = {
//                 $in: this.warehouseIds
//               };
//               this.data = {};
//               this.data = temp;
//               this.warehouses.unshift({
//                 name: 'All',
//                 _id: ''
//               })
//             }
//           })
//         })
//       }
//     });
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
//         let temp = Object.assign({}, this.data);
//         temp.value = event;
//         temp.hidden = result;
//         this.data = {};
//         this.data = temp;
//
//       }
//     });
//   }
//
//   onSelect(event) {
//     Session.set('warehouseId', event._id);
//     this.router.navigate(['/inventory/warehousebins',  event._id]);
//   }
//
//   onChange(event) {
//     let temp = Object.assign({}, this.data);
//     if (event._id) {
//       temp.query = event._id;
//
//     } else {
//       temp.query = {
//         $in: this.warehouseIds
//       };
//     }
//     this.data = {};
//     this.data = temp;
//   }
// }
