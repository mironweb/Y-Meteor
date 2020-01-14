import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from "@angular/common/http";

import { AppLoadService } from './app-load.service';
import { UserService } from '../services/UserService';
import {UserGroupsService} from "../services/UserGroups.service";
import {UserServiceResolver} from "../resolvers/UserService.resolver";
import {concat} from "rxjs/observable/concat";
import {SystemLogsService} from "../services/SystemLogs.service";
import {SystemPermissionsService} from "../services/SystemPermissions.service";
import {SystemOptionsService} from "../services/SystemOptions.service";
import {SystemTenantService} from "../services/SystemTenant.service";
import {PrintService} from "../services/Print.service";

export function init_app(appLoadService: AppLoadService) {
  return () => appLoadService.initializeApp();
}

export function getCurrentUser(userService: UserService,
                               systemTenantService: SystemTenantService,
                               userGroupService: UserGroupsService,
                               systemLogService: SystemLogsService,
                               systemPermissions: SystemPermissionsService,
                               systemOptionsService: SystemOptionsService,
                               printService: PrintService
                               ) {
  return () => {
    if (Meteor.userId()) {
      return concat(
        userService.loadCurrentUser(),
        systemTenantService._loadCurrentSystemTenant$(),
        userGroupService.loadCurrentUserGroup(),
        systemPermissions._loadAllGroupsPermissions$(),
        systemOptionsService._loadModulesRoutes(),
        systemLogService.loadCurrentUserSystemLog(),
        printService._loadPrinters$()
      )
        .toPromise();
    } else {
      return false;
    }

  }
}

@NgModule({
  imports: [HttpClientModule],
  providers: [
    AppLoadService,
    UserServiceResolver,
    UserService,
    SystemLogsService,
    SystemPermissionsService,
    SystemOptionsService,
    SystemTenantService,
    PrintService,
    { provide: APP_INITIALIZER, useFactory: init_app, deps: [AppLoadService], multi: true },
    // { provide: APP_INITIALIZER, useFactory: get_settings, deps: [AppLoadService], multi: true },
    { provide: APP_INITIALIZER, useFactory: getCurrentUser, deps: [
      UserService, SystemTenantService, UserGroupsService, SystemLogsService, SystemPermissionsService, SystemOptionsService, PrintService
      ], multi: true },
    // { provide: APP_INITIALIZER, useFactory: getCurrentUser, deps: [SystemTe], multi: true },
    // { provide: APP_INITIALIZER, useFactory: loadCurrentUserGroup, deps: [UserGroupsService], multi: true }
  ]
})
export class AppLoadModule { }