import {EventEmitter, Injectable, Output} from '@angular/core';
import {Subject} from "rxjs/Subject";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

@Injectable()
export class EventEmitterService {
  static Events:EventEmitter<any> = new EventEmitter <any>();

  events: EventEmitter<any> = new EventEmitter <any>();
  sub = new Subject<any>();
  @Output() behavior = new BehaviorSubject({});

  pageHeaderButtonEvents = new EventEmitter<any>();
  constructor() {
  }

  callEvent(event) {
    this.behavior.next(event);
  }

}