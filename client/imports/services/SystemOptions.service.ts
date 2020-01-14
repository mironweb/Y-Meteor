import {Injectable} from "@angular/core";
import {MeteorObservable} from "meteor-rxjs";
import {catchError, map, switchMap, tap} from "rxjs/operators";
import {of} from "rxjs";

@Injectable()
export class SystemOptionsService {
  modulesRoutes = [];
  constructor() {}

  _loadModulesRoutes() {
    return of("start")
      .pipe(
        switchMap(() => {
          return MeteorObservable.call('systemOptions.getPermissionIds', Session.get('parentTenantId'))
        }),
        tap((res:any) => {
          if (res) {
            this.modulesRoutes = res;
          }
        })
      )
  }

  getCurrentPageRoute() {
    let moduleUrl = window.location.pathname.split('/')[1];
    let pageUrl = window.location.pathname.split('/')[2];

    let moduleRoute:any = {};
    let pageRoute:any = {};
    if (this.modulesRoutes.length > 0) {
      let moduleIndex = this.modulesRoutes.findIndex(route => {
        return route.url == moduleUrl;
      });
      if (moduleIndex > -1) {
        moduleRoute = this.modulesRoutes[moduleIndex];
        if('routes' in moduleRoute) {
          let pageIndex = moduleRoute.routes.findIndex(route=> {
            return route.url == pageUrl;
          });
          if (pageIndex > -1) {
            pageRoute = moduleRoute.routes[pageIndex];
          }
        }
      }
    }
    return pageRoute;
  }

  getPageheader(){
    let moduleUrl = window.location.pathname.split('/')[1];
    let pageUrl = window.location.pathname.split('/')[2];
    let sub = window.location.pathname.split('/')[3];
    let currentPageRoute = this.getCurrentPageRoute();
    let returnString = currentPageRoute['pageHeader'];
    let returnSecondardObj = null;

    if (sub && 'secondaryPageHeaders' in currentPageRoute ) {
      let secondaryPageHeaders = currentPageRoute['secondaryPageHeaders'];
      let pageIndex = secondaryPageHeaders.findIndex(secondaryPageHeader => {
        return secondaryPageHeader.subUrl == sub;
      });
      if (pageIndex > -1) {
        returnSecondardObj = secondaryPageHeaders[pageIndex];
        returnString += ' > ' + secondaryPageHeaders[pageIndex].pageHeader
      }
    }



    let obj = {
      currentPageRoute: currentPageRoute,
      secondardObj: returnSecondardObj,
      returnString: returnString
    }
    return obj;
  }
}