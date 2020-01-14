import {Component, OnInit, OnDestroy} from '@angular/core';
import {NotificationsService } from 'angular2-notifications';
import { MatDialog } from '@angular/material';

import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MeteorObservable} from "meteor-rxjs";
import { SystemTenantModal } from '../../../../both/models/systemTenant.model'
import {Router} from "@angular/router";
@Component({
  selector: 'developer-create-parent-tenant',
  template: `    
    <section style="padding: 30px;">
      <form [formGroup]="form" novalidate (submit)="submit(form.value, form.valid)">
        <mat-form-field>
          <input matInput formControlName="name" type="text" placeholder="Name" value="" required>
        </mat-form-field>
        <small style="color: red" [hidden]="form.controls.name.valid || (form.controls.name.pristine && !submitted)">
          Name is required
        </small>
        <mat-form-field>
          <input matInput formControlName="logo" type="text" placeholder="Logo" value="" >
        </mat-form-field>
        <mat-form-field>
          <input matInput formControlName="scheme" type="text" placeholder="Scheme" value="" >
        </mat-form-field>
        <mat-form-field>
          <input matInput formControlName="city" type="text" placeholder="City" value="" >
        </mat-form-field>
        <mat-form-field>
          <input matInput formControlName="address1" type="text" placeholder="Address1" value="" >
        </mat-form-field>


      </form>
      <button mat-raised-button color="primary" (click)="createTenant()">Create</button>
      <br>
      <!--<a mat-raised-button color="warn" *ngIf="developer || !default" (click)="deleteLookup()">Delete</a>-->
    </section>  `,
  styleUrls: ['developer.scss']
})

export class DeveloperCreateParentTenantPage implements OnInit, OnDestroy{
  data: any={};
  public form: FormGroup;
  public submitted: boolean; // keep track on whether form is submitted


  constructor(private _fb: FormBuilder, private router: Router, private _service: NotificationsService, private dialog: MatDialog) {}


  ngOnInit() {
    this.form = this._fb.group({
      name: ['', <any>Validators.required],
      scheme: [''],
      city: [''],
      address1: [''],
      logo: ['']
    });
  }

  createTenant() {

    this.submitted = true;
    let tenant: SystemTenantModal;

    let controls = this.form.controls;

    tenant = {
      name: controls.name.value,
      logo: controls.logo.value,
      scheme: controls.scheme.value,
      city: controls.city.value,
      address1: controls.address1.value,
      modules: []
    };

    if (this.form.valid) {
      MeteorObservable.call('find', 'systemTenants', {name: tenant.name}).subscribe((res: any) => {
        if (res.length == 0) {
          MeteorObservable.call('insert', 'systemTenants', tenant).subscribe((res:any) => {
            this.router.navigate(['/developer/parenttenants/'+ res]);
          });
        } else {
          this._service.error(
            'Error',
            "Tenant already exists"
          );
        }
      });
    } else {
      this._service.error(
        'Error',
        "Please fill out the form"
      );

    }
  }

  submit(value, valid) {

  }

  ngOnDestroy() {

  }
}