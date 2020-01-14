import { Component, OnInit } from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs';
import { ActivatedRoute, Params, Router} from "@angular/router";
import {NotificationsService } from 'angular2-notifications';
import { MatDialog } from '@angular/material';

import { SystemTenants } from '../../../../both/collections/systemTenants.collection';
import { DialogSelect } from '../../modules/shared-module/system-lookup/system-lookup.component';
import * as funcs from '../../../../both/functions/common';

import { merge } from "rxjs";

@Component({
  selector: 'admin-tenant',
  templateUrl: 'admin-tenant.page.html',
  styleUrls: ['admin.scss']
})

export class AdminTenantPage implements OnInit{
  data: any={};

  documentId: string = '';
  parentTenantId: string = '';
  tenantId: string = '';
  moduleNames: any;
  name: string = '';
  email: any = {};
  start: boolean = false;
  status: string = '';
  tenant: any = {};
  parentTenant: any = {};

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private _service: NotificationsService, private dialog: MatDialog) {}


  ngOnInit() {

    this.parentTenantId = Session.get('parentTenantId');
    this.activatedRoute.params.subscribe((params: Params) => {
      this.documentId = params['documentId'];
      let query = {
        $or: [
          {
            _id: this.parentTenantId
          },
          {
            parentTenantId: this.parentTenantId
          }
        ]
      };
      const sub = MeteorObservable.subscribe('systemTenants', query);
      const autorun = MeteorObservable.autorun();

      merge(sub, autorun).subscribe(() => {
        const tenant = SystemTenants.collection.findOne({_id: this.documentId});
        const parentTenant = SystemTenants.collection.findOne({_id: this.parentTenantId});
        if (!funcs.isEmptyObject(tenant) && !funcs.isEmptyObject(parentTenant)) {
          this.tenant = tenant;
          this.parentTenant = parentTenant;
          MeteorObservable.call('returnPermissionNames', this.parentTenant.modules).subscribe(moduleNames => {
            this.moduleNames = moduleNames;
          });
        }
      })
    })
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
}
