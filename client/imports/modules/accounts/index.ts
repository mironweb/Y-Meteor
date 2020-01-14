import { NgModule } from '@angular/core';
import { MaterialImportModule } from '../../app/material-import.module';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { LoginComponent} from './login/login.component';
import { SignupComponent} from './signup/signup.component';
import { RecoverComponent} from './recover/recover.component';
import { ResetComponent} from './reset/reset.component';
import {SharedModule} from "../shared-module";
import {CalendarModule} from "angular-calendar";
import {SimpleNotificationsModule} from "angular2-notifications";
import {DpDatePickerModule} from "ng2-date-picker";
import {AppLoadModule} from "../../app/app-load.module";
import {RouterModule} from "@angular/router";

const declarations = [
  LoginComponent,
  SignupComponent,
  RecoverComponent,
  ResetComponent,
];

@NgModule({
  imports: [
    CommonModule,
    SimpleNotificationsModule.forRoot(),
    ReactiveFormsModule,
    FormsModule,
    MaterialImportModule,
    RouterModule,
    CalendarModule.forRoot(),
    AppLoadModule,
    DpDatePickerModule,
  ],
  declarations,
  exports: declarations
})
export class AccountsModule {}
