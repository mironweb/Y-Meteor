import { Router, Params, ActivatedRoute } from '@angular/router';
import {MeteorObservable} from "meteor-rxjs";
import { Component, OnInit, OnDestroy} from '@angular/core';
import { CalendarUtils } from 'angular-calendar';
import { MatDialog } from '@angular/material';
import {NotificationsService} from 'angular2-notifications';
import {
  WeekViewEventRow
} from 'calendar-utils';
import {startOfWeek, endOfWeek} from 'date-fns';
import * as isSameDay from 'date-fns/is_same_day';
import * as isSameMonth from 'date-fns/is_same_month';
import * as moment from 'moment';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { getReferredLookupId, parseAll, runAggregate } from '../../../../../../both/functions/common';
import {UserService} from "../../../../services/UserService";
import {switchMap, tap} from "rxjs/operators";
import {SystemLookup} from "../../../../../../both/models/systemLookup.model";

const colors: any = {
    cancelled: {
      primary: '#F44336',
      secondary: '#FFCDD2'
    },
    pending: {
      primary: '#03A9F4',
      secondary: '#B3E5FC'
    },
    complete: {
      primary: '#00E676',
      secondary: '#B9F6CA'
    },
    followUp: {
      primary: '#ffea00',
      secondary: '#ffff00'
    },
};


@Component({
  selector: 'customer-meetings',
  templateUrl: 'customers-meetings.page.html',
  styleUrls: ['customers-meetings.page.scss'],
})

export class CustomersMeetingsPage implements OnInit, OnDestroy {
  public subscriptions: Subscription[] = [];
  isDataReady: boolean = false;
  dropdownLoading: boolean = false;
  documentId: string;
  data: any = {};
  filterConditions: any;

  Device = Meteor['Device'];

  end: string;
  start: string;

  selectedPerson: string;
  displayedPerson: string;

  eventRows: WeekViewEventRow[] = [];

  typeOfLookup: string = 'month';
  activeToggle: string = 'month';
  urlDateFormat: string = "MM.DD.YYYY";
  view: string = 'month';
  viewDate: Date = new Date();
  excludeDays: number[] = [0, 6];

  refresh: Subject<any> = new Subject();
  events: any[] = [
    // {
    //   title: 'TEST',
    //   start: setHours(setMinutes(new Date(), 0), 8),
    //   end: setHours(setMinutes(new Date(), 0), 10),
    //   color: colors.pending
    // }
  ];

  colorArr: any[] = [];
  objLocal: any = {};

  query: any[] = [];
  calendarQuery: any[] = [];
  queryParams:any = {};

  viewAllMeetings: any[] = [];
  systemLookup: SystemLookup;
  viewAll: boolean = false;

  activeDayIsOpen: boolean;
  email: string;
  hideList: boolean = true;

  constructor(private route: ActivatedRoute, private activatedRoute: ActivatedRoute, private dialog: MatDialog, private _service: NotificationsService, private router: Router, private utils: CalendarUtils,) {}


