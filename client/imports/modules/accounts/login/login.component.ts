import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { Subscription } from 'rxjs/Subscription';

import { NotificationsService } from 'angular2-notifications';
import { UserService } from "../../../services/UserService";
import {UserGroupsService} from "../../../services/UserGroups.service";
import {concat} from "rxjs/observable/concat";
import {SystemLogsService} from "../../../services/SystemLogs.service";
import {SystemPermissionsService} from "../../../services/SystemPermissions.service";
import {SystemOptionsService} from "../../../services/SystemOptions.service";
import * as funcs from "../../../../../both/functions/common";
import {SystemTenantService} from "../../../services/SystemTenant.service";
import {PrintService} from "../../../services/Print.service";

@Component({
  selector: 'login',
  templateUrl: "login.component.html",
  styleUrls: ['login.component.scss']
})


export class LoginComponent implements OnInit {
  email: string = '1212';
  password: string = '1212';
  loginForm: FormGroup;
  error: string;
  subscriptions: Subscription[] = [];
  isSigning: boolean = false;
  public options = {
    timeOut: 5000,
    lastOnBottom: true,
    clickToClose: true,
    maxLength: 0,
    maxStack: 7,
    showProgressBar: true,
    pauseOnHover: true,
    preventDuplicates: false,
    rtl: false,
    animate: 'scale',
    position: ['bottom', 'right']
  };

  constructor(
    private router: Router,
    private zone: NgZone,
    private formBuilder: FormBuilder,
    private _service: NotificationsService,
    private userService: UserService,
    private userGroupService: UserGroupsService,
    private systemLogService: SystemLogsService,
    private systemPermissionsService: SystemPermissionsService,
    private systemOptionsService: SystemOptionsService,
    private systemTenantService: SystemTenantService,
    private printService: PrintService
  ) {

    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required]
    });
  }
  ngOnInit() {
    console.log('login');
    this.error = '';

    if (Meteor.userId()) {
      this.router.navigate(['/']);
    }
  }

  uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  validate() {
    const errors = [];

    const emailField = this.loginForm.get('email');
    if (emailField.invalid && emailField.errors.required) {
      errors.push('Email is required.');
    }

    const passwordField = this.loginForm.get('password');
    if (passwordField.invalid && passwordField.errors.required) {
      errors.push('Password is required.');
    }

    return errors;
  }

  login() {
    const errors = this.validate();
    if (errors.length) {
      this._service.error('Validation', errors.join('<br>'));
      return;
    }

    this.isSigning = true;
    if (this.loginForm && this.loginForm.valid) {
      Meteor.loginWithPassword(this.loginForm.value.email, this.loginForm.value.password, (err) => {
        this.zone.run(async () => {
          if (err) {
            this.isSigning = false;
            this.error = err;
            this._service.error('Failed', err.reason);
          } else {
            if (Meteor.userId()) {
              localStorage.setItem('sessionId', funcs.uuidv4());
              // console.log('set new sessionId');
              let result = await concat(
                this.userService.loadCurrentUser(),
                this.systemTenantService._loadCurrentSystemTenant$(),
                this.userGroupService.loadCurrentUserGroup(),
                this.systemPermissionsService._loadAllGroupsPermissions$(),
                this.systemOptionsService._loadModulesRoutes(),
                this.systemLogService.loadCurrentUserSystemLog(),
                this.printService._loadPrinters$()
              ).toPromise().catch(error => console.log(error));
                // .subscribe(res => {
                //   // console.log("res", res)
              let user = Meteor.user();
              // console.log('user', user);
              user.profile.homepage ? this.router.navigate([user.profile.homepage]) : this.router.navigate(['/']);
                // });
            }
          }
        })

      });
    }
  }
}