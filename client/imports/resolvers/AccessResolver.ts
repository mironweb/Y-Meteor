import {Injectable, OnDestroy} from "@angular/core";
import {ActivatedRouteSnapshot, NavigationEnd, Resolve, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Observable";
import {MeteorObservable} from "meteor-rxjs";
import { ReactiveVar } from 'meteor/reactive-var';
import { Subscription } from 'rxjs/Subscription';
import * as funcs from "../../../both/functions/common";

@Injectable()
export class AccessResolver implements Resolve<any> {
  static routes = [];
  static sub: Subscription;
  static currentRoutes = [];
  static reactiveAllRoutes: ReactiveVar<any> = new ReactiveVar([]);
  static reactiveModuleRoutes: ReactiveVar<any> = new ReactiveVar([]);
  static reactiveCurrentRoute: ReactiveVar<any> = new ReactiveVar({});
  constructor(private router: Router) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any>|Promise<any> {

    // const moduleName = route.url[0].path;

    return new Promise(async (resolve) => {
      // const userGroupsPermissions = await funcs.callbackToPromise(MeteorObservable.call('getUserGroupsPermissions', Session.get('parentTenantId')));
      const userGroupsPermissions = await funcs.callbackToPromise(MeteorObservable.call('getUserGroupsPermissions', Session.get('parentTenantId')));

      resolve(true);
    })
  }
}