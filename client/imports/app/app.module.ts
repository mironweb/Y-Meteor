import {NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {MatPaginatorIntl} from '@angular/material';

import { AppComponent } from './app.component';
import { TodoListComponent } from './todo-list/todo-list.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import {SharedModule} from "../modules/shared-module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialImportModule} from "./material-import.module";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {CalendarModule} from "angular-calendar";
import {DpDatePickerModule} from "ng2-date-picker";
import {HttpClientModule} from "@angular/common/http";
import {SimpleNotificationsModule} from "angular2-notifications";
import { ChartsModule } from 'ng2-charts/ng2-charts';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';

import {DASHBOARD_DECLARATIONS} from "../pages/dashboard";
import {CanActivateDashboard, CanActivateTeam, DashboardRedirect} from "../services";
import {PageResolver} from "../resolvers/PageResolver";
import {ModuleResolver} from "../resolvers/ModuleResolver";
import {AccessResolver} from "../resolvers/AccessResolver";
import {AppRoutingModule} from "./app-routing.module";
import {AppLoadModule} from "./app-load.module";
import {AccountsModule} from "../modules/accounts";
import {LogService} from "../services/LogService";
import {UserGroupsService} from "../services/UserGroups.service";
import {UserGroupsResolver} from "../resolvers/UserGroups.resolver";
import {SystemTenantService} from "../services/SystemTenant.service";
import {SystemPermissionsService} from "../services/SystemPermissions.service";
import {MatPaginatorIntlCro} from "../services/MatPaginatorIntl";
import {CustomersModule} from "../pages/customers/customers.module";


declare var module : any;
global['System'] = {
  import(path: string){
    return module.dynamicImport(path);
  }
};

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialImportModule,
    BrowserAnimationsModule,
    CalendarModule.forRoot(),
    DpDatePickerModule,
    HttpClientModule,
    // CustomersModule,

    //
    AppLoadModule,
    SharedModule,
    AccountsModule,
    SimpleNotificationsModule.forRoot(),
    AppRoutingModule,
    ChartsModule,
    NgxDaterangepickerMd.forRoot()
  ],
  providers: [
    CanActivateTeam,
    CanActivateDashboard,
    DashboardRedirect,
    PageResolver,
    ModuleResolver,
    AccessResolver,
    UserGroupsResolver,
    UserGroupsService,
    // GroupsPermissionsService,
    SystemPermissionsService,
    LogService,
    SystemTenantService,
    MatPaginatorIntl,
    MatPaginatorIntlCro,
    { provide: MatPaginatorIntl, useClass: MatPaginatorIntlCro}
],
  declarations: [
    AppComponent,
    DASHBOARD_DECLARATIONS,
    TodoListComponent,
    PageNotFoundComponent
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }

