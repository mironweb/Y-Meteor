import { Component, OnInit, Input } from '@angular/core';
import {NotificationsService} from 'angular2-notifications';
import {MeteorObservable} from "meteor-rxjs";
import * as _ from "underscore";
import { Session } from 'meteor/session';
import {MatDialog} from '@angular/material';

import {FilterDialogComponent} from '../../modules/shared-module/filterDialog/filterDialog.component';

import { Router } from '@angular/router';

@Component({
  selector: 'admin-groups',
  template: `
    <mat-card class="box">
      <!-- <h2>Groups <i class="material-icons" style="cursor:pointer;"(click)="openDialog()">list</i></h2> -->
      <div>
        <!--<button mat-raised-button color="primary" (click)="openDialog()">Filter</button>-->
        <button mat-raised-button color="primary" (click)="addButton()">Add Groups</button>
      </div>
      <div>
        <filterBox-component (filter)="getFilterConditions($event)" [lookupName]="'userGroups'"></filterBox-component>
      </div>

      <div [hidden]="hideTable">
        <system-lookup [lookupName]="'userGroups'" (onSelected)="returnResult($event)" [(data)]="data" [(filterConditions)]="filterConditions">></system-lookup>
      </div>
      <div [hidden]="hideAddForm">
        <form (ngSubmit)="addGroup(); groupForm.reset()" #groupForm="ngForm">
          <mat-form-field class="inputContainer">
            <input matInput id="nameInput" name="name" type="text" placeholder="Name" [(ngModel)]="nameInput" (keyup)="groupExist()" required #spy #name="ngModel">
          </mat-form-field>
          <small [hidden]="name.valid || name.pristine" [ngStyle]="{'color': 'red'}">
            Name is required
          </small>
          <small *ngIf="groupExistError" [ngStyle]="{'color': 'red'}">
            Name already taken
          </small>
          <!-- TODO: remove this: {{spy.className}} -->
          <br>
          <button mat-raised-button [disabled]="!groupForm.form.valid || groupExistError" color="warn" type="submit">Add Group</button>
        </form>
      </div>

      <!-- <mat-tab-group>
        <mat-tab label="Groups">
          <system-lookup [lookupName]="'userGroups'" (onSelected)="returnResult($event)" [(data)]="data">></system-lookup>
        </mat-tab>
        <mat-tab label="Create Group">
  
          <form (ngSubmit)="addGroup(); groupForm.reset()" #groupForm="ngForm">
            <mat-form-field class="inputContainer">
              <input matInput id="nameInput" name="name" type="text" placeholder="Name" [(ngModel)]="nameInput" (keyup)="groupExist()" required #spy #name="ngModel">
            </mat-form-field>
            <div [hidden]="name.valid || name.pristine" [ngStyle]="{'color': 'red'}">
              Name is required
            </div>
            <div *ngIf="groupExistError" [ngStyle]="{'color': 'red'}">
                Name already taken
            </div> -->
      <!-- TODO: remove this: {{spy.className}} -->
      <!-- <br>
      <button mat-raised-button [disabled]="!groupForm.form.valid || groupExistError" color="warn" type="submit">Add Group</button>
    </form>

  </mat-tab>
</mat-tab-group> -->
    </mat-card>
  `,
  styleUrls: [ 'admin.scss' ]
})

export class AdminGroupsPage implements OnInit{

  @Input()
  nameInput: string;
  groupExistError: boolean = false;
  permissionNameArray: any[];
  groupArray: any;
  groupNameArray: any[];
  dataObj: {};
  documentId: string;
  filterConditions: any;

  hideTable: boolean = false;
  hideAddForm: boolean = true;

  data: any = {
    value: {
      $in: [null, false]
    },
    hidden: true
  };

  constructor(private router: Router, private _service: NotificationsService, public dialog: MatDialog) {}

  ngOnInit() {

    this.groupNameArray = [];
    this.permissionNameArray = [];

    MeteorObservable.autorun().subscribe(() => {
      if (Session.get('parentTenantId')) {
        MeteorObservable.call('find', 'userGroups', {parentTenantId: Session.get('parentTenantId')}, {fields: {name: 1}}).subscribe(groupInfo => {
          this.groupArray = groupInfo;

          for (let i = 0; i < this.groupArray.length; i++) {
            this.groupNameArray.push(this.groupArray[i].name)
          }
        });

        MeteorObservable.call('getTenantPermissions', Session.get('parentTenantId')).subscribe((res:any =[]) => {
          res.forEach(permission => {
            this.permissionNameArray.push({"_id": permission._id, "value": ""});
          })
        });
      }
    })
  }

  groupExist(){
    this.groupExistError = _.contains(this.groupNameArray, this.nameInput);
  }

  returnResult(event) {
    this.documentId = event.value._id;
    this.router.navigate(['/admin/groups/' + event.value._id]).catch(error=>console.log(error));
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

  addGroup (){
    this.dataObj = {
      parentTenantId: Session.get('parentTenantId'),
      name: this.nameInput,
      groupPermissions: this.permissionNameArray
    };


    this._service.success(
      "Group Added",
      this.nameInput,
      {
        timeOut: 5000,
        showProgressBar: true,
        pauseOnHover: false,
        clickToClose: false,
        maxLength: 10
      }
    );

    MeteorObservable.call('addGroup', this.dataObj).subscribe(groupId => {
      this.router.navigate(['/admin/groups/' + groupId]).catch(error => console.log(error));
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

}
