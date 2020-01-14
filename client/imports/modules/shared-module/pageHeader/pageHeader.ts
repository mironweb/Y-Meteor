import {Component, Input, OnInit, OnChanges, HostListener, EventEmitter, Output, OnDestroy} from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd, Params} from "@angular/router";
import {SystemOptionsService} from "../../../services/SystemOptions.service";
import { merge } from 'rxjs';
import { EventEmitterService } from "../../../services";
import {Subscriber} from "rxjs/Subscriber";
import { ExecutiveService } from "../../../pages/executive/executive.service";
// import { ExecutiveItem } from '../../../pages/executive/executive-item';
import ExecutivePages from '../../../pages/executive/components';

@Component({
  selector: `page-header`,
  template: `
    <div class="sticky pageHeader" *ngIf="pageHeader">
      <h2 style="display: inline-block; padding: 10px;">
        {{ pageHeader }}
      </h2>
    </div>
    <div *ngIf='secondardObj?.buttons' class="float-right" style="padding: 10px; position: fixed; right: 0px; top: 50px;">
        <span *ngFor='let button of secondardObj?.buttons'>
          <button (click)="onClick(button)" style='float: right; height: 30px; line-height: 30px; margin-right: 5px;' mat-raised-button type="button">{{button.title}}</button>
        </span>
    </div>
  `,
  styles: [ 'pageHeader.scss' ]
})

export class PageHeader implements OnInit, OnChanges, OnDestroy {
  @Input() pageHeaderInput: string;
  @Output() showDashboardHeader = new EventEmitter<any>();

  eventSubscriber: Subscriber<any>;
  pageHeader: string;
  hookedEvent: boolean = false;
  secondardObj: any = {};
  emittedPageHeader: string;
  emmittedButtons: any;
  constructor(private _router: Router, private _route: ActivatedRoute,
              private systemOptionsService: SystemOptionsService,
              private _eventService: EventEmitterService,
              private executiveService: ExecutiveService) {
  }

  ngOnInit() {
    const moduelRoute:any = this._route.snapshot.data['pageData'];

    const suburl = window.location.pathname.split('/')[2];
    this.onAbsoluteUrlChange();
    this.hookEvents();
    this._router.events.subscribe((event) => {
      this.emittedPageHeader = null;
      this.emmittedButtons = null;
      if (event instanceof NavigationEnd) {
        this.onAbsoluteUrlChange();
      }
    })
  }

  onAbsoluteUrlChange() {
    let pageHeader = this.systemOptionsService.getPageheader();
    if (pageHeader) {
      this.pageHeader = pageHeader.returnString;
      this.secondardObj = pageHeader.secondardObj ? pageHeader.secondardObj : {};
    }
    if (this.emittedPageHeader) {
      this.pageHeader = this.emittedPageHeader;
    }
    if (this.emmittedButtons) {
      this.secondardObj.buttons = this.emmittedButtons ? this.emmittedButtons : null;
    }
  }

  onClick(button) {
    if ('eventName' in button) {
      EventEmitterService.Events.emit({ name: button.eventName,  value: {}});
    }
  }

  hookEvents() {
    this.eventSubscriber = EventEmitterService.Events.subscribe(res => {
      setTimeout(() => {
        if(res.pageHeader){
          this.emittedPageHeader = res.pageHeader
        }
        if (res.name == 'loadPageheaderButtons') {
          this.emmittedButtons = res.value;
          this.hookedEvent = true;
        }
        // if (res.name == 'customFabButton_execReport') {
        //   // this.isProcessing = res.value;
        //   console.log('customFabButton_execReport')

        // }
        // if (res.name == 'overviewReport') {
        //   console.log(res.value)
        //   this.hookedEvent = true;
        // }
        this.onAbsoluteUrlChange();
      }, 500);
    })
  }

  sticky() {
  }


  ngOnChanges(changes) {
    this.pageHeader = changes.pageHeaderInput.currentValue;
  }

  ngOnDestroy() {
    this.eventSubscriber.unsubscribe();
  }
}