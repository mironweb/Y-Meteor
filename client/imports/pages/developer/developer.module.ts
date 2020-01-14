import { NgModule } from '@angular/core';

import {DeveloperRoutingModule} from './developer.routing';
import {SharedModule} from "../../modules/shared-module";
import {CommonModule} from "@angular/common";
import {MaterialImportModule} from "../../app/material-import.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {RouterModule} from "@angular/router";
import {DEVELOPER_DECLARATIONS} from "./index";
import {DpDatePickerModule} from 'ng2-date-picker';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    FormsModule,
    MaterialImportModule,
    ReactiveFormsModule,
    DpDatePickerModule,
    DeveloperRoutingModule
  ],
  declarations: [DEVELOPER_DECLARATIONS]
})
export class DeveloperModule {}
