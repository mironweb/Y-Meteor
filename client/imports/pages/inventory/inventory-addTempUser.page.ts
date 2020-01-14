import { Component, OnInit, Input } from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Users} from "../../../../both/collections/users.collection";
import {User} from "../../../../both/models/user.model";
import {SystemTenantService} from "../../services/SystemTenant.service";
import {NotificationsService} from "angular2-notifications";
import {EventEmitterService} from "../../services";

@Component({
  selector: 'inventory-add-temp-user',
  template: `
    <mat-card>
      <form [formGroup]="tempUserForm" style="min-height: 500px;">
        <div fxLayout="row">
          <mat-form-field fxFlex fxFlex.gt-sm="25%">
            <input matInput
                   name="firstName"
                   formControlName="firstName"
                   placeholder="First Name"
                   required>
          </mat-form-field>
          <mat-form-field fxFlex fxFlexOffset="10px" fxFlex.gt-sm="25%">
            <input matInput
                   name="lastName"
                   formControlName="lastName"
                   placeholder="Last Name"
                   required>
          </mat-form-field>
        </div>
        <div>
          <button mat-button mat-raised-button color="primary" (click)="save()">Save</button>
        </div>
      </form>
    </mat-card>
  `,
})

export class InventoryAddTempUserPage implements OnInit{


  constructor(private router: Router,
              private route: ActivatedRoute,
              private _systemTenant: SystemTenantService,
              private _formBuilder: FormBuilder,
              private _service: NotificationsService
  ) {}

  tempUserForm: FormGroup = this._formBuilder.group({
    firstName: ["", Validators.required],
    lastName: ["", Validators.required]
  });

  ngOnInit() {
  }

  save() {
    console.log('this.tempUser', this.tempUserForm);
    if(this.tempUserForm.valid) {

      let firstName = this.tempUserForm.value.firstName;
      let lastName = this.tempUserForm.value.lastName;
      let newUser = {
        profile: {
          lastName,
          firstName,
          status: 'active'
        },
        username: `${firstName}_${lastName}@globalthesource.com`,
        tenants: [
          {
            _id: Session.get('tenantId'),
            enabled: true,
            groups: [
              "QuevMrDTHYDKzvHx4"
            ]
          }
        ]
      };

      User._insert$(newUser)
        .subscribe(res => {
          if (typeof res == 'string') {
            EventEmitterService.Events.emit({
              name: "success",
              componentName: "dashboard",
              "title": "Save Successfully"
            })
          }
        })

    } else {

    }
  }

}
