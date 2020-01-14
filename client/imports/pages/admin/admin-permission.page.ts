import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import {NotificationsService } from 'angular2-notifications';
import 'rxjs/add/operator/map';
import {MeteorObservable} from "meteor-rxjs";
import { MatDialog } from '@angular/material';
import { SystemPermissions } from '../../../../both/collections/systemPermissions.collection';

import * as _ from "underscore";
import { DialogSelect } from '../../modules/shared-module/system-lookup/system-lookup.component';
import { DialogComponent } from '../../modules/shared-module/dialog/dialog.component';
import * as funcs from '../../../../both/functions/common';

import { Router } from '@angular/router';
import {SystemPermissionsService} from "../../services/SystemPermissions.service";

@Component({
  selector: 'admin-permission',
  template:`
    <mat-card>
      <section class="box" id="adminEachUser" >
        <h2>
          {{nameInput}}
          <a (click)="removePermission()" style="cursor: pointer"><i class="material-icons">delete</i></a>
        </h2>
        <mat-form-field class="inputContainer">
          <input matInput disabled id="nameInput" name="name"  type="text" placeholder="Name" [(ngModel)]="nameInput" (blur)="onBlurMethod()">
        </mat-form-field>
        <br>
        <form #permissionEditForm="ngForm">
          <mat-form-field class="inputContainer">
            <input matInput id="descriptionInput" name="description" type="text" placeholder="Description" [(ngModel)]="descriptionInput" (blur)="onBlurMethod()"
                   required #spy #permissionEditDescription="ngModel">
          </mat-form-field>
          <small [hidden]="permissionEditDescription.valid || permissionEditDescription.pristine" [ngStyle]="{'color': 'red'}">
            Description is required
          </small>
          <br>
          <mat-form-field class="inputContainer">
            <input matInput [class.valid]="valid" id="urlInput" name="url" type="text" placeholder="URL" [(ngModel)]="urlInput" (keyup)="urlExist()" (blur)="onBlurMethod()"
                   #spy #permissionEditURL="ngModel">
          </mat-form-field>
          <small *ngIf="URLExistError" [ngStyle]="{'color': 'red'}">
            URL already taken
          </small>
          <br>


          <!-- <button mat-raised-button color="primary" (click)="openDialog()">TEXT</button> -->
          <mat-form-field class="inputContainer cursor-pointer" (click)="manageModule()" >
            <input matInput class="cursor-pointer" [(ngModel)]="module.name" name="moduleName" type="text" placeholder="Module" #labelLookup="ngModel" readonly>
          </mat-form-field>
          <br>
          <button mat-raised-button (click)="addPermissionToGroups()">Add To All Groups</button>
        </form>
      </section>
    </mat-card>
  `,
  styleUrls: [ 'admin.scss' ]
})

export class AdminPermissionPage implements OnInit{

  documentId: string;
  name: string;
  description: string;
  url: string;
  nameInput: string;
  descriptionInput: string;
  urlInput: string;
  modules: any = [];
  module:any = {
    name: ''
  };

  URLArray: any;
  permissionURLArray: any[];
  URLExistError: boolean = false;

