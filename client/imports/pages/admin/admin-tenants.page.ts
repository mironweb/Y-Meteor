import { Component, OnInit } from '@angular/core';
import {MeteorObservable} from "meteor-rxjs";
import { Session } from 'meteor/session';
import {NotificationsService } from 'angular2-notifications';
import {MatDialog} from '@angular/material';

import {FilterDialogComponent} from '../../modules/shared-module/filterDialog/filterDialog.component';

import { Router } from '@angular/router';

@Component({
  selector: 'admin-tenants',
  templateUrl: 'admin-tenants.page.html',
  styleUrls: [ 'admin.scss' ]
})

export class AdminTenantsPage implements OnInit{
  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };
  filterConditions: any;

  states = [];

  dataObj: {};

  hideTable: boolean = false;
  hideAddForm: boolean = true;

  tenantNameInput: string;
  tenantAddress1Input: string;
  tenantAddress2Input: string;
  cityInput: string;
  zipCodeInput: string;
  stateInput: string;

  stateError: boolean = true;

  constructor(private router: Router, private _service: NotificationsService, public dialog: MatDialog) {}

  ngOnInit() {
    MeteorObservable.call('findOne', 'systemOptions', {name: 'states'}, {}).subscribe((res:any) => {
      this.states = res.value;
    })

  }

  checkIfNumber(event: any) {
    const pattern = /[0-9\+\-\ ]/;
    let inputChar = String.fromCharCode(event.charCode);

    if (!pattern.test(inputChar)) {
      // invalid character, prevent input
      event.preventDefault();
    }
  }

  stateSelection() {
    this.stateError = false;
  }

  addTenant() {
    this.dataObj = {
      parentTenantId: Session.get('parentTenantId'),
      name: this.tenantNameInput,
      address1: this.tenantAddress1Input,
      address2: this.tenantAddress2Input,
      city: this.cityInput,
      zip: this.zipCodeInput,
      state: this.stateInput
    };

    this._service.success(
      "Tenant Added",
      this.tenantNameInput,
      {
        timeOut: 5000,
        showProgressBar: true,
        pauseOnHover: false,
        clickToClose: false,
        maxLength: 10
      }
    );
    this.stateInput = undefined;
    MeteorObservable.call('insertDocument', "systemTenants", this.dataObj).subscribe();

    this.hideAddForm = true;
    this.hideTable = false;
  }

  onSelect(event) {
    console.log('event)', event);
    this.router.navigate(['/admin/tenants',  event.value._id]).catch(error=>console.log(error));
  }

  addButton() {
    this.hideAddForm = false;
    this.hideTable = true;
  }

  openDialog() {
    if (this.hideTable === false) {
      let dialogRef = this.dialog.open(FilterDialogComponent);
      dialogRef.afterClosed().subscribe(event => {
        let result = true;
        if (event.value === true) {
          result = false;
        }
        this.data = {
          value : event.value,
          hidden: result
        }
      });
    }

    this.hideAddForm = true;
    this.hideTable = false;
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

  // onChange(event) {
  //   let result = true;
  //   if (event === true) {
  //     result = false;
  //   }
  //   this.data = {
  //     value : event,
  //     hidden: result
  //   }
  // }

}
