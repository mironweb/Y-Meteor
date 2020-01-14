import {Injectable} from '@angular/core';
import {Action, SystemLog} from "../../../both/models/systemLog.model";
import {MeteorObservable} from "meteor-rxjs";
import {defaultIfEmpty, filter, map, switchMap, tap} from "rxjs/operators";
import * as moment from 'moment';
import {of} from "rxjs/observable/of";
import {SystemTenant} from "../../../both/models/systemTenant.model";

@Injectable()
export class SystemTenantService {
  parentTenant: SystemTenant;
  tenants: any;

  constructor() {}

  _loadCurrentSystemTenant$() {
    return of('')
      .pipe(
        switchMap(() => {
          let query = {
            subdomain: Session.get('subdomain')
          };
          return MeteorObservable.call('findOne', 'systemTenants', query)
        }),
        tap((tenant:any) => {
          this.parentTenant = tenant;
        }),
        switchMap(() => {
          let query = {
            parentTenantId: Session.get('parentTenantId')
          }
          return MeteorObservable.call('find', 'systemTenants', query);
        }),
        tap(tenants => {
          this.tenants = tenants;
          this.tenants.unshift(this.parentTenant);
        })
      )
  }
}