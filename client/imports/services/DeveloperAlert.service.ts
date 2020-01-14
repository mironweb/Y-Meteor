import {Injectable} from '@angular/core';
import {MeteorObservable} from "meteor-rxjs";
import {UserGroupsService} from "./UserGroups.service";
import {NotificationsService} from "angular2-notifications";

@Injectable()
export class DeveloperAlertService {
  static logOptions:any;

  static getLogOptions() {
    return MeteorObservable.call('getLogOptions');
  }

  constructor(private userGroupService: UserGroupsService, private _service: NotificationsService) {
  }

  developerAlert(content) {
    if (Meteor.settings.public.isTestWebsite && this.userGroupService.isDeveloper) {
      this._service.error(
        'Error',
        content
      )
    }
  }

}