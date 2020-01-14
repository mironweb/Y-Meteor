  import {Injectable} from '@angular/core';
import {MeteorObservable} from "meteor-rxjs";

@Injectable()
export class LogService {
  static logOptions:any;

  static getLogOptions() {
    return MeteorObservable.call('getLogOptions');
  }

  constructor() {
    MeteorObservable.call('getLogOptions').subscribe(res => {
      LogService.logOptions = res;
    });
  }

  log(message) {

  }

}