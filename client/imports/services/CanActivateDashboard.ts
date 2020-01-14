import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Observable";
import {UserService} from "./UserService";
import {UserGroupsService} from "./UserGroups.service";

@Injectable()
export class CanActivateDashboard implements CanActivate {
  static routes:any = [];
  constructor(private userService: UserService, private userGroup: UserGroupsService) {
  }

  canActivate(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean>|Promise<boolean> {
    return new Promise(async(resolve) => {
      // await this.resolve();
      resolve(true);
    })
  }
}