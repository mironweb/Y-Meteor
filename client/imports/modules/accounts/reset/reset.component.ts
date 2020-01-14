import { Component, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Accounts } from 'meteor/accounts-base';
import { NotificationsService } from 'angular2-notifications';
import { Meteor } from 'meteor/meteor';

@Component({
  selector: 'reset',
  templateUrl: 'reset.component.html',
  styleUrls: ['reset.component.scss'],
})

export class ResetComponent {
  token: string = '';
  resetForm: FormGroup;
  isLoading: boolean = false;

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
    private route: ActivatedRoute,
    private zone: NgZone,
    private formBuilder: FormBuilder,
    private _service: NotificationsService,
  ) {
    this.resetForm = this.formBuilder.group({
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });

    this.route.params.subscribe((params) => {
      if (params.token) {
        this.token = params.token;
      }
    });
  }

  validate() {
    const errors = [];

    const passwordField = this.resetForm.get('password');
    if (passwordField.invalid && passwordField.errors.required) {
      errors.push('Password is required.');
    }

    const confirmPasswordField = this.resetForm.get('confirmPassword');
    if (confirmPasswordField.invalid && confirmPasswordField.errors.required) {
      errors.push('Confirm Password is required.');
    }

    if (passwordField.value !== confirmPasswordField.value) {
      errors.push('Passwords must be the same.');
    }

    return errors;
  }

  reset() {
    this.isLoading = true;

    const errors = this.validate();
    if (errors.length) {
      this.isLoading = false;
      this._service.error('Validation', errors.join('<br>'));
      return;
    }

    if (this.resetForm && this.resetForm.invalid) {
      this.isLoading = false;
      this._service.error('Validation', 'Form is invalid');
      return;
    }

    Accounts.resetPassword(this.token, this.resetForm.value.password, (err) => {
      this.zone.run(async () => {
        this.isLoading = false;

        if (err) {
          this._service.error('Failed', err.reason);
          return;
        }

        this._service.success(
          'Success',
          'You may now login, your password has been reset.',
        );

        // resetPassword automatically login the users
        // so we need to logout them first and have them go
        // to login page (which does more preprocessing)
        Meteor.logout(() => {
          localStorage.setItem('sessionId', undefined);
        });
      });
    });
  }
}
