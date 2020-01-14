import { NgModule } from '@angular/core';

import { routing } from './admin.routing';
import {SharedModule} from "../../modules/shared-module";
import {CommonModule} from "@angular/common";
import {MaterialImportModule} from "../../app/material-import.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {RouterModule} from "@angular/router";
import {ADMIN_DECLARATIONS} from "./index";

@NgModule({
  imports: [
    routing,
    SharedModule,
    CommonModule,
    FormsModule,
    MaterialImportModule,
    RouterModule,
    ReactiveFormsModule
  ],
  declarations: [ADMIN_DECLARATIONS]
})
export class AdminModule {}
