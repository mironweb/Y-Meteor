import { Component, OnInit } from '@angular/core';
import { MeteorObservable } from 'meteor-rxjs';
import { ActivatedRoute, Router} from "@angular/router";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import ExecutiveComponents from "../executive";
import AdminComponents from "../admin";
import CustomerComponents from "../customers";
import InventoryComponents from "../inventory";
import * as funcs from '../../../../both/functions/common';
import {SystemOptionsService} from "../../services/SystemOptions.service";

@Component({
  selector: 'developer-urltool',
  template: `
    <form [formGroup]="form" novalidate (submit)="submit(form.value, form.valid)">
      <div>
        <label>Create Url Tool</label>
        <mat-form-field>
          <input matInput formControlName="url" type="text" placeholder="url" name="url" value="">
        </mat-form-field>
        <small color="red" [hidden]="form.controls.url.valid || (form.controls.url.pristine)">
          url required
        </small>
        <mat-form-field>
          <input matInput formControlName="sidenavLabel" type="text" placeholder="sidenav Label" value="" >
        </mat-form-field>
        <mat-form-field>
          <input matInput formControlName="pageHeader" type="text" placeholder="pageHeader" value="" >
        </mat-form-field>
        <small [hidden]="form.controls.pageHeader.valid || (form.controls.pageHeader.pristine)">
          pageHeader required
        </small>
        

        <mat-form-field style="width: 200px">
          <mat-select  placeholder="Permission" formControlName="selectedPermission" (selectionChange)="onPermissionChange($event)">
            <mat-option *ngFor="let permission of permissions" [value]="permission">
              {{permission.name}}
            </mat-option>
          </mat-select>
        </mat-form-field>
        <br>
        <mat-form-field style="width: 200px">
          <mat-select placeholder="Component" formControlName="selectedComponent">
            <mat-option *ngFor="let component of components" [value]="component.name">
              {{component.name}}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <button mat-raised-button type="submit">Submit</button>
    </form>
  `
})

export class DeveloperUrltoolPage implements OnInit{
  data: any={};
  name: string = '';
  email: any = {};
  start: boolean = false;
  status: string = '';
  alert: any = {};
  components:any = [];
  permissions:any = [];
  modules = [];
  newUrl:any;

  public form: FormGroup;


  constructor(private router: Router, private activatedRoute: ActivatedRoute,
              private _fb: FormBuilder,
              private systemOptionsService: SystemOptionsService
  ) {
  }


  ngOnInit() {
    this.modules = [
      {
        name: 'Customers',
        components: CustomerComponents,
        path: '/pages/customer'
      },
      {
        name: 'Inventory',
        components: InventoryComponents,
        path: '/pages/inventory'
      },
      {
        name: 'Administrator',
        components: AdminComponents,
        path: '/pages/admin'
      },
      {
        name: 'Executive',
        components: ExecutiveComponents,
        path: '/pages/executive'
      }
    ];

    this.form = this._fb.group({
      url: ['', <any>Validators.required],
      pageHeader: ['', <any>Validators.required],
      sidenavLabel: ['', Validators.required],
      selectedComponent: ['', <Object>Validators.required],
      selectedPermission: [{}],
    });


    this.getParentTenantPermissions();

    // this.subscribeToModuleChange(modules);


    // this.form.controls['urltool'].patchValue({url: ''});
  }

  async getParentTenantPermissions() {
    let parentTenantId = Session.get('parentTenantId');
    this.permissions = await funcs.callbackToPromise(MeteorObservable.call('getParentTenantPermissions', parentTenantId));
  }

  subscribeToModuleChange(modules) {
    this.form.get('selectedModule').valueChanges.subscribe(data => {
      let index = modules.findIndex(module => {
        if (module.name == data) {
          return true;
        }
      });
      if (index > -1) {
        let moduleComponents =  modules[index].components;
        this.components = [];
        this.form.controls['selectedComponent'].patchValue('');
        Object.keys(moduleComponents).forEach((key => {
          this.components.push({
            name: key,
            component: moduleComponents[key]
          });
        }))
      }
    })
  }

  async submit(form, valid){

    if (valid) {
      // add obj to routes module route

      let systemOption:any = await funcs.getSystemOption({name: 'routes', parentTenantId: Session.get('parentTenantId')});

      let index = systemOption.value.findIndex(moduleRoute => {
        return moduleRoute.permissionId == this.newUrl.modulePermissionId;
      });

      if (index > -1) {

        let query = {
          _id: systemOption._id
        };
        let newObj = {
          permissionId: form.selectedPermission._id,
          pageHeader: form.pageHeader,
          sidenavLabel: form.sidenavLabel,
          url: form.url,
          component: form.selectedComponent
        };
        systemOption.value[index].routes.push(newObj);
        let update = {
          $set: {
            value: systemOption.value
          }
        };

        let result = await funcs.update('systemOptions', query, update);
        console.log('result');
      } else {

      }






      // link and enable the permission
      /*
      do it in the app
       */



      // add url in the sidenav
      // this.addUrlInSidenav(module);









    } else {
      console.error('not valid');
    }


  }

  async onPermissionChange(e) {
    console.log('e', e);
    let result:any = await funcs.callbackToPromise(MeteorObservable.call('getModuleByPermissionId', e.value._id));

    this.newUrl = result[0];
    let index = this.modules.findIndex(module => {
      if (module.name == this.newUrl.moduleName) {
        return true;
      }
    });

    if (index > -1) {
      let moduleComponents =  this.modules[index].components;
      this.components = [];
      this.form.controls['selectedComponent'].patchValue('');
      Object.keys(moduleComponents).forEach((key => {
        this.components.push({
          name: key,
          component: moduleComponents[key]
        });
      }))
    }
  }

  async addUrlInSidenav(module) {
    /*
      {
            "permissionId" : "p7ghZfZSs2NjykXxs",
            "permissionName" : "manageExecutiveModule",
            "name" : "executive",
            "label" : "Executive",
            "subMenus" : [
                {
                    "permissionId" : "64CfzML7deigybTzE",
                    "permissionName" : "viewExecDashboard",
                    "label" : "Dashboard",
                    "name" : "dashboard",
                    "url" : "executive/dashboard"
                }
            ]
        },
       */

    let query = {isModulePermission: true, moduleId: module._id, parentTenantId: Session.get('parentTenantId')};

    const modulePermission = await funcs.getPermission(query);
    let obj = {
      permissionId: '',
      name: 'executive',
      label: 'Executive',
      url: 'executive',
      subMenus: [
        {
          permissionId: "",
          label: 'Dashboard',
          name: 'dashboard',
          url: 'dashboard'
        }
      ]
    };


  }

}
