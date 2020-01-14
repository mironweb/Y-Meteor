import { Component, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Accounts } from 'meteor/accounts-base';
import { NotificationsService } from 'angular2-notifications';

@Component({
  selector: 'recover',
  templateUrl: 'recover.component.html',
  styleUrls: ['recover.component.scss'],
})

export class RecoverComponent {
  email: string = '';
  recoverForm: FormGroup;
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
    private zone: NgZone,
    private formBuilder: FormBuilder,
    private _service: NotificationsService,
  ) {
    this.recoverForm = this.formBuilder.group({
      email: ['', Validators.required],
    });
  }

  validate() {
    const errors = [];

    const emailField = this.recoverForm.get('email');
    if (emailField.invalid && emailField.errors.required) {
      errors.push('Email is required.');
    }

    return errors;
  }

  recover() {
    this.isLoading = true;

    const errors = this.validate();
    if (errors.length) {
      this.isLoading = false;
      this._service.error('Validation', errors.join('<br>'));
      return;
    }

    if (this.recoverForm && this.recoverForm.invalid) {
      this.isLoading = false;
      this._service.error('Validation', 'Form is invalid');
      return;
    }

    Accounts.forgotPassword({ email: this.recoverForm.value.email }, (err) => {
      this.zone.run(async () => {
        this.isLoading = false;

        if (err) {
          this._service.error('Failed', err.reason);
          return;
        }

        this._service.success(
          'Success',
          'A reset password link has been sent to your email.',
        );
      });
    });
  }
}
