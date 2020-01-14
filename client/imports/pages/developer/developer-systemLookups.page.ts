import { Component, OnInit } from '@angular/core';
import { SystemLookups } from '../../../../both/collections/systemLookups.collection';
import {NotificationsService } from 'angular2-notifications';
import {MatDialog} from '@angular/material';
import {FilterDialogComponent} from '../../modules/shared-module/filterDialog/filterDialog.component';
import {MeteorObservable} from "meteor-rxjs";
import { Router } from '@angular/router';

@Component({
  selector: 'developer-systemLookups',
  templateUrl: 'developer-systemLookups.page.html',
  styleUrls: [ 'developer.scss' ]
})

export class DeveloperSystemLookupsPage implements OnInit {

  systemLookupCollections: any[];
  systemLookupLookupName: string;
  filterConditions: any;

  dataObj: {};

  hideTable: boolean = false;
  hideAddForm: boolean = true;

  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };

  validJsonErrorSubs: boolean = true;
  validJsonErrorMethods: boolean = true;
  validJsonErrorDataTable: boolean = true;

  nameInput: string;
  // collectionInput: string;
  labelInput: string;
  searchable: boolean;
  subscriptionsInput: string;
  methodsInput: string;
  dataTableInput: string;


  constructor(private router: Router, private _service: NotificationsService, public dialog: MatDialog) {
  }

  ngOnInit() {
    this.systemLookupCollections = [SystemLookups];
    this.systemLookupLookupName = 'developersystemLookup';
  }

  validJsonSubs() {
    try {
      JSON.parse(this.subscriptionsInput);
    } catch (e) {
      return this.validJsonErrorSubs = false;
    }
    return this.validJsonErrorSubs = true;
  }

  validJsonMethods() {
    try {
      JSON.parse(this.methodsInput);
    } catch (e) {
      return this.validJsonErrorMethods = false;
    }
    return this.validJsonErrorMethods = true;
  }

  validJsonDataTable() {
    try {
      JSON.parse(this.dataTableInput);
    } catch (e) {
      return this.validJsonErrorDataTable = false;
    }
    return this.validJsonErrorDataTable = true;
  }

  addLookup() {
    let searchable = false;

    if (this.searchable === true) {
      searchable = true
    }

    let subscriptions = JSON.parse(this.subscriptionsInput);
    let methods = JSON.parse(this.methodsInput);
    let dataTable = JSON.parse(this.dataTableInput);

    this.dataObj = {
      name: this.nameInput,
      label: this.labelInput,
      searchable: searchable,
      subscriptions,
      methods,
      dataTable,
      tenantId: Session.get('tenantId'),
      parentTenantId: Session.get('parentTenantId'),
    };
    MeteorObservable.call('insertDocument', "systemLookups", this.dataObj).subscribe();

    this._service.success(
      "Lookup Added",
      this.nameInput,
      {
        timeOut: 5000,
        showProgressBar: true,
        pauseOnHover: false,
        clickToClose: false,
        maxLength: 10
      }
    );

    // this.router.navigate(['/admin/lookup/'])
    this.hideAddForm = true;
    this.hideTable = false;
  }

  returnResult(event) {
    this.router.navigate(['/admin/lookup/' + event._id]).catch(error => console.log(error));
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
          value: event,
          hidden: result
        }
      });
    }

    this.hideAddForm = true;
    this.hideTable = false;
  }

  addButton() {
    this.hideAddForm = false;
    this.hideTable = true;
    // this.router.navigate(['/admin/users/' + event._id]);
  }

  getFilterConditions(action) {
    this.reducers(action);
  }

  reducers(action) {
    switch (action.type) {
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
}
