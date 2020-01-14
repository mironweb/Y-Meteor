import {Component, Input, OnInit, OnDestroy, EventEmitter, Output, ViewChild, ElementRef} from '@angular/core';
import {MatDialog} from '@angular/material';
import {ActivatedRoute, Router, Params, NavigationEnd} from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import {PageResolver} from "../../../resolvers/PageResolver";
import {EventEmitterService} from "../../../services";
import {SystemPermissionsService} from "../../../services/SystemPermissions.service";
import {SystemOptionsService} from "../../../services/SystemOptions.service";
import {Subscriber} from "rxjs/Subscriber";

@Component({
  selector: 'fabButton',
  templateUrl: 'fabButton.component.html',
  styleUrls: [ 'fabButton.component.scss' ]
})

export class FabButtonComponent implements OnInit, OnDestroy {
  @Input() fabButton: any;
  @Input() data: any;
  @Output() emitter: any = new EventEmitter <any>();

  @ViewChild('menu') menu: ElementRef;

  eventSubscriber: Subscriber<any>;
  isClosed = true;
  count = 0;
  sub: Subscription;
  systemLookup: any;
  label: string;
  buttonIcon: string;
  buttons: Array<any> = [];
  isProcessing: boolean = false;

  constructor(public dialog: MatDialog, private _router: Router,
              private _route: ActivatedRoute,
              private systemPermissionsService: SystemPermissionsService,
              private systemOptionsService: SystemOptionsService) {}

  ngOnInit() {
    this.getButtons();
    this.hookEvents();
  }

  hookEvents() {
    this.eventSubscriber = EventEmitterService.Events.subscribe(res => {
      // console.log('fabButton',res)
      if (res.name == 'isProcessing') {
        this.isProcessing = res.value;
      }
    })
  }

  getButtons() {
    this.onAbsoluteUrlChange();
    this._router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.onAbsoluteUrlChange();
      }
    });
  }

  onAbsoluteUrlChange() {
    let pageRoute = this.systemOptionsService.getCurrentPageRoute();

    if ('data' in pageRoute) {
      if ('buttonIcon' in pageRoute.data) {
        this.buttonIcon = pageRoute.data.buttonIcon;
      }
      if ('buttons' in pageRoute.data) {
        // changed
        this.buttons = pageRoute.data.buttons.filter(button => this.systemPermissionsService.systemPermissions[button.permissionId] == 'enabled');
      }
    } else {
      this.buttons = [];
      this.buttonIcon = '';
    }
  }

  onClick(button){
    const url = button.url;
    if ('url' in button) {
      if (url.indexOf("http://") == 0 || url.indexOf("https://") == 0) {
        window.location.href = url;
      } else {
        let arr = url.split('?');
        let absolutePath = arr[0];
        let obj:any = {};
        if (arr.length > 1) {
          let paramStr = arr[1];
          let paramsArr = paramStr.split('&');
          paramsArr.forEach(paramStr => {
            let key = paramStr.split('=')[0];
            obj[key] = paramStr.split('=')[1];
          })
        }

        this._router.navigate([absolutePath], {queryParams: obj });
      }
    } else {
      if ('eventName' in button) {
        EventEmitterService.Events.emit({name: button.eventName});
      }
    }
  }

  closed(e) {
    if (this.count == 1) {
      if (this.menu['_panelAnimationState'] == 'void') {
        this.emitter.emit(false);
      } else {
        this.emitter.emit(true);
      }
      if (this.buttons.length == 0) {
        this.emitter.emit(true);
      }
      this.count = 0;
    } else {
      this.count++;
    }
  }

  open(e) {

  }

  ngOnDestroy() {
    // this.sub.unsubscribe();
    if (this.eventSubscriber) {
      this.eventSubscriber.unsubscribe()
    }
  }
}
