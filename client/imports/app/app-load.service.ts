import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {UserService} from "../services/UserService";
import {MeteorObservable} from "meteor-rxjs";
import {Session} from "meteor/session";
import * as funcs from "../../../both/functions/common";

// import { APP_SETTINGS } from '../settings';
const APP_SETTINGS = {
  connectionString: "",
  defaultImageUrl: ""
}

@Injectable()
export class AppLoadService {

  constructor(
    private httpClient: HttpClient,
    private userService: UserService
  ) { }

  userLogin() {
    // console.log(this.userService.currentUser);
  }

  initializeApp(): Promise<any> {

    return new Promise(async (resolve, reject) => {
      // console.log(`initializeApp:: inside promise`);
      let subdomain = window.location.host.split('.')[0];
      Session.set('subdomain', subdomain);

      const res:any = await MeteorObservable.call('findOne', 'systemTenants', {subdomain}).toPromise();
      if (res) {
        Session.set('tenantId', res._id);
      }
      if ('parentTenantId' in res && res.parentTenantId != '') {
        Session.set('parentTenantId', res.parentTenantId);

      } else {
        Session.set('parentTenantId', res._id);
      }
      resolve(true);

    });
  }

  // getSettings(): Promise<any> {
  //   // console.log(`getSettings:: before http.get call`);
  //
  //   const promise = this.httpClient.get('https://private-1ad25-initializeng.apiary-mock.com/settings')
  //     .toPromise()
  //     .then(settings => {
  //       APP_SETTINGS.connectionString = settings[0].value;
  //       APP_SETTINGS.defaultImageUrl = settings[1].value;
  //
  //       return settings;
  //     });
  //
  //   return promise;
  // }
}