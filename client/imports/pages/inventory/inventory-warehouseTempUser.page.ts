import {Component, OnInit} from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from "@angular/material";
import {NotificationsService} from "angular2-notifications";
import {ProductionRun, ProductionRunModel} from "../../../../both/models/productionRun.model";
import {MeteorObservable} from "meteor-rxjs";
import {ProductionOrder, ProductionOrderModel} from "../../../../both/models/productionOrder.model";
import {switchMap, take, tap} from "rxjs/operators";
import {of} from "rxjs";
import {Random} from "meteor/random";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {User} from "../../../../both/models/user.model";
import {EventEmitterService} from "../../services";

@Component({
  selector: 'inventory-warehouse-temp-user',
  template: `
    <mat-card>
      <form [formGroup]="tempUserForm" style="min-height: 500px;">
        <div fxLayout="row">
          <mat-form-field fxFlex fxFlex.gt-sm="25%">
            <input matInput
                   name="firstName"
                   formControlName="firstName"
                   placeholder="First Name"
                   (change)="onFirstNameChange()"
                   required>
          </mat-form-field>
          <mat-form-field fxFlex fxFlexOffset="10px" fxFlex.gt-sm="25%">
            <input matInput
                   name="lastName"
                   formControlName="lastName"
                   placeholder="Last Name"
                   (change)="onLastNameChange()"
                   required>
          </mat-form-field>
          <mat-form-field fxFlex fxFlexOffset="10px" fxFlex.gt-sm="25%">
              <mat-select placeholder="Status" (selectionChange)="onStatusChange($event)" formControlName="status">
                <mat-option *ngFor="let _status of statuses" [value]="_status">
                  {{ _status }}
                </mat-option>
              </mat-select>

          </mat-form-field>
          
        </div>
        <!--<div>-->
          <!--<button mat-button mat-raised-button color="primary" (click)="save()">Save</button>-->
        <!--</div>-->
      </form>      
    </mat-card>
  `,
})

export class InventoryWarehouseTempUserPage implements OnInit{
  productionOrderNumber: number = null;
  productionOrder: ProductionOrder;
  productionRun: ProductionRun;
  user: User;

  tempUserForm: FormGroup = this._formBuilder.group({
    firstName: ["", Validators.required],
    lastName: ["", Validators.required],
    status: [""]
  });

  statuses = [
    'active',
    'inactive',
    'terminated'
  ]


  constructor(private router: Router,
              private route: ActivatedRoute,
              private dialog: MatDialog,
              private _service: NotificationsService,
              private _formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.route.params.pipe(
      tap((res) => {
        console.log("res, '", res);
      }),
      switchMap((params) => {
        if ('documentId' in params) {
          return MeteorObservable.call('findOne', 'users', {_id: params.documentId})
        } else {
          return of(null);
        }
      }),
      tap((res) => {
        if (res) {
          console.log('res', res);
          this.user = new User(res);
          this.tempUserForm.setValue({
            firstName: this.user.profile.firstName,
            lastName: this.user.profile.lastName,
            status: this.user.profile.status ? this.user.profile.status: 'inactive'
          })
        }
      })


    ).subscribe()
  }

  onFirstNameChange(event) {
    if (this.user) {
      this.user.profile.firstName = this.tempUserForm.value.firstName;
      this.user._update$({$set: {profile: this.user.profile}})
        .subscribe((res) => {
          console.log('res', res);
          if (res) {
            this.success()
          }
        });
    }
  }

  onLastNameChange() {
    if (this.user) {
      this.user.profile.lastName = this.tempUserForm.value.lastName;
      this.user._update$({$set: {profile: this.user.profile}})
        .subscribe((res) => {
          if (res) {
            this.success()
          }
        });
    }
  }

  onStatusChange(event) {
    if (this.user) {
      this.user.profile.status = event.value;
      this.user._update$({$set: {profile: this.user.profile}})
        .subscribe((res) => {
          if (res) {
            this.success()
          }
        });
    }
  }

  success() {
    EventEmitterService.Events.emit({
      name: "success",
      componentName: 'dashboard',
      title: "Update Successfully"
    })
    // this._service.success(
    //   'Update Successfullly'
    // )
  }
}
