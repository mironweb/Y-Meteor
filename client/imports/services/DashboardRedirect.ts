import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';

@Injectable()
export class DashboardRedirect implements CanActivate {
  constructor(private router:Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const user = Meteor.user();
    console.log('DashboardRedirect', user);
    if (user.profile['homepage']) {
      this.router.navigate([user.profile['homepage']]);
    } else {
      this.router.navigate(['customers/meetings']);
    }
    return false;
  }
}
