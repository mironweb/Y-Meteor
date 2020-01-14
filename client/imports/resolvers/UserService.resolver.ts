import { Injectable } from '@angular/core';
import {Resolve} from "@angular/router";
import {UserService} from "../services/UserService";

@Injectable()
export class UserServiceResolver implements Resolve<any>{
  constructor(private userService: UserService) {}

  resolve() {
    return this.userService.loadCurrentUser().toPromise();
  }

}