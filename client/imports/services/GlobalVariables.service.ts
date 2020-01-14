import {Injectable, OnInit} from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { AppState } from '../../../both/models/appState';
import User = Meteor.User;
import {MeteorObservable} from "meteor-rxjs";

@Injectable()
export class GlobalVariablesService implements OnInit{

  static scrolling = true;
  static user:User;
  constructor() {}

  ngOnInit() {
    MeteorObservable.call('getCurrentUser').subscribe(res => {
    })
  }
}