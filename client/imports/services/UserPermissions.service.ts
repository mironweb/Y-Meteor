import {Injectable, OnDestroy} from "@angular/core";
import {MeteorObservable} from "meteor-rxjs";
import {map, switchMap, tap} from "rxjs/operators";
import {Observable} from "rxjs/Observable";
import {forkJoin} from "rxjs/observable/forkJoin";
import {of} from "rxjs/observable/of";

@Injectable()
export class UserPermissionsService implements OnDestroy {
  userPermissions = [];
  constructor() {}

  _loadAllGroupsPermissions$() {
    return MeteorObservable.call('getUserGroupsPermissions', Session.get('tenantId'))
      .pipe(
        map((res:any) => {
          if (res) {
            // console.log('load all permissions', res);

            this.userPermissions = res;
          }
          return res;
        })
      );
  }

  _addPermissionToGroups$(permissionId: string) : Observable<any> {
    if (permissionId) {
      let query = {
        parentTenantId: Session.get('parentTenantId')
      };
      return MeteorObservable.call('find', 'userGroups', query)
        .pipe(
          switchMap((groups:any) => {
            return forkJoin(groups.map((group) => {
              let findPermission = group.groupPermissions.find(_groupPermission => {
                if (_groupPermission._id == permissionId) {
                  return true;
                }
              });
              if (!findPermission) {
                let query = {
                  _id: group._id
                };
                let update = {
                  $push: {
                    groupPermissions: {
                      _id: permissionId,
                      value: ""
                    }
                  }
                };
                return MeteorObservable.call('update', 'userGroups', query, update);
              } else {
                return of(true);
              }
            }))
          })
        )
    } else {
      return of(null);
    }
  }

  ngOnDestroy() {

  }
}