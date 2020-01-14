import {Component, OnInit, OnDestroy} from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs';
import { DialogSelect } from '../../modules/shared-module/system-lookup/system-lookup.component';
import { DialogComponent } from '../../modules/shared-module/dialog/dialog.component';
import {NotificationsService } from 'angular2-notifications';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Params, Router} from "@angular/router";
import { Subscription } from 'rxjs/Subscription';

import { SystemTenants } from '../../../../both/collections/systemTenants.collection';
import {Observable} from 'rxjs/Observable'
import { merge } from 'rxjs';

@Component({
  selector: 'developer-parent-tenant',
  template: `
    <mat-card class="box">
      <h2>
        {{tenant.name}}
        <a (click)="removeTenant()" style="cursor: pointer">
          <i class="material-icons">delete</i>
        </a>
      </h2>

      <section>
        <mat-tab-group>
          <mat-tab label="Tenant Info">
            <div>
              <mat-form-field>
                <input matInput [(ngModel)]="tenant.name" name="name" type="text" placeholder="Name" (blur)="onBlurMethod($event.target)"
                       required #spy #nameLookup="ngModel">
              </mat-form-field>
              <div [hidden]="nameLookup.valid || nameLookup.pristine" [ngStyle]="{'color': 'red'}">
                Name is required
              </div>
              <br>

              <mat-form-field>
                <input matInput [(ngModel)]="tenant.logo" name="logo" type="text" placeholder="Logo" (blur)="onBlurMethod($event.target)"
                       #labelLookup="ngModel">
              </mat-form-field>
              <br>
              <mat-form-field>
                <input matInput [(ngModel)]="tenant.scheme" name="scheme" type="text" placeholder="Scheme" (blur)="onBlurMethod($event.target)"
                       #labelLookup="ngModel">
              </mat-form-field>
              <mat-form-field>
                <input matInput (click)="openDialog()" [(ngModel)]="moduleNames" name="modules" type="text" placeholder="Modules" #labelLookup="ngModel" readonly>
              </mat-form-field>
              <mat-form-field>
                <input matInput [(ngModel)]="tenant.city" name="city" type="text" placeholder="City" (blur)="onBlurMethod($event.target)"
                       #labelLookup="ngModel">
              </mat-form-field>
              <mat-form-field>
                <input matInput [(ngModel)]="tenant.address1" name="address1" type="text" placeholder="Address1" (blur)="onBlurMethod($event.target)"
                       #labelLookup="ngModel">
              </mat-form-field>
            </div>

            <br>
          </mat-tab>
          <!-- <mat-tab label="Email">
          </mat-tab> -->
        </mat-tab-group>

        <br>
        <!--<a mat-raised-button color="warn" *ngIf="developer || !default" (click)="deleteLookup()">Delete</a>-->
      </section>
    </mat-card>
  `,
  styleUrls: ['developer.scss']
})

export class DeveloperParentTenantPage implements OnInit, OnDestroy{
  data: any={};

  documentId: string = '';
  parentTenantId: string = '';
  moduleNames: any;
  name: string = '';
  email: any = {};
  start: boolean = false;
  status: string = '';
  tenant: any = {};
  observeSubscriptions: Subscription[] = []; // all subscription handles

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private _service: NotificationsService, private dialog: MatDialog) {}


  ngOnInit() {


    this.activatedRoute.params.subscribe((params: Params) => {
      this.documentId = params['documentId'];
      this.documentId = this.documentId;
      let options = {};
      const subscription = MeteorObservable.subscribe('systemTenants', {_id: this.documentId});
      const autorun = MeteorObservable.autorun();

      this.observeSubscriptions[0] = merge(subscription, autorun).subscribe(() => {
        let tenant = SystemTenants.collection.findOne(this.documentId);
        if (tenant) {
          this.tenant = tenant;
          MeteorObservable.call('returnPermissionNames', tenant.modules).subscribe(moduleNames => {
            this.moduleNames = moduleNames;
          })
        }

      });

      // MeteorObservable.autorun().subscribe(() => {
      //   let result = SystemTenants.collection.findOne({_id: this.documentId}, options);
      //   if (result) {
      //     this.tenant = result;
      //     MeteorObservable.call('returnPermissionNames', result.modules).subscribe(moduleNames => {
      //       this.moduleNames = moduleNames;
      //     })
      //   }
      //
      // })
    });
  }

  onSelect(event) {
  }

  startCron() {
    Meteor.call('startCron');
  }

  stopCron() {
    Meteor.call('stopCron');

  }
  onBlurMethod(target){
    let field = target.name;
    let value = target.value;
    let query = {
      _id: this.documentId
    }
    let update = {
      $set: {
        [field]: value
      }
    };
    MeteorObservable.call('update', 'systemTenants', query, update).subscribe(res => {
    })
  }

  removeTenant() {
    let dialogRef = this.dialog.open(DialogSelect);
    dialogRef.afterClosed().subscribe(result => {
      if (result.value) {

        let query = {
          _id: this.documentId
        };
        let update = {
          $set: {
            removed: true
          }
        };
        MeteorObservable.call('update', 'systemTenants', query, update).subscribe(res => {
          this._service.success(
            'Success',
            'Removed Successfully'
          );
          this.router.navigate(['/admin/tenants']);
        });

      }
    });
  }

  openDialog() {
    if (this.documentId === this.documentId) {
      let dialogRef = this.dialog.open(DialogComponent);
      dialogRef.componentInstance['lookupName'] = 'manageTenantModules';
      dialogRef.componentInstance['documentId'] = this.documentId;
    }
  }

  ngOnDestroy() {

  }
}