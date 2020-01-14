import { Component, OnInit, OnDestroy } from '@angular/core';
import { EventEmitterService } from '../../services';
import { MeteorObservable } from 'meteor-rxjs';
import { FormGroup, Validators, FormBuilder, AbstractControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Accounts } from 'meteor/accounts-base';
import * as funcs from '../../../../both/functions/common';
import {User} from "../../../../both/models/user.model";
import { NotificationsService } from 'angular2-notifications';

@Component({
  selector: 'account-settings',
  templateUrl: 'account-settings.page.html',
  styleUrls: ['account-settings.page.scss'],
})
export class AccountSettingsPage implements OnInit, OnDestroy {
  pageHeader: string = 'Settings';

  profile: any = {};
  menus: any = [];
  changePasswordForm: FormGroup;
  changePasswordFormErrors: any;

  public options = {
    timeOut: 5000,
    showProgressBar: true,
    pauseOnHover: false,
    clickToClose: false,
    maxLength: 10
  };


  // Private
  private _unsubscribeAll: Subject<any>;


  themes: any[] = [
    {value: 'default-theme', viewValue: 'Default'},
    {value: 'light-theme', viewValue: 'Light'},
    {value: 'dark-theme', viewValue: 'Dark'},
  ];
  emailTypes: any[] = [
    // value based on reference from meeting-notes.component.ts
    {value: 'Instantly', viewValue: 'Instantly'},
    // value based on reference from cronjob.ts
    {value: 'Summary', viewValue: 'Daily Summary'},
    {value: 'None', viewValue: 'None'},
  ];


  constructor(
    private changePasswordFormBuilder: FormBuilder,
    private notificationService: NotificationsService
  ) {

    // Set the defaults for change password
    this.changePasswordFormErrors = {
      oldPassword: {},
      newPassword: {},
      confirmPassword: {}
    };

    // Set the private defaults
    this._unsubscribeAll = new Subject();
  }

  ngOnInit() {
    EventEmitterService.Events.emit({pageHeader: this.pageHeader});
    this.getProfile();
    this.getMenus();

    this.changePasswordForm = this.changePasswordFormBuilder.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required, confirmPassword]]
    });

    this.changePasswordForm.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => {
        this.onResetPasswordFormValuesChanged();
      });
  }


  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  /**
   * On form values changed
   */


  onResetPasswordFormValuesChanged(): void {
    for (const field in this.changePasswordFormErrors) {
      if (!this.changePasswordFormErrors.hasOwnProperty(field)) {
        continue;
      }

      // Clear previous errors
      this.changePasswordFormErrors[field] = {};

      // Get the control
      const control = this.changePasswordForm.get(field);

      if (control && control.dirty && !control.valid) {
        this.changePasswordFormErrors[field] = control.errors;
      }
    }
  }

  getProfile() {
    const query = {_id: Meteor.userId()};
    MeteorObservable.call('findOne', 'users', query).subscribe((res: any) => {
      if (res) {
        this.profile = {
          homepage: res.profile.homepage,
          appTheme: res.profile.appTheme,
          meetingEmails: res.profile.meetingEmails,
        };
      }
    });
  }

  getMenus() {
    const parentTenantId = Session.get('parentTenantId');
    MeteorObservable.call('getMenus', parentTenantId).subscribe((res: any) => {
      this.menus = res;
    });
  }

  onSelectHomepage() {
    const query = {_id: Meteor.userId()};
    const update = {$set: {'profile.homepage': this.profile.homepage}};
    MeteorObservable.call('update', 'users', query, update).subscribe(() => {
      this.notificationService.success(
        'Site Settings',
        'Homepage successfully saved'
      );
    });
  }

  onSelectAppTheme() {
    const query = {_id: Meteor.userId()};
    const update = {$set: {'profile.appTheme': this.profile.appTheme}};
    MeteorObservable.call('update', 'users', query, update).subscribe(() => {
      EventEmitterService.Events.next({
        name: 'setTheme',
        value: this.profile.appTheme,
      });
      this.notificationService.success(
        'Site Settings',
        'Theme successfully saved'
      );
    });
  }

  onSelectMeetingEmails() {
    const query = {_id: Meteor.userId()};
    const update = {$set: {'profile.meetingEmails': this.profile.meetingEmails}};
    MeteorObservable.call('update', 'users', query, update).subscribe(() => {
      this.notificationService.success(
        'Site Settings',
        'Meeting Email successfully saved'
      );
    });
  }

  updatePassword() {
    if (this.changePasswordForm.valid) {

      let oldPassword = this.changePasswordForm.value.oldPassword;
      let newPassword = this.changePasswordForm.value.newPassword;

      Accounts.changePassword(oldPassword, newPassword, (err) => {
        if(err){
          this.notificationService.error(
            'Profile Settings',
            err.reason
          );
          return;
        }
        this.notificationService.success(
          'Profile Settings',
          'Password updated successfully'
        );
      });
    }
  }
}


function confirmPassword(control: AbstractControl): any {
  if (!control.parent || !control) {
    return;
  }

  const oldPassword = control.parent.get('oldPassword');
  const password = control.parent.get('newPassword');
  const passwordConfirm = control.parent.get('confirmPassword');

  if (!oldPassword || !password || !passwordConfirm) {
    return;
  }

  if (passwordConfirm.value === '') {
    return;
  }

  if (password.value !== passwordConfirm.value) {
    return {
      passwordsNotMatch: true
    };
  }
}
