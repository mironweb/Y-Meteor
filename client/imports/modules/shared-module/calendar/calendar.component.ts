import { Router } from '@angular/router';
import { Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import { CalendarUtils } from 'angular-calendar';
import {NotificationsService, SimpleNotificationsComponent} from 'angular2-notifications';
import {
  CalendarEvent,
  WeekDay,
  MonthView,
  MonthViewDay,
  GetMonthViewArgs,
  getMonthView,
  WeekViewEventRow
} from 'calendar-utils';
import * as addDays from 'date-fns/add_days';
import {startOfWeek, endOfWeek} from 'date-fns';
import * as isSameDay from 'date-fns/is_same_day';
import * as isSameMonth from 'date-fns/is_same_month';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

const colors: any = {
  cancelled: {
    primary: '#F44336',
    secondary: '#FFCDD2'
  },
  pending: {
    primary: '#00E676',
    secondary: '#B9F6CA'
  },
  complete: {
    primary: '#03A9F4',
    secondary: '#B3E5FC'
  }
};

export class MyCalendarUtils extends CalendarUtils {
  getMonthView(args: GetMonthViewArgs): MonthView {
    args.viewStart = startOfWeek(args.viewDate);
    args.viewEnd = addDays(args.viewStart, 6);
    return getMonthView(args);
  }
}

@Component({
  selector: 'calendar',
  templateUrl: "calendar.component.html",
  styleUrls: [ 'calendar.component.scss' ],
  providers: [
    {
      provide: CalendarUtils,
      useClass: MyCalendarUtils
    }
  ]
})

export class CalendarComponent implements OnChanges {
  @Input() viewDate: any;
  @Input() returnedEvents: any;
  @Input() viewAll: any;

  selectedPerson: string;
  displayedPerson: string;
  view: string = 'month';
  excludeDays: number[] = [0, 6];
  refresh: Subject<any> = new Subject();
  viewAllMeetings: any[] = [];
  // viewAll: boolean = true;
  activeDayIsOpen: boolean;

  constructor(private router: Router) {}

  ngOnChanges(changes: SimpleChanges) {
    this.activeDayIsOpen = false;
  }

  dayClicked({ date, events }: { date: Date; events: any[] }): void {
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

  clickBadges(day, dayEvents, event) {
    this.selectedPerson = event.key
  }

  handleEvent(action: string, event: any[]): void {
    this.router.navigate(['customers/meetings/' + event['id']]);
  }
}
