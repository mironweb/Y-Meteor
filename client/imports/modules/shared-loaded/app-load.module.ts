import { NgModule, APP_INITIALIZER } from '@angular/core';
import { HttpClientModule } from "@angular/common/http";

import { AppLoadService } from './app-load.service';
import { UserService } from '../../services/UserService';

export function init_app(appLoadService: AppLoadService) {
  return () => appLoadService.initializeApp();
}

export function get_settings(appLoadService: AppLoadService) {
  return () => appLoadService.getSettings();
}

export function getCurrentUser(userService: UserService) {
  return () => userService.loadCurrentUser();
}

@NgModule({
  imports: [HttpClientModule],
  providers: [
    AppLoadService,
    { provide: APP_INITIALIZER, useFactory: init_app, deps: [AppLoadService], multi: true },
    { provide: APP_INITIALIZER, useFactory: get_settings, deps: [AppLoadService], multi: true },
    { provide: APP_INITIALIZER, useFactory: getCurrentUser, deps: [UserService], multi: true }

  ]
})
export class AppLoadModule { }