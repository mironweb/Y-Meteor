import {Injectable} from '@angular/core';
import {filter, map, switchMap, tap} from "rxjs/operators";
import * as moment from 'moment';
import {of} from "rxjs/observable/of";
import {UserService} from "./UserService";
import {UserGroup} from "../../../both/models/userGroup.model";
import {MeteorObservable} from "meteor-rxjs";


@Injectable()
export class UserGroupsService {
  userId: string = Meteor.userId();

  userGroup: UserGroup;
  isDeveloper: boolean;

  constructor(private userService: UserService) {
  }

  loadCurrentUserGroup() {
    return of('')
      .pipe(
        map(() => this.userService.user),
        filter(user => user && 'tenants' in user),
        map(user => this.getDefaultGroupId()),
        switchMap((groupId) => {
          if (groupId) {
            let query = {
              _id: groupId
            };
            return MeteorObservable.call('findOne', 'userGroups', query);
          } else{
            return of(null);
          }
        }),
        tap(group => {
          if ('blockedCustomers' in group) {
          } else {
            group.blockedCustomers = [];
          }
          if ('allowedCustomers' in group) {
          } else {
            group.allowedCustomers = [];
          }

          this.userGroup = new UserGroup(group);
          if (this.userGroup.name == 'Developer') {
            this.isDeveloper = true;
          }
          // console.log("load user group", this.userGroup);
        })
      )
  }

  getDefaultGroupId() {
    let tenantId = Session.get('tenantId');
    let tenant:any = this.userService.user.tenants.find((_tenant:any) => _tenant._id == tenantId) || {};
    if ('defaultGroupId' in tenant && tenant.groups.length > 0) {
      let index = tenant.groups.findIndex(_group => _group == tenant.defaultGroupId);
      return tenant.groups[index];
    } else if(tenant.groups.length > 0) {
      return tenant.groups[0];
    } else {
      return null;
    }
  }
}

function checkIsSameDay(systemLog) {
  let date = systemLog.createdAt;
  let convertDate =  moment(new Date(date)).format('DD MMM YYYY');
  let currentDate =  moment(new Date()).format('DD MMM YYYY');
  let isEqual = false;

  if (convertDate === currentDate) {
    // don't do anything
    isEqual = true;
  } else {
    // generate new sessionId and insert
    isEqual = false;
  }

  return isEqual;
}
