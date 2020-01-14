import { Component, Input, OnInit, ViewChild, ComponentFactoryResolver, OnDestroy } from '@angular/core';

import { ExecutiveService }         from './executive.service';
import { ExecutiveComponent }         from './executive-component';
import { ExecutiveDirective }         from './executive.directive';
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import { Subscription } from 'rxjs/Subscription';
import { EventEmitterService } from "../../services";
import { Subscriber } from "rxjs/Subscriber";

import {SystemOptionModel} from '../../../../both/models/systemOption.model';
import {take} from "rxjs/operators";


@Component({
  selector: 'executive-entry',
  template: `
    <ng-template executive-host></ng-template>
  `
})

export class ExecutiveEntryComponent implements OnInit, OnDestroy {

  baseUrl = 'executive';
  executiveItems = [];
  selectedModule:any;
  selectedRoute:any;
  componentName: string = '';
  sub:Subscription;
  eventSubscriber: Subscriber<any>;

  state = {
    oldUrl: ''
  };

  @ViewChild(ExecutiveDirective) executiveHost: ExecutiveDirective;

  systemOption: SystemOptionModel;
  constructor(private _router: Router, private _route: ActivatedRoute, private componentFactoryResolver: ComponentFactoryResolver, private executiveService: ExecutiveService) {}

  ngOnInit() {
    this.selectedModule = this._route.snapshot.data['pageData'];

    this.loadComponent();
    this.sub = this._router.events.subscribe((event) => {
      if(event instanceof NavigationEnd) {
        this.loadComponent();
      }
      // NavigationEnd
      // NavigationCancel
      // NavigationError
      // RoutesRecognized
    });
  }

  loadComponent() {
    const subRoutes = this.selectedModule.routes;
    // let suburl = window.location.pathname.split('/')[2];
    this._route.url.pipe(take(1)).subscribe(urls => {
      let suburl = urls[0].path;
      if (this.state.oldUrl != suburl) {
        let index = subRoutes.findIndex(route => {
          return route.url === suburl;
        });

        if (index != -1) {
          this.selectedRoute = subRoutes[index];

          this.executiveItems = this.executiveService.getExecutiveItems();

          index = this.executiveItems.findIndex((item) => {
            if (item.name == this.selectedRoute.component) {
              return true;
            }
          });

          let executiveItem = this.executiveItems[index];

          let componentFactory = this.componentFactoryResolver.resolveComponentFactory(executiveItem.component);

          let viewContainerRef = this.executiveHost.viewContainerRef;
          viewContainerRef.clear();

          let componentRef = viewContainerRef.createComponent(componentFactory);

          (<ExecutiveComponent>componentRef.instance).data = executiveItem.data;
          this.state.oldUrl = suburl;
        } else {

        }
      }
    })


  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}