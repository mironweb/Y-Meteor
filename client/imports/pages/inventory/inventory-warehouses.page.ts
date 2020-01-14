// import { Component, OnInit} from '@angular/core';
// import {FormGroup, FormBuilder, FormControl} from '@angular/forms';
// import { MeteorObservable } from 'meteor-rxjs';
// import { NotificationsService } from 'angular2-notifications';
// import {MatDialog} from '@angular/material';
// import * as _ from "underscore";
//
// import {FilterDialogComponent} from '../../modules/shared-module/filterDialog/filterDialog.component';
//
// import { Router } from '@angular/router';
//
// @Component({
//   selector: 'inventory-warehouses',
//   template: `
//     <mat-card>
//       <section class="box">
//         <div class="adminHeader">
//           <h2>Warehouses</h2>
//           <button mat-raised-button color="primary" (click)="openDialog()">Filter</button>
//           <button mat-raised-button color="primary" (click)="addButton()">Add</button>
//         </div>
//
//         <div [hidden]="hideTable">
//           <system-lookup [lookupName]="'warehouses'" (onSelected)="onSelect($event)" [(data)]="data"></system-lookup>
//         </div>
//         <div [hidden]="hideAddForm">
//           <form [formGroup]="newWarehouse" (submit)="addWarehouse(newWarehouse)">
//             <mat-form-field>
//               <input matInput formControlName="name" type="text" placeholder="Name" (keyup)="warehouseExist()" required>
//             </mat-form-field>
//             <small style="color: red" [hidden]="newWarehouse.controls.name.valid || newWarehouse.controls.name.pristine">
//               Name is required
//             </small>
//             <small *ngIf="warehouseExistError" [ngStyle]="{'color': 'red'}">
//               Warehouse exists
//             </small>
//             <mat-form-field>
//               <input matInput formControlName="description" type="text" placeholder="Description" required>
//             </mat-form-field>
//             <small style="color: red" [hidden]="newWarehouse.controls.description.valid || newWarehouse.controls.description.pristine">
//               Description is required
//             </small>
//             <mat-form-field>
//               <input matInput formControlName="address1" type="text" placeholder="Address 1" required>
//             </mat-form-field>
//             <small style="color: red" [hidden]="newWarehouse.controls.address1.valid || newWarehouse.controls.address1.pristine">
//               Address is required
//             </small>
//             <mat-form-field>
//               <input matInput formControlName="address2" type="text" placeholder="Address 2">
//             </mat-form-field>
//             <mat-form-field>
//               <input matInput formControlName="city" type="text" placeholder="City" required>
//             </mat-form-field>
//             <small style="color: red" [hidden]="newWarehouse.controls.city.valid || newWarehouse.controls.city.pristine">
//               City is required
//             </small>
//             <!-- <mat-form-field>
//               <input matInput formControlName="state" type="text" placeholder="State" required>
//             </mat-form-field> -->
//             <mat-select placeholder="State" formControlName="state" [(ngModel)]="stateInput" floatPlaceholder="never" >
//               <mat-option *ngFor="let state of states" (click)="stateSelection()" [value]="state.name">{{ state.name }}</mat-option>
//             </mat-select>
//             <small style="color: red" [hidden]="newWarehouse.controls.state.valid || newWarehouse.controls.state.pristine">
//               State is required
//             </small>
//             <br>
//             <mat-form-field>
//               <input matInput formControlName="zipCode" type="text" placeholder="Zip Code" required>
//             </mat-form-field>
//             <small style="color: red" [hidden]="newWarehouse.controls.zipCode.valid || newWarehouse.controls.zipCode.pristine">
//               Zip Code is required
//             </small>
//             <br>
//             <mat-checkbox formControlName="multiBin" [(ngModel)]="checked">Multi-bin</mat-checkbox>
//             <br>
//             <button mat-raised-button color="warn" type="submit" [disabled]="!newWarehouse.valid || stateError">Add Warehouse</button>
//           </form>
//         </div>
//       </section>
//     </mat-card>
//   `
// })
//
// export class InventoryWarehousesPage implements OnInit{
//
//   states = [];
//   stateError: boolean = true;
//
//   newWarehouse: FormGroup;
//   warehouseArray: any;
//   warehouseNameArray: any[];
//   warehouseExistError: boolean = false;
//
//   hideTable: boolean = false;
//   hideAddForm: boolean = true;
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
//
//     MeteorObservable.call('findOne', 'systemOptions', {name: 'states'}, {}).subscribe((res:any) => {
//       this.states = res.value;
//     })
//
//     this.warehouseNameArray = []
//
//     this.newWarehouse = new FormGroup({
//       name: new FormControl(''),
//       description: new FormControl(''),
//       address1: new FormControl(''),
//       address2: new FormControl(''),
//       city: new FormControl(''),
//       state: new FormControl(''),
//       zipCode: new FormControl(''),
//       multiBin: new FormControl('')
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
//     MeteorObservable.call('find', 'warehouses', {tenantId: Session.get('tenantId')}).subscribe(warehouseInfo => {
//       this.warehouseArray = warehouseInfo
//       for (let i = 0; i < this.warehouseArray.length; i++) {
//           this.warehouseNameArray.push(warehouseInfo[i]["name"])
//       }
//     })
//
//   }
//
//   stateSelection() {
//     this.stateError = false;
//   }
//
//   warehouseExist(){
//     this.warehouseExistError = _.contains(this.warehouseNameArray, this.newWarehouse.value.name) ? true : false;
//   }
//
//   addButton(event) {
//     this.hideAddForm = false
//     this.hideTable = true
//   }
//
//   openDialog() {
//     if (this.hideTable === false) {
//     let dialogRef = this.dialog.open(FilterDialogComponent);
//         dialogRef.afterClosed().subscribe(event => {
//           let result = true;
//           if (event === true) {
//             result = false;
//           }
//           this.data = {
//             value : event,
//             hidden: result
//           }
//         });
//       }
//     this.hideAddForm = true
//     this.hideTable = false
//   }
//
//   onSelect(event) {
//     this.router.navigate(['/inventory/warehouses',  event._id]);
//   }
//
//   addWarehouse(warehouse) {
//     MeteorObservable.autorun().subscribe(() => {
//       if (Session.get('tenantId')) {
//         let query = {
//           name: this.newWarehouse.value.name,
//           description: this.newWarehouse.value.description,
//           address1: this.newWarehouse.value.address1,
//           address2: this.newWarehouse.value.address2,
//           city: this.newWarehouse.value.city,
//           state: this.newWarehouse.value.state,
//           zipCode: this.newWarehouse.value.zipCode,
//           multiBin: this.newWarehouse.value.multiBin,
//           tenantId: Session.get('tenantId')
//         }
//         MeteorObservable.call('insert', 'warehouses', query).subscribe((res:any) => {
//
//           this._service.success(
//             "Warehouse Added",
//             this.newWarehouse.value.warehouse,
//             {
//               timeOut: 5000,
//               showProgressBar: true,
//               pauseOnHover: false,
//               clickToClose: false,
//               maxLength: 10
//             }
//           )
//
//           this.router.navigate(['/inventory/warehouses', res]);
//         });
//
//       }
//     })
//   }
//
// }
