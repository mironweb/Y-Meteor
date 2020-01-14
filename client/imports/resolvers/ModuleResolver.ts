import {Injectable, OnDestroy} from "@angular/core";
import {ActivatedRouteSnapshot, NavigationEnd, Resolve, Router, RouterStateSnapshot} from "@angular/router";
import {Observable} from "rxjs/Observable";
import {MeteorObservable} from "meteor-rxjs";
import { ReactiveVar } from 'meteor/reactive-var';
import { Subscription } from 'rxjs/Subscription';
import {SystemModuleClass} from '../../../both/models/systemModule';
@Injectable()
export class ModuleResolver implements Resolve<any>, OnDestroy {
  static routes = [];
  static sub: Subscription;

  constructor() {}
  systemModule: SystemModuleClass;

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<any>|Promise<any>|boolean|any {
    return new Promise(async (resolve) => {
      const moduleUrl = route.url[0].path;
      let result:any = await SystemModuleClass.LoadSystemModuleByUrl(moduleUrl);
      resolve(result);
    });
  }

  ngOnDestroy() {
  }
}
