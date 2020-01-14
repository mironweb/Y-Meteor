import {NgModule} from '@angular/core';

import {routing, ROUTES_PROVIDERS} from './executive.routing';
import {SharedModule} from "../../modules/shared-module";
import {CommonModule} from "@angular/common";
import {MaterialImportModule} from "../../app/material-import.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {CalendarModule} from 'angular-calendar';
import {DpDatePickerModule} from 'ng2-date-picker';
import {HttpClientModule} from '@angular/common/http';
import { ChartsModule } from 'ng2-charts/ng2-charts';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

import {EXECUTIVE_DECLARATIONS} from "./index";
import {ExecutiveService} from "./executive.service";
import { ExecutiveDirective } from './executive.directive';


@NgModule({
  imports: [
    routing,
    SharedModule,
    CommonModule,
    FormsModule,
    MaterialImportModule,
    RouterModule,
    ReactiveFormsModule,
    ChartsModule,
    CalendarModule.forRoot(),
    DpDatePickerModule,
    HttpClientModule,
    NgxDaterangepickerMd.forRoot()
  ],
  // providers: [ ExecutiveService],
  // declarations: [ExecutiveDirective],
  // entryComponents: [EXECUTIVE_DECLARATIONS]
})
export class ExecutiveModule {

}
