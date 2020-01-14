import { Component, OnInit, Input, ViewChild } from '@angular/core';
import {MeteorObservable} from "meteor-rxjs";
import {MatDialog} from '@angular/material';
import {NotificationsService} from 'angular2-notifications';
import { Session } from 'meteor/session';

import {FilterDialogComponent} from '../../modules/shared-module/filterDialog/filterDialog.component';
import { DialogComponent } from '../../modules/shared-module/dialog/dialog.component';

import * as _ from "underscore";
import { Router } from '@angular/router';

@Component({
  selector: 'admin-permissions',
  templateUrl: 'admin-permissions.page.html',
  styleUrls: ['admin.scss', 'admin-permissions.page.scss']
})

export class AdminPermissionsPage implements OnInit{

  @Input()
  permission: any = {};
  permissionArray: any;
  permissionNameArray: any[];
  permissionURLArray: any[];
  filterConditions: any;

  hideTable: boolean = false;
  hideAddForm: boolean = true;

  nameExistError: boolean = false;
  URLExistError: boolean = false;
  valid: boolean = false;

  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };

  moduleName: any = [];

  // tree-related vars
  @ViewChild('permissionTree') permissionTree: any;
  selectedPermission: any = null;

  constructor(public dialog: MatDialog, private router: Router, private _service: NotificationsService) {}

  ngOnInit() {

    this.permissionNameArray = [];
    this.permissionURLArray = [];

    MeteorObservable.call('find', 'systemPermissions', {parentTenantId: Session.get('parentTenantId')}).subscribe(permissionInfo => {
      this.permissionArray = permissionInfo;

      for (let i = 0; i < this.permissionArray.length; i++) {
          this.permissionNameArray.push(this.permissionArray[i].name);
          this.permissionURLArray.push(this.permissionArray[i].url);
      }
    })

  }


  nameExist(){
    this.nameExistError = _.contains(this.permissionNameArray, this.permission.name);
  }

  urlExist(){
    this.URLExistError = _.contains(this.permissionURLArray, this.permission.url);

    if (!this.URLExistError) {
        this.valid = true;
    }

    if (this.permission.url === "") {
        this.valid = false
    }
  }

  urlInputBlur(){
    if (this.permission.url === "") {
        this.valid = false
    }
  }

  addButton() {
    this.hideAddForm = false;
    this.hideTable = true;
  }

  addPermission() {
    Object.assign(this.permission, {
      tenantId: Session.get('tenantId'),
      parentTenantId: Session.get('parentTenantId')
    });

    MeteorObservable.call('addPermission', this.permission).subscribe((res: any) => {
      if (typeof res == 'string') {
        this._service.success(
          "Permission Added",
          this.permission.name,
          {
            timeOut: 5000,
            showProgressBar: true,
            pauseOnHover: false,
            clickToClose: false,
            maxLength: 10
          }
        );
        this.router.navigate(['/admin/permissions/' + res]).catch(error=>console.log(error));
      }
    })

  }

  openDialog() {
    if (this.hideTable === false) {
    let dialogRef = this.dialog.open(FilterDialogComponent);
        dialogRef.afterClosed().subscribe(event => {
          let result = true;
          if (event === true) {
            result = false;
          }
          this.data = {
            value : event,
            hidden: result
          }
        });
      }
    this.hideAddForm = true;
    this.hideTable = false;
  }

  returnResult(event) {
    this.router.navigate(['/admin/permissions/' + event.value._id]).catch(error=>console.log(error));
  }

  onChange(event) {
    let result = true;
    if (event === true) {
      result = false;
    }
    this.data = {
      value : event,
      hidden: result
    }
  }

  manageModule() {
    let dialogRef = this.dialog.open(DialogComponent);
    dialogRef.componentInstance['lookupName'] = 'getModule';

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('reresult', result);
        this.moduleName = [];
        this.permission.moduleId = result.value._id;
        this.moduleName.push(result.value.name);
      }
    });
  }

  getFilterConditions(action) {
    this.reducers(action);
  }
  reducers(action) {
    switch(action.type) {
      case 'UPDATE_FILTERCONDITIONS':
        this.filterConditions = action.value;
        return;
      case 'ADD_FILTER':
        this.filterConditions = action.value;
        return;
      default:
        return;
    }
  }

  showPermissionForm(permission) {
    if (!permission) {
      this.selectedPermission = {};
    } else {
      this.selectedPermission = permission;
    }
  }

  onAction(type) {
    this.selectedPermission = null;
  }

  reloadTreeAndForm() {
    this.permissionTree.fetchData();
    this.selectedPermission = null;
  }
}