  dataObj: {};
  moduleNames: {};
  valid: boolean = true;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private dialog: MatDialog,
              private _service: NotificationsService,
              private systemPermissionsService: SystemPermissionsService
  ) {}

  ngOnInit() {
    this.permissionURLArray = [];

    this.route.params.subscribe((params: Params) => {
     this.documentId = params['documentId'];

     let query = {
       _id: this.documentId
     };
     let options = {};
     MeteorObservable.subscribe('systemPermissions', query, {}, '').subscribe();

     MeteorObservable.autorun().subscribe(async() => {
       let permission = SystemPermissions.collection.findOne(query);

       if (permission) {
         let query = {_id: permission.moduleId};
         let result = await funcs.callbackToPromise(MeteorObservable.call('findOne', 'systemModules', query));
         if (!funcs.isEmptyObject(result)) {
           this.module = result;
         }
       }


       // MeteorObservable.call('find', 'systemPermissions', query, options).subscribe(permissionInfo => {
       //   if (permissionInfo[0] !== undefined) {
       //     this.modules = permissionInfo[0].modules;
       //     if (this.modules) {
       //       MeteorObservable.call('returnPermissionNames', this.modules).subscribe(moduleNames => {
       //         this.moduleNames = "";
       //         this.moduleNames = moduleNames;
       //       });
       //     }
       //   }
       // })
     });
    });

    MeteorObservable.call('returnPermission', this.documentId).subscribe(permissionInfo => {
      if (permissionInfo !== undefined) {

        this.nameInput = permissionInfo["name"]
        this.descriptionInput = permissionInfo["description"]
        this.urlInput = permissionInfo["url"]

        this.name = this.nameInput
        this.description = this.descriptionInput
        this.url = this.urlInput
      } else {
        this.router.navigate(['/admin/permissions/'])
      }
    })

    MeteorObservable.call('getAllPermissionsUrl').subscribe(permissionInfo => {
      this.URLArray = permissionInfo

      for(var key in this.URLArray) {
        var value = this.URLArray[key];
        if (value !== "" && value !== this.urlInput) {
          this.permissionURLArray.push(value)
        }
      }
    })

  }

  urlExist(){
    this.URLExistError = _.contains(this.permissionURLArray, this.urlInput) ? true : false;

    this.valid = (!this.URLExistError) ? true : false;
  }

  onBlurMethod(){
    let nameInput = this.nameInput;
    let descriptionInput = this.descriptionInput;
    let urlInput = this.urlInput;

    if (urlInput === "") {
        this.valid = false
    }

    if (!this.URLExistError) {
      if ((nameInput !== "" && descriptionInput !== "" && urlInput !== "") &&
      (nameInput !== this.name || descriptionInput !== this.description || urlInput !== this.url)) {
        this.dataObj = {
          id: this.documentId,
          name: nameInput,
          description: descriptionInput,
          url: urlInput,
        }
        this._service.success(
          "Permission Updated",
          this.nameInput,
          {
            timeOut: 5000,
            showProgressBar: true,
            pauseOnHover: false,
            clickToClose: false,
            maxLength: 10
          }
        )
        MeteorObservable.call('adminUpdatePermission', this.dataObj).subscribe(permissionInfo => {})
        MeteorObservable.call('returnPermission', this.documentId).subscribe(permissionInfo => {
          this.name = permissionInfo["name"]
          this.description = permissionInfo["description"]
          this.url = permissionInfo["url"]
        })
      }
    }
  }

  removePermission(){
    let dialogRef = this.dialog.open(DialogSelect);
    dialogRef.afterClosed().subscribe(result => {
      if (result.value) {
        let permissionName = this.nameInput
        MeteorObservable.call('softDeleteDocument', "systemPermissions", this.documentId).subscribe(updateInfo => {})
        // MeteorObservable.call('adminRemovePermissions', this.permissionID).subscribe(updateInfo => {})
        MeteorObservable.call('adminRemoveGroupsPermissions', permissionName).subscribe(updateInfo => {
          this._service.success(
            "Permission Removed",
            this.nameInput,
            {
              timeOut: 5000,
              showProgressBar: true,
              pauseOnHover: false,
              clickToClose: false,
              maxLength: 10
            }
          )
          this.router.navigate(['/admin/permissions/']);
        });
      }
    });

  }

  manageModule() {
    let dialogRef = this.dialog.open(DialogComponent);
    dialogRef.componentInstance['lookupName'] = 'managePermissionModule';
    dialogRef.componentInstance['documentId'] = this.documentId;

    dialogRef.afterClosed().subscribe(result => {
      if (result) {

        let query = {
          _id: this.documentId
        };

        // let update = {
        //   $set: {
        //     moduleId:
        //   }
        // };
        //
        // MeteorObservable.call('update', 'systemPermissions', query, update).subscribe(res => {
        //   this._service.success('Success', 'Update Successfully');
        // })




        // MeteorObservable.call('findOne', 'systemPermissions', query, {}).subscribe((res:any) => {
        //   let modules = res.modules;
        //   let exist = false;
        //
        //   modules.some(module => {
        //     if (module === result._id) {
        //       exist = true;
        //     }
        //   });
        //
        //   if (exist) {
        //     this._service.error('Failed', 'already exist');
        //   } else {
        //     let update = {
        //       $addToSet: {
        //         modules: result._id
        //       }
        //     }
        //
        //     MeteorObservable.call('update', 'systemPermissions', query, update).subscribe(res => {
        //       this._service.success('Success', 'Update Successfully');
        //     })
        //   }
        //
        // });
      }
    });
  }

  addPermissionToGroups() {
    this.systemPermissionsService._addPermissionToGroups$(this.documentId)
      .subscribe(res => {});
  }
}
