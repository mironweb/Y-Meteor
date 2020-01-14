import { Injectable } from '@angular/core';
import {UserGroupsService} from "../services/UserGroups.service";
import {Resolve} from "@angular/router";
import {SystemLogsService} from "../services/SystemLogs.service";
import {SystemTenantService} from "../services/SystemTenant.service";

@Injectable()
export class SystemTenantResolver implements Resolve<any>{
  constructor(private systemTenantService: SystemTenantService) {}

  // getTopPosts() {
  //   return this.userGroupsService.loadCurrentUserGroup();
  // }

  resolve() {
    // return this.systemTenantService.loadCurrentSystemTenant();
  }

}