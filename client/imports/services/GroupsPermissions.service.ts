// import {Injectable, OnDestroy} from "@angular/core";
// import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from "@angular/router";
// import {Observable} from "rxjs/Observable";
// import {MeteorObservable} from "meteor-rxjs";
// import {tap} from "rxjs/operators";
//
// @Injectable()
// export class GroupsPermissionsService implements OnDestroy {
//   static groupsPermissions = [];
//   groupsPermissions = [];
//   constructor(private router: Router) {}
//
//   resolve(
//     _route: ActivatedRouteSnapshot,
//     _state: RouterStateSnapshot
//   ): Observable<any>|Promise<any>|boolean {
//     if (GroupsPermissionsService.groupsPermissions.length > 0) {
//       return new Promise(resolve => {
//         resolve(GroupsPermissionsService.groupsPermissions);
//       })
//     } else {
//       return new Promise((resolve) => {
//         MeteorObservable.call('getUserGroupsPermissions', Session.get('tenantId')).subscribe((res:any) => {
//           GroupsPermissionsService.groupsPermissions = res;
//           console.log('res', res);
//           resolve(GroupsPermissionsService.groupsPermissions);
//         });
//       });
//     }
//   }
//
//   _loadAllGroupsPermissions$() {
//     return MeteorObservable.call('getUserGroupsPermissions', Session.get('tenantId'))
//       .pipes(
//         tap((res:any) => {
//           if (res) {
//             console.log('all permissions', res);
//
//             this.groupsPermissions = res;
//           }
//         })
//       );
//   }
//
//
//
//   ngOnDestroy() {
//     console.log('this is dectroy"');
//   }
// }