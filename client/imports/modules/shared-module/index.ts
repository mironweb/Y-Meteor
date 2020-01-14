import {APP_INITIALIZER, NgModule} from '@angular/core';
import { MaterialImportModule } from '../../app/material-import.module';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { SYSTEMLOOKUP_DECLARATIONS, DialogSelect } from './system-lookup';
import { TREENAV_DECLARATIONS } from './treenav';
import { PERMISSION_FORM_DECLARATIONS, PERMISSION_FORM_ENTRY_COMPONENTS } from './permissionForm';
import { GROUP_PERMISSION_FORM_DECLARATIONS, GROUP_PERMISSION_FORM_ENTRY_COMPONENTS } from './groupPermissionForm';
import { TableExpandableRowsExample } from './table-expandable/table-expandable-rows';
// import { FILTER_ENTRYCOMPONENTS } from './filter';
import { FILTER_ENTRYCOMPONENTS } from './filter';
import { FILTERDIALOG_ENTRYCOMPONENTS } from './filterDialog';
import { CAlENDAR_DECLARATIONS } from './calendar';
import { DIALOG_ENTRYCOMPONENTS } from './dialog';
import { GroupByPipe } from './groupBy/group-by.pipe';
import { CurrencyPipe } from './currencyPipe/currencyPipe.pipe';
import { WithoutCommaPipe } from './roundWithoutCommaPipe/withoutCommaPipe.pipe';
import { CalendarModule } from 'angular-calendar';
import { DpDatePickerModule } from 'ng2-date-picker';
import { PAGEHEADER_ENTRYCOMPONENTS } from './pageHeader';
import { DASHBOARDREPORT_ENTRYCOMPONENTS } from './dashboardReport';
import { FABBUTTON_DECLARATIONS } from './fabButton';
import { NORMALTABLE_ENTRYCOMPONENTS} from './normal-table';
import { YearSelectComponent} from './year-select/year-select.component';
import { ChartsModule } from 'ng2-charts';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

import { SidenavComponent} from './sidenav/sidenav.component';
import { USERDROPDOWN_CLERATIONS} from './user-dropdown';
import { SimpleNotificationsModule} from "angular2-notifications";
import {ObservablesService} from "../../services";
import { CollapseDirective } from '../../directives/collapse.component';
import { HasPermissionDirective } from '../../directives/hasPermission.directive';
import { EXECUTIVE_DECLARATIONS } from '../../pages/executive/';
import { ExecutiveService } from "../../pages/executive/executive.service";
import { ExecutiveDirective } from '../../pages/executive/executive.directive';
import {PIPE_DECLARATIONS}  from '../../pipes';

const declarations = [
  SYSTEMLOOKUP_DECLARATIONS,
  TREENAV_DECLARATIONS,
  PERMISSION_FORM_DECLARATIONS,
  GROUP_PERMISSION_FORM_DECLARATIONS,
  FILTER_ENTRYCOMPONENTS,
  DIALOG_ENTRYCOMPONENTS,
  CAlENDAR_DECLARATIONS,
  GroupByPipe,
  CurrencyPipe,
  WithoutCommaPipe,
  PAGEHEADER_ENTRYCOMPONENTS,
  DASHBOARDREPORT_ENTRYCOMPONENTS,
  FABBUTTON_DECLARATIONS,
  // PAGELOGS_ENTRYCOMPONENTS,
  NORMALTABLE_ENTRYCOMPONENTS,
  YearSelectComponent,
  SidenavComponent,
  CollapseDirective,
  HasPermissionDirective,
  USERDROPDOWN_CLERATIONS,
  FILTERDIALOG_ENTRYCOMPONENTS,
  EXECUTIVE_DECLARATIONS,
  ExecutiveDirective,
  PIPE_DECLARATIONS,
  TableExpandableRowsExample
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
    DpDatePickerModule,
    ChartsModule,
    NgxDaterangepickerMd
  ],
  entryComponents: [
    DIALOG_ENTRYCOMPONENTS,
    DialogSelect,
    PERMISSION_FORM_ENTRY_COMPONENTS,
    GROUP_PERMISSION_FORM_ENTRY_COMPONENTS,
    EXECUTIVE_DECLARATIONS
  ],
  declarations,
  providers: [
    ObservablesService,
    ExecutiveService
  ],
  exports: declarations
})
export class SharedModule {}