  async init() {
    let result;
    this.objLocal.data = {};
    this.objLocal.parentTenantId = Session.get('parentTenantId');
    this.objLocal.tenantId = Session.get('tenantId');
    this.objLocal.documentId = Meteor.userId();
    this.documentId = Meteor.userId();

    MeteorObservable.call('returnUser', Meteor.userId())
      .pipe(
        tap(user => {
          this.email = user["profile"].microsoftEmail;

          this.data.userIds = user["manages"];
          this.objLocal.data.userIds = user["manages"];
          this.data.userIds.push(this.objLocal.documentId);
          this.objLocal.data.userIds = this.data.userIds;
          if (this.data.userIds.length > 1) {
            this.viewAll = true;
          }
        }),
        switchMap(() => {
          return MeteorObservable.call('checkSystemPermission', Meteor.userId(), { name: 'accessAllMeetings'});
        }),
        tap((permission:any) => {
          if (permission['result'].length > 0) {
            if (permission['result'][0].status === 'enabled') {
              this.viewAll = true;
            }
          }
        }),
        switchMap(() => {
          return MeteorObservable.call('runAggregate', 'users', [{ $project: { _id: 1, personalColor: "$profile.personalColor" } }]);
        }),
        tap(personalColors => {
          this.colorArr = personalColors
        }),
        switchMap(() => {
          return SystemLookup._GetReferredLookup$(UserService.user,'customerMeetings')
        }),
        tap((lookup) => {
          this.systemLookup = new SystemLookup(lookup);
          this.typeOfLookup = lookup['methods'][0].type;
        }),
        switchMap(() => {
          return this.activatedRoute.queryParams;
        }),
        tap(params => {
          this.systemLookup.init(this.objLocal, params);

          this.isDataReady = false;
          if (params['view'] === 'week') {
            this.start = new Date(startOfWeek(this.viewDate)).toISOString();
            this.end = new Date(endOfWeek(this.viewDate)).toISOString();
          } else if (params['view'] === 'list'){
            this.activeToggle = 'list';
            this.hideList = false;
          }
          else {
            this.start = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1).toISOString();
            this.end = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1).toISOString();
          }
          this.query = parseAll(this.systemLookup['methods'][0].args, this.objLocal)[0];
          this.calendarQuery = parseAll(this.systemLookup['methods'][0].args, this.objLocal)[0];
          this.systemLookup.keywords = params.keywords;

        }),
        tap(() => {
          let stages = this.systemLookup._getQueryStages();
          delete this.calendarQuery[this.calendarQuery.length - 1].$project.branch;
          delete this.calendarQuery[this.calendarQuery.length - 1].$project.customerName;
          this.calendarQuery = [this.calendarQuery[0], this.calendarQuery[this.calendarQuery.length - 1]];
          this.calendarQuery = [...this.calendarQuery, ...stages];

        }),
        switchMap(() => {
          return this._returnMeetings$(this.systemLookup.methods[0].collectionName, this.calendarQuery, this.start, this.end);

        })


      ).subscribe();
  }

  ngOnInit() {
    this.init();
  }

  _returnMeetings$(collectionName, query, firstDay, lastDay) {
    return MeteorObservable.call('getUsersMeetings', collectionName, query, firstDay, lastDay)
      .pipe(
        tap(meetings => {
          this.events = this.formatMeetingArray(meetings);

          this.events.sort(function(a,b) {
            return a.start - b.start
          });
          this.isDataReady = true;
          if (!this.viewAll) {
            this.retrieveMeetingLablesForIndividuals(Meteor.userId());
          }
        })
      )
  }
  
  formatMeetingArray(meetings){
    let meetingArray = [];
    if (meetings.length > 0) {
      meetings.map(meeting => {
        // let result = AllCollections['customers'].collection.findOne({_id: meeting.customerId}).fetch();
        let name = meeting.customerName ? meeting.customerName : '';
        let user = meeting.userName;
        let initials = user.match(/\b\w/g) || [];
        initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
        // let personalColor = meeting.personalColor
        let personalColor;
        let userInfo = this.colorArr.find(o => o._id === meeting.userId);
        if (userInfo !== undefined) {
          personalColor = userInfo['personalColor'];
        }

        // let branch = meeting.branch 
        let branch = (meeting.branch === "") ? "NO BRANCH SELECTED" : meeting.branch;
        branch = branch ? branch : '';
        let dateTime = meeting.dateTime
        let endDateTime = meeting.endDateTime
        let status = meeting.status.toLowerCase()
        let color
        let meetingObj = {}
        let titleTime = moment(dateTime).format('h:mm A');
        let calendarViewDate = moment(dateTime).format('hh:mma');

        switch (status) {
          case "cancelled":
            color = colors.cancelled;
            break;
          case "pending":
            color = colors.pending;
            break;
          case "complete":
            color = colors.complete;
            break;
        }
        if (meeting.followUp && status != 'complete'){
          color = colors.followUp
        }

        meetingObj = {
          title: titleTime + " - " + name + " - " + branch,
          dropDownTemplateTitle: titleTime + " - " + name + " - " + branch,
          status: status,
          start: new Date(dateTime),
          color: color,
          id: meeting._id,
          user: user,
          userId: meeting.userId,
          initials: initials,
          personalColor: personalColor,
          calendarViewBadge: calendarViewDate + " - " + name
        }

        if (endDateTime !== undefined) {
          meetingObj['end'] = new Date(endDateTime);
        }

        if (this.viewAll) {
          meetingObj['title'] = meetingObj['initials'] + ': ' + meetingObj['title'];
        }

        meetingArray.push(meetingObj)
      });
    }
    return meetingArray;
  }

  dayClicked({ date, events }: { date: Date; events: any[] }, event): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true && this.displayedPerson === this.selectedPerson) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
        this.displayedPerson = this.selectedPerson
      }
    }
  }

  async testingBadges(day, dayEvents, event) {
    // this.dropdownLoading = true;
    await this.retrieveClickedMeetings(day, event)
    this.refreshView();
    // this.dropdownLoading = false;
    this.selectedPerson = event.key;
  }
  
  async retrieveClickedMeetings(day, event){
    let startDate, endDate
    startDate = new Date(moment(day.date).startOf('day').format());
    endDate = new Date(moment(day.date).endOf('day').format());
    let results = this.events.filter(function (meeting) {
      let date = new Date(meeting.start);
      if (event.userId) {
        return (date >= startDate && date <= endDate && meeting.userId === event.userId);
      } else {
        return (date >= startDate && date <= endDate);
      }
    });

    let pipeline = this.query;
    pipeline[0] = {
      "$match": {
        "_id": { $in: results.map(a => a.id) }
      }
    }
    let meetings:any = await runAggregate('customerMeetings', pipeline);
    meetings = meetings['result'];
    meetings = this.formatMeetingArray(meetings);
    meetings.forEach(meeting => {
      let objIndex = this.events.findIndex((obj => obj.id === meeting.id));
      this.events[objIndex] = meeting;
    });
    return meetings;
  }

  async retrieveMeetingLablesForIndividuals(userId) {
    let startDate, endDate
    startDate = new Date(moment(this.start).format());
    endDate = new Date(moment(this.end).format());
    let results = this.events

    let pipeline = this.query;
    pipeline[0] = {
      "$match": {
        "_id": { $in: results.map(a => a.id) }
      }
    }
    let meetings: any = await runAggregate('customerMeetings', pipeline);
    meetings = meetings['result'];
    meetings = this.formatMeetingArray(meetings);
    meetings.forEach(meeting => {
      let objIndex = this.events.findIndex((obj => obj.id === meeting.id));
      this.events[objIndex] = meeting;
    });
    this.refreshView();
    return meetings;
  }

  refreshView(): void {
    this.refresh.next();
  }

  handleEvent(action: string, event: any[]): void {
    if (event['_id'] && !event['id']) {
      event['id'] = event['_id']
    }
    this.router.navigate(['customers/meetings/' + event['id']], { queryParams: { stepperIndex: 4 }, queryParamsHandling: 'merge' });
  }

  onSelect(selection) {
    this.view = selection;
    this.hideList = true;
    if (selection === 'week') {
      this.start = new Date(startOfWeek(this.viewDate)).toISOString();
      this.end = new Date(endOfWeek(this.viewDate)).toISOString()
    } else if (selection === 'month') {
      this.start = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1).toISOString()
      this.end = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1).toISOString()
    }
    this.activeDayIsOpen = false;

    this._returnMeetings$(this.systemLookup.methods[0].collectionName, this.calendarQuery, this.start, this.end).subscribe();
    this.activeToggle = this.view;

    this.router.navigate([], { queryParams: { view: this.view }, queryParamsHandling: 'merge' });
  }

  list(selection) {
    this.activeToggle = selection;
    this.router.navigate([], { queryParams: { view: 'list' }, queryParamsHandling: 'merge' });

    this.hideList = false;
  }

  arrowFunction() {
    this.activeDayIsOpen = false;
    if (this.view === 'month') {
      this.start = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth(), 1).toISOString()
      this.end = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1).toISOString()
    } else if (this.view === 'week') {
      this.start = new Date(startOfWeek(this.viewDate)).toISOString()
      this.end = new Date(endOfWeek(this.viewDate)).toISOString()
    }
    this.isDataReady = false;
    // this.returnMeetings(this.systemLookup.methods[0].collectionName, this.calendarQuery, this.start, this.end);
    
    this.router.navigate([], { queryParams: { viewDate: this.viewDate}, queryParamsHandling: 'merge' });
  }

  returnToOldApp(action) {
    window.location.href = 'https://app.yibas.com/createQuote';
  }

  getFilterConditions(action) {
    this.reducers(action);
  }

  reducers(action) {
    switch(action.type) {
      case 'UPDATE_FILTERCONDITIONS':
        this.filterConditions = action.value;
        return;
      case 'ADD_FILTER':
        this.filterConditions = action.value;
        return;
      default:
        return;
    }
  }

  getAggregate(args){
    this.query = this.removeLimitAndSkip(args[0]);
    this._returnMeetings$(this.systemLookup.methods[0].collectionName, this.query, this.start, this.end).subscribe();
  }

  removeLimitAndSkip(pipeline) {
    let removeValFromIndex = [];
    let arr = pipeline;
    arr.forEach((element, index, object) => {
      if ('$limit' in element || '$skip' in element) {
        removeValFromIndex.push(index)
      }
    });
    for (let i = removeValFromIndex.length - 1; i >= 0; i--) {
      arr.splice(removeValFromIndex[i], 1)
    }
    return arr;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => {
      // subscription.unsubscribe();
    })
  }
}

