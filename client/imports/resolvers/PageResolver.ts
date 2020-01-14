import {Injectable, OnDestroy} from "@angular/core";
import {ActivatedRouteSnapshot, NavigationEnd, Resolve, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Observable";
import {MeteorObservable} from "meteor-rxjs";
import { ReactiveVar } from 'meteor/reactive-var';
import { Subscription } from 'rxjs/Subscription';

import * as funcs from '../../../both/functions/common';
import {SystemOptionsService} from "../services/SystemOptions.service";

@Injectable()
export class PageResolver implements Resolve<any>, OnDestroy {
  static routes = [];
  static systemLog:any = {};
  static sub: Subscription;
  static reactiveModuleRoutes: ReactiveVar<any> = new ReactiveVar([]);
  static reactiveCurrentRoute: ReactiveVar<any> = new ReactiveVar({});
  static isDeveloper:boolean;
  constructor(private router: Router, private systemOptionsService: SystemOptionsService) {}

  resolve(
    _route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<any>|Promise<any>|boolean {
    if (_route.url.length > 0) {
      if (this.systemOptionsService.modulesRoutes.length > 0) {
        return new Promise(async (resolve) => {

          let index = this.systemOptionsService.modulesRoutes.findIndex(route => {
            return _route.url[0].path === route.url;
          });

          if (PageResolver.isDeveloper == undefined) {
            PageResolver.isDeveloper = await funcs.isDeveloper(Meteor.userId(), Session.get('tenantId'));
          }

          resolve(this.systemOptionsService.modulesRoutes[index]);
        })
      } else {
        return false;
      }
    } else {
      // get all routes
      return new Promise(async (resolve) => {
        if (PageResolver.isDeveloper == undefined) {
          PageResolver.isDeveloper = await funcs.isDeveloper(Meteor.userId(), Session.get('tenantId'));
        }
        resolve(true);
      });
    }
  }

  // static getCurrentPageRoute() {
  //   let moduleUrl = window.location.pathname.split('/')[1];
  //   let pageUrl = window.location.pathname.split('/')[2];
  //
  //   let moduleRoute:any = {};
  //   let pageRoute:any = {};
  //   if (this.systemOptionsService.modulesRoutes.length > 0) {
  //     let moduleIndex = PageResolver.routes.findIndex(route => {
  //       return route.url == moduleUrl;
  //     });
  //     if (moduleIndex > -1) {
  //       moduleRoute = PageResolver.routes[moduleIndex];
  //       if('routes' in moduleRoute) {
  //         let pageIndex = moduleRoute.routes.findIndex(route=> {
  //           return route.url == pageUrl;
  //         });
  //         if (pageIndex > -1) {
  //           pageRoute = moduleRoute.routes[pageIndex];
  //         }
  //       }
  //     }
  //   }
  //   return pageRoute;
  // }

  setCurrentRoute() {
    if (PageResolver.sub) {
      // PageResolver.sub.unsubscribe();
    }
    PageResolver.sub = this.router.events.subscribe(events => {
      if (events instanceof NavigationEnd) {
        const routes = PageResolver.reactiveModuleRoutes.get();
        let index = routes.findIndex((route:any) => {
          if ('/' + route.path == window.location.pathname) {
            return true;
          }
        });
        PageResolver.reactiveCurrentRoute.set(routes[index]);
      }
    });
  }

  ngOnDestroy() {

  }
}

function getMapedRoutes(routes, moduleName) {
  return routes.filter(route => {
    if (route.path.includes(moduleName)) {
      return true;
    }
  });
}