// import { Component, OnInit, Input } from '@angular/core';
// import { Router, Params, ActivatedRoute } from '@angular/router';
// import { FormGroup } from '@angular/forms';
// import {MeteorObservable} from "meteor-rxjs";
// import { MatDialog } from '@angular/material';
// import { NotificationsService } from 'angular2-notifications';
// import { DialogSelect } from '../../modules/shared-module/system-lookup/system-lookup.component';
// import { DialogComponent } from '../../modules/shared-module/dialog/dialog.component';
// import Dependency = Tracker.Dependency;
//
// @Component({
//   selector: 'inventory-warehousebin',
//   template: `
//     <mat-card class="box">
//       <h2>
//         {{warehouseBin.name}}
//         <a (click)="removeDoc()" style="cursor: pointer">
//           <i class="material-icons">delete</i>
//         </a>
//       </h2>
//
//       <section >
//         <mat-tab-group>
//           <mat-tab label="Info">
//
//             <br>
//             <mat-form-field>
//               <input matInput name="name" value="{{warehouseBin.name}}" type="text" placeholder="Name" [(ngModel)]="warehouseBin.name" (blur)="onBlurMethod($event.target)">
//             </mat-form-field>
//             <br>
//             <mat-form-field>
//               <input matInput readonly name="name" (click)="openDialog()" name="name" value="{{warehouse.name}}" type="text" placeholder="Name" [(ngModel)]="warehouse.name">
//             </mat-form-field>
//
//           </mat-tab>
//         </mat-tab-group>
//       </section>
//     </mat-card>
//
//   `
// })
//
// export class InventoryWarehouseBinPage implements OnInit{
//   newProduct: FormGroup;
//
//   data: any = {
//     value: {
//       $in: [null, false]
//     },
//     hidden: true,
//     query: {}
//   };
//   password: string;
//   tenants: any = [];
//   warehouse:any = {};
//   warehouseBinId: string = '';
//   warehouseBin: any = {};
//   autoDep: Dependency = new Dependency();
//
//   constructor(private route: ActivatedRoute, private router: Router, private _service: NotificationsService, public dialog: MatDialog) {}
//
//   ngOnInit() {
//
//     this.route.params.subscribe((params: Params) => {
//       this.warehouseBinId = params['id'];
//       let query = {
//         _id: this.warehouseBinId
//       };
//       MeteorObservable.autorun().subscribe(() => {
//         this.autoDep.depend();
//         MeteorObservable.call('findOne', 'warehouseBins', query, {}).subscribe((res:any) => {
//           this.warehouseBin = res;
//           MeteorObservable.call('findOne', 'warehouses', {_id: res.warehouseId}, {}).subscribe(res => {
//             this.warehouse = res;
//           })
//         });
//
//       })
//     });
//
//   }
//
//   openDialog() {
//     let dialogRef = this.dialog.open(DialogComponent);
//     dialogRef.componentInstance['lookupName'] = 'warehouses';
//     dialogRef.componentInstance['data'] = {
//       value: {
//         $in: [null, false]
//       },
//       hidden: true,
//       query: {}
//     };
//
//     dialogRef.afterClosed().subscribe(event => {
//       if (event) {
//         MeteorObservable.call('update', 'warehouseBins', {_id: this.warehouseBinId}, {$set: {warehouseId: event._id}})
//           .subscribe(res => {
//             this.autoDep.changed();
//         });
//       }
//     });
//   }
//
//   removeDoc() {
//     let dialogRef = this.dialog.open(DialogSelect);
//     dialogRef.afterClosed().subscribe(result => {
//       if (result) {
//         let query = {
//           _id: this.warehouseBinId
//         };
//         let update = {
//           $set: {
//             removed: true
//           }
//         };
//         MeteorObservable.call('update', 'warehouseBins', query, update).subscribe(res => {
//           this._service.success(
//             'Success',
//             'Removed Successfully'
//           );
//           this.router.navigate(['/inventory/warehousebins']);
//         });
//
//       }
//     });
//   }
//
//   onBlurMethod(target){
//     let field = target.name;
//     let value = target.value;
//     let query = {
//       _id: this.warehouseBinId
//     }
//     let update = {
//       $set: {
//         [field]: value
//       }
//     };
//     MeteorObservable.call('update', 'warehouseBins', query, update).subscribe(res => {
//     })
//   }
// }
