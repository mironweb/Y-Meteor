import { Injectable } from '@angular/core';
import {UserGroupsService} from "../services/UserGroups.service";
import {Resolve} from "@angular/router";
import {UserGroup} from "../../../both/models/userGroup.model";

@Injectable()
export class UserGroupsResolver implements Resolve<any>{
  constructor(private userGroupsService: UserGroupsService) {
  }

  resolve() {
    return new Promise(resolve => {
      this.userGroupsService.loadCurrentUserGroup()
        .subscribe(res => {
          if (res) {
            resolve(new UserGroup(res));
          } else {
            resolve(null);
          }
        });
    })
  }

}