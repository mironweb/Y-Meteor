import { NgModule } from '@angular/core';

import { routing } from './vendors.routing';
import {SharedModule} from "../../modules/shared-module";
import {CommonModule} from "@angular/common";
import {MaterialImportModule} from "../../app/material-import.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {RouterModule} from "@angular/router";
import {Vendors_DECLARATIONS} from "./index";
import {DpDatePickerModule} from 'ng2-date-picker';

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
  ],
  declarations: [Vendors_DECLARATIONS]
})
export class VendorsModule {}
