import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserGroups } from '../../../../both/collections/userGroups.collection';
import { SystemPermissions } from '../../../../both/collections/systemPermissions.collection';
import {NotificationsService } from 'angular2-notifications';
import * as _ from "underscore";
import { MatDialog } from '@angular/material';

import 'rxjs/add/operator/map';
import {MeteorObservable} from "meteor-rxjs";
import { DialogSelect } from '../../modules/shared-module/system-lookup/system-lookup.component';
import { DialogComponent } from '../../modules/shared-module/dialog/dialog.component';

@Component({
  selector: 'admin-group',
  template: `
    <mat-card>
      <h2>{{this.name}}
        <a (click)="openDialog()" style="cursor: pointer"><i class="material-icons">delete</i></a>
      </h2>
      <mat-tab-group>
        <mat-tab label="Permissions">
          <!--<mat-card>-->
            <!--<system-lookup [lookupName]="'manageGroupPermissions'" [documentId]="documentId"></system-lookup>-->
            <!--<br>-->
            <!--<button mat-raised-button color="primary" (click)="addPermission()">Add Permission</button>-->
          <!--</mat-card>-->
          <mat-card>
            <div class="actions">
              <button class="reload-permission-button" color="primary"
                mat-raised-button (click)="reloadTreeAndForm()">
                Reload
              </button>
            </div>
            <div class="permissions-wrapper">
              <treenav (select)="showPermissionForm($event)" #permissionTree>
              </treenav>
              <div class="side-panel">
                <div class="sticky">
                  <group-permission-form [groupId]="documentId"
                    [permissionId]="selectedPermission._id"
                    *ngIf="selectedPermission">
                  </group-permission-form>
                </div>
              </div>
            </div>
          </mat-card>
        </mat-tab>
        <mat-tab label="Edit">
          <form (ngSubmit)="onSubmit()" #editGroupForm="ngForm">
            <mat-form-field class="inputContainer">
              <input matInput id="nameInput" name="name" type="text" placeholder="Name" [(ngModel)]="nameInput"
                     required #spy #groupEdit="ngModel" (blur)="save()" (keyup)="groupExist()">
            </mat-form-field>
            <small [hidden]="groupEdit.valid || groupEdit.pristine" [ngStyle]="{'color': 'red'}">
              Name is required
            </small>
            <small *ngIf="groupExistError" [ngStyle]="{'color': 'red'}">
              Name already taken
            </small>
            <br>
          </form>
        </mat-tab>
      </mat-tab-group>
    </mat-card>
  `,
  styleUrls: ['admin.scss', 'admin-group.page.scss']
})

export class AdminGroupPage implements OnInit{

  @Input() data: any;
  documentId: string;
  nameInput: string;
  name: string;
  groupArray: any;
  groupNameArray: any[];
  groupExistError: boolean = false;

  fromCollection: any;
  updateCollection: any;
  lookupName: string;

  dataObj: {}

  // tree-related vars
  @ViewChild('permissionTree') permissionTree: any;
  selectedPermission: any = null;

  public options = {
    timeOut: 5000,
    lastOnBottom: true,
    clickToClose: true,
    maxLength: 0,
    maxStack: 7,
    showProgressBar: true,
    pauseOnHover: true,
    preventDuplicates: false,
    preventLastDuplicates: 'visible',
    rtl: false,
    animate: 'scale',
    position: ['right', 'bottom']
  };

  constructor(private route: ActivatedRoute, private dialog: MatDialog, private router: Router, private _service: NotificationsService) {}

  ngOnInit() {
    this.route.params.subscribe((params: Params) => {
     this.documentId = params['documentId'];
    });

    this.groupNameArray = [];
    MeteorObservable.call('find', 'userGroups', {parentTenantId: Session.get('parentTenantId')}).subscribe(groupInfo => {
      this.groupArray = groupInfo

      for (let i = 0; i < this.groupArray.length; i++) {
          this.groupNameArray.push(this.groupArray[i].name)
      }
    })

    this.lookupName = 'manageGroupPermissions';
    this.fromCollection = SystemPermissions;
    this.updateCollection = UserGroups;
    this.documentId =  this.documentId;

    MeteorObservable.call('findOne', 'userGroups', {_id: this.documentId}).subscribe(groupInfo => {
      this.nameInput = groupInfo["name"]

      this.name = this.nameInput
    })
  }

  groupExist(){
    this.groupExistError = _.contains(this.groupNameArray, this.nameInput) ? true : false;
  }

  save(){
    if (this.nameInput.length > 0 && this.groupExistError !== true) {
      this.dataObj = {
        id: this.documentId,
        name: this.nameInput
      }

      if (this.nameInput !== this.name) {
        this._service.success(
          "Group Updated",
          this.nameInput,
          {
            timeOut: 5000,
            showProgressBar: true,
            pauseOnHover: false,
            clickToClose: false,
            maxLength: 10
          }
        );
        MeteorObservable.call('adminUpdateGroup', this.dataObj).subscribe(groupInfo => {})
        this.name = this.nameInput
      }
    }
  }

  addPermission() {
    let dialogRef = this.dialog.open(DialogComponent);
    dialogRef.componentInstance['lookupName'] = 'addGroupPermission';
    dialogRef.componentInstance['isModal'] = true;

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let query = {
          _id: this.documentId,
          groupPermissions: {
            $elemMatch: {
              _id: result._id
            }
          }
        }
        MeteorObservable.call('findOne', 'userGroups', query, {}).subscribe((res:any) => {
          // let groupPermissions = res.groupPermissions;
          // let exist = false;
          // groupPermissions.some(groupPermission => {
          //   if (groupPermission.name === result.name) {
          //     exist = true;
          //     return true;
          //   }
          // });
          // if (exist) {
          //   this._service.error('Failed', 'already exist');
          // } else {
            let update = {
              $addToSet: {
                groupPermissions: {
                  _id: result._id,
                  value: "enabled"
                }
              }
            }
          //
            MeteorObservable.call('update', 'userGroups', {_id: this.documentId}, update).subscribe(res => {
              this._service.success('Success', 'Update Successfully');
            })
          // }

        })
      }
    });

  }

  openDialog() {
    let dialogRef = this.dialog.open(DialogSelect);
    dialogRef.afterClosed().subscribe(result => {
      if (result.value) {
        this.removeGroup();
      }
    });
  }

  onSubmit() {

  }


  removeGroup(){
    MeteorObservable.call('softDeleteDocument', "userGroups", this.documentId).subscribe(groupInfo => {})
    MeteorObservable.call('removeGroupFromUserCollection', this.documentId).subscribe(groupInfo => {})

    this._service.success(
      "Group Removed",
      this.nameInput,
      {
        timeOut: 5000,
        showProgressBar: true,
        pauseOnHover: false,
        clickToClose: false,
        maxLength: 10
      }
    )

    this.router.navigate(['/admin/groups/']);
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
