// import { Component, OnInit} from '@angular/core';
// import { MeteorObservable } from 'meteor-rxjs';
// import { NotificationsService } from 'angular2-notifications';
// import {MatDialog} from '@angular/material';
// import { DialogSelect } from '../../modules/shared-module/system-lookup/system-lookup.component';
// import * as _ from "underscore";
//
// import {FilterDialogComponent} from '../../modules/shared-module/filterDialog/filterDialog.component';
//
// import { Router, ActivatedRoute, Params } from '@angular/router';
//
// @Component({
//   selector: 'inventory-warehouse',
//   template: `
//     <mat-card class="box">
//       <h2>
//         {{warehouse.name}}
//         <a (click)="removeWarehouse()" style="cursor: pointer">
//           <i class="material-icons">delete</i>
//         </a>
//       </h2>
//
//       <mat-form-field>
//         <input matInput name="warehouse" value="{{warehouse.name}}" type="text" placeholder="Warehouse" [(ngModel)]="warehouse.warehouse" (keyup)="warehouseExist()" (blur)="onBlurMethod($event.target.name, $event.target.value)">
//       </mat-form-field>
//       <small *ngIf="warehouseExistError" [ngStyle]="{'color': 'red'}">
//         Warehouse exists
//       </small>
//       <mat-form-field>
//         <input matInput name="description" value="{{warehouse.description}}" type="text" placeholder="Description" [(ngModel)]="warehouse.description" (blur)="onBlurMethod('description', $event.target.value)">
//       </mat-form-field>
//       <br>
//       <mat-form-field>
//         <input matInput name="address1" value="{{warehouse.address1}}" type="text" placeholder="Address 1" [(ngModel)]="warehouse.address1" (blur)="onBlurMethod($event.target.name, $event.target.value)">
//       </mat-form-field>
//       <br>
//       <mat-form-field>
//         <input matInput name="address2" value="{{warehouse.address2}}" type="text" placeholder="Address 2" [(ngModel)]="warehouse.address2" (blur)="onBlurMethod($event.target.name, $event.target.value)">
//       </mat-form-field>
//       <br>
//       <mat-form-field>
//         <input matInput name="city" value="{{warehouse.city}}" type="text" placeholder="City" [(ngModel)]="warehouse.city" (blur)="onBlurMethod($event.target.name, $event.target.value)">
//       </mat-form-field>
//       <br>
//       <mat-form-field>
//         <input matInput name="state" value="{{warehouse.state}}" type="text" placeholder="State" [(ngModel)]="warehouse.state" (blur)="onBlurMethod($event.target.name, $event.target.value)">
//       </mat-form-field>
//       <br>
//       <mat-form-field>
//         <input matInput name="zipCode" value="{{warehouse.zipCode}}" type="text" placeholder="Zip Code" [(ngModel)]="warehouse.zipCode" (blur)="onBlurMethod($event.target.name, $event.target.value)">
//       </mat-form-field>
//       <br>
//       <mat-checkbox [(ngModel)]="warehouse.multiBin" (click)="onBlurMethod('multiBin', !warehouse.multiBin)">Multi-bin</mat-checkbox>
//     </mat-card>
//   `
// })
//
// export class InventoryWarehousePage implements OnInit{
//
//
//   data: any = {
//     value: {
//       $in: [null, false]
//     },
//     hidden: true
//   };
//   password: string;
//   tenants: any = [];
//   warehouseId: string;
//   warehouse: any = {};
//
//   currentWarehouseName: string;
//   warehouseArray: any;
//   warehouseNameArray: any[];
//   warehouseExistError: boolean = false;
//
//   constructor(private route: ActivatedRoute, private router: Router, private _service: NotificationsService, public dialog: MatDialog) {}
//
//   ngOnInit() {
//     this.warehouseNameArray = []
//
//     this.route.params.subscribe((params: Params) => {
//       this.warehouseId = params['id'];
//       let query = {
//         _id: this.warehouseId
//       };
//
//       MeteorObservable.call('findOne', 'warehouses', query, {}).subscribe((res:any) => {
//         this.warehouse = res;
//         this.currentWarehouseName = this.warehouse.name
//       })
//     });
//
//     MeteorObservable.call('find', 'warehouses', {tenantId: Session.get('tenantId')}).subscribe(warehouseInfo => {
//       this.warehouseArray = warehouseInfo
//       for (let i = 0; i < this.warehouseArray.length; i++) {
//           this.warehouseNameArray.push(warehouseInfo[i]["warehouse"])
//       }
//     })
//   }
//
//   warehouseExist(){
//     this.warehouseExistError = (this.currentWarehouseName !== this.warehouse.name && _.contains(this.warehouseNameArray, this.warehouse.name)) ? true : false;
//   }
//
//   onBlurMethod(field, value){
//     if (value !== "" && !this.warehouseExistError) {
//       let query = {
//         _id: this.warehouseId
//       }
//       let update = {
//         $set: {
//           [field]: value
//         }
//       };
//       MeteorObservable.call('update', 'warehouses', query, update).subscribe(res => {
//       })
//     }
//   }
//
//   removeWarehouse() {
//     let dialogRef = this.dialog.open(DialogSelect);
//     dialogRef.afterClosed().subscribe(result => {
//       if (result) {
//         let query = {
//           _id: this.warehouseId
//         };
//         let update = {
//           $set: {
//             removed: true
//           }
//         };
//         MeteorObservable.call('update', 'warehouses', query, update).subscribe(res => {
//           this._service.success(
//             'Success',
//             'Removed Successfully'
//           );
//           this.router.navigate(['/inventory/warehouses']);
//         });
//
//       }
//     });
//   }
//
//   openDialog() {
//     let dialogRef = this.dialog.open(FilterDialogComponent);
//     dialogRef.afterClosed().subscribe(event => {
//       let result = true;
//       if (event === true) {
//         result = false;
//       }
//       this.data = {
//         value : event,
//         hidden: result
//       }
//     });
//   }
//
// }
