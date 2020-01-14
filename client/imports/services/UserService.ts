import {Injectable} from '@angular/core';
import {MeteorObservable} from "meteor-rxjs";
import {subscribeOn} from "rxjs/operator/subscribeOn";
import { ReactiveVar } from 'meteor/reactive-var';
import {User} from "../../../both/models/user.model";
import {tap} from "rxjs/operators";
import {Observable} from "rxjs/Observable";

@Injectable()
export class UserService {

  static groups = [];
  static user:any;

  static init() {
    MeteorObservable.call('getCurrentUser').subscribe((res:any) => {
      if (res && !('blockedCustomers' in res)) {
        res.blockedCustomers = [];
      }
      if (res && !('allowedCustomers' in res)) {
        res.allowedCustomers = [];
      }
      if ('tenants' in res) {
        const tenant = res.tenants.find(tenant => tenant._id == Session.get('tenantId'))
        if (tenant && 'referredUserId' in tenant) {
          res.referredUserId = tenant.referredUserId;
        } else {
          res.referredUserId = res._id;
        }
      }
      UserService.user = res;
    });

  }
  user : User;
  currentUser : User;

  constructor() {
    // if (Meteor.userId()) {
    //   MeteorObservable.call('getCurrentUserGroups', Session.get('tenantId')).subscribe((res:any) => {
    //     UserService.groups = res;
    //   });
    //   MeteorObservable.call('getCurrentUser').subscribe((res:any) => {
    //     if (res && !('blockedCustomers' in res)) {
    //       res.blockedCustomers = [];
    //     }
    //     if ('tenants' in res) {
    //       const tenant = res.tenants.find(tenant => tenant._id == Session.get('tenantId'))
    //       if (tenant && 'referredUserId' in tenant) {
    //         res.referredUserId = tenant.referredUserId;
    //       } else {
    //         res.referredUserId = res._id;
    //       }
    //     }
    //     UserService.user = res;
    //   });
    // }
  }



  init() {
    return new Promise((resolve) => {
      resolve('UserService.ts');
    })
    // return new User(Meteor.userId())
  }

  loadCurrentUser() : Observable<any> {
    // return new Promise((resolve, reject) => {
      return MeteorObservable.call('getCurrentUser')
        .pipe(
          tap((res:any) => {
            if (res) {
              if (!('blockedCustomers' in res)) {
                res.blockedCustomers = [];
              }
              if (res && !('allowedCustomers' in res)) {
                res.allowedCustomers = [];
              }

              if ('tenants' in res) {
                const tenant = res.tenants.find(tenant => tenant._id == Session.get('tenantId'));
                if (tenant && 'referredUserId' in tenant) {
                  res.referredUserId = tenant.referredUserId;
                } else {
                  res.referredUserId = res._id;
                }
              }

              UserService.user = res;
              this.currentUser = res;
              this.user = new User(res);
            }
          })
        )
  }
}