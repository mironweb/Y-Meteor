import { Component, OnInit, NgZone } from '@angular/core';
import { Meteor } from 'meteor/meteor';
import { MeteorObservable } from 'meteor-rxjs';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';

import { Users } from '../../../../../both/collections/users.collection';
import { User } from '../../../../../both/models/user.model';
import {UserGroupsService} from "../../../services/UserGroups.service";
import {UserService} from "../../../services/UserService";
import {SystemLogsService} from "../../../services/SystemLogs.service";

@Component({
  selector: 'user-dropdown',
  templateUrl: 'user-dropdown.component.html'
})

export class UserDropdownComponent implements OnInit {
  users: Observable<User[]>;
  user: any = {
    profile: {}
  };

  constructor(private ngZone: NgZone, private router: Router,
              private userService: UserService,
              private userGroupService: UserGroupsService,
              private systemLogService: SystemLogsService) {
  }

  ngOnInit() {
    this.user = this.userService.user;
    // MeteorObservable.autorun().subscribe(() => {
    //   Users.find({}).zone().subscribe((res) => {
    //     this.user = res[0];
    //   });
    // });
  }

  logout() {
    console.log('userservice', this.userService, this.userGroupService);
    Meteor.logout(() => {
      localStorage.setItem('sessionId', undefined);
      this.userService.user = undefined;
      this.userGroupService.userGroup = undefined;
      this.systemLogService.systemLog = undefined;
      // we use the native navigation to force page reload
      // and completely reset the state instead of using the angular router
      // e.g. this.router.navigate(['/login']);
      window.location.href = '/login';
    });
  }
}