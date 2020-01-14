import { NgModule } from '@angular/core';

import { routing } from './account.routing';
import {SharedModule} from "../../modules/shared-module";
import {CommonModule} from "@angular/common";
import {MaterialImportModule} from "../../app/material-import.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {RouterModule} from "@angular/router";
import { ACCOUNT_DECLARATIONS} from "./index";
import {DpDatePickerModule} from 'ng2-date-picker';
import {SimpleNotificationsModule} from 'angular2-notifications';

@NgModule({
  imports: [
    routing,
    SharedModule,
    CommonModule,
    FormsModule,
    MaterialImportModule,
    RouterModule,
    ReactiveFormsModule,
    DpDatePickerModule,
    SimpleNotificationsModule.forRoot(),
  ],
  declarations: [ACCOUNT_DECLARATIONS]
})
export class AccountModule {}
