import {Component, HostBinding, OnDestroy, OnInit} from '@angular/core';
import {EventEmitterService} from "../services";
import {OverlayContainer} from "@angular/cdk/overlay";
import {Session} from "meteor/session";
import {MeteorObservable} from "meteor-rxjs";
import * as moment from 'moment';
import {PageResolver} from "../resolvers/PageResolver";
import * as funcs from '../../../both/functions/common';
import {Random} from "meteor/random";
import {NavigationEnd, Router} from '@angular/router';
import {UserService} from "../services/UserService";
import {UserGroupsService} from '../services/UserGroups.service';
import {SystemLogsService} from "../services/SystemLogs.service";
import { merge } from 'rxjs';
import {Subscriber} from "rxjs/Subscriber";

@Component({
  selector: 'app',
  templateUrl: 'app.html',
  providers: [EventEmitterService]
})

export class AppComponent implements OnDestroy {
  @HostBinding('class') componentCssClass;
  pathname = window.location.pathname;
  eventSubscriber: Subscriber<any>;

  constructor(
    private _router: Router,
    private _user: UserService,
    public overlayContainer: OverlayContainer,
    private userService: UserService,
    private systemLogsService: SystemLogsService,
    private _eventService: EventEmitterService) {
  }

  isRecoverOrReset() {
    if (/^\/recover/.test(this.pathname) ||
        /^\/reset/.test(this.pathname)) {
      return true;
    }
    return false;
  }

  ngOnInit() {
    MeteorObservable.subscribe('users',
      {parentTenantId: Session.get('parentTenantId')},
      {fields:
          {
            profile: 1,
            tenants: 1
          }
      }
      ).subscribe();
    MeteorObservable.subscribe('userFilters',
      {tenantId: Session.get('tenantId')}
    ).subscribe();

    this.setTheme({value: 'default-theme'});
    this.hookEvents();

    // let sub = MeteorObservable.subscribe('currentUser');
    // let autorun = MeteorObservable.autorun();
    //
    // merge(sub, autorun).subscribe(() => {
    //   let currentUser:any = Meteor.users.findOne(Meteor.userId());
    //   if (currentUser && 'status' in currentUser) {
    //
    //     // if (currentUser.status.idle) {
    //     //   MeteorObservable.call('update', 'users', {_id: currentUser._id}, {$set: {"status.editable": false, "status.page": window.location.pathname}})
    //     //     .subscribe(() => {
    //     //       MeteorObservable.call('users.setEditable', window.location.pathname).subscribe();
    //     //     });
    //     // } else {
    //     //   MeteorObservable.call('users.setEditable', window.location.pathname).subscribe();
    //     // }
    //   }
    // });

    let subdomain = Session.get('subdomain');
    if (Meteor.userId()) {

      let query = {
        subdomain
      };

      MeteorObservable.call('findOne', 'systemTenants', query, {})
        .subscribe((res:any) => {
          if (res) {
            Session.set('maxLoanValue', res.maxLoanAmount);
            Session.set('endContractDate', res.endContractDate);
          }
          this.onRouterChange();
        })
    } else {
      // exclude /recover and /reset from redirection
      if (this.isRecoverOrReset()) {
        return;
      }

      this._router.navigate(['/login']);
      this.onRouterChange();
    }

  }

  hookEvents() {
    this.eventSubscriber = EventEmitterService.Events.subscribe((event:any) => {
      if (event.name == 'setTheme') {
        this.setTheme(event);
      }
    })
  }

  setTheme(theme) {
    this.overlayContainer.getContainerElement().classList.add(theme.value);
    this.componentCssClass = theme.value;
  }

  onRouterChange() {
    this._router.events.subscribe(events => {
      if (events instanceof NavigationEnd) {
        if (this.pathname != window.location.pathname) {
          // real change
          let log = {
            log: 'Lands on ' + window.location.pathname,
            type: 'URL Change',
            url: window.location.pathname,
            createdAt: new Date(),
            _id: Random.id()
          };

          if (this.systemLogsService) {
            this.systemLogsService._log$(log).subscribe();
          }
          this.pathname = window.location.pathname;
        }
      }
    });
  }

  ngOnDestroy() {
    this.eventSubscriber.unsubscribe();
  }
}
//
// describe('test', () => {
//   it ('should run', () => {
//     console.log('it is running')
//     expect(true).to.equal(true);
//   })
// })
