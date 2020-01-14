import {Injectable} from '@angular/core';
import {MeteorObservable} from "meteor-rxjs";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

@Injectable()
export class ObservablesService {
  static Events:BehaviorSubject<any> = new BehaviorSubject('');

  constructor() {
  }

}