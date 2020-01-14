import { NgModule} from '@angular/core';

import {SharedModule} from "../../modules/shared-module";
import {CommonModule} from "@angular/common";
import {MaterialImportModule} from "../../app/material-import.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CalendarModule } from 'angular-calendar';
import {DpDatePickerModule} from 'ng2-date-picker';
import {SimpleNotificationsModule} from "angular2-notifications";
import { ChartsModule } from 'ng2-charts';

import { CustomersService } from "./customers.service";
import { SERVICE_PROVIDERS } from "../../services";
import {CUSTOMERS_DECLARATIONS} from "./index";
import {CustomersRoutingModule} from "./customers.routing.module";
import { DeleteDialog } from './components/meetings-create/customers-meetings-create.component';
import { NguiMapModule } from '@ngui/map';
import {NativeDateAdapter, DateAdapter, MatNativeDateModule, MatDatepickerModule, MAT_DATE_FORMATS} from '@angular/material';
import {dateTimeFormat} from "../../../../both/config/systemConfig";
import moment = require("moment");


export class CustomDateAdapter extends NativeDateAdapter {
  format(date: Date, displayFormat: Object): string {

    if (window.location.pathname == '/customers/meetings/create/2') {
      const roundedUp = Math.ceil(moment().minute() / 15) * 15;
      let dateTime = moment().minute(roundedUp).second(0).format(dateTimeFormat);
      console.log('date time', dateTime);
      // this.endDateTime = moment(new Date(this.dateTime)).add(1, 'hours').format(dateTimeFormat);

      // const day = date.getUTCDate();
      // const month = date.getUTCMonth() + 1;
      // const year = date.getFullYear();
      // Return the format as per your requirement
      return dateTime;
    } else {
      return date.toDateString();
    }
  }

  // If required extend other NativeDateAdapter methods.
}

const MY_DATE_FORMATS = {
  parse: {
    dateInput: {month: 'short', year: 'numeric', day: 'numeric'}
  },
  display: {
    dateInput: 'input',
    monthYearLabel: {year: 'numeric', month: 'short'},
    dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
    monthYearA11yLabel: {year: 'numeric', month: 'long'},
  }
};

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL',
  },
  display: {
    dateInput: 'LL',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  }
};

@NgModule({
  imports: [
    SharedModule,
    MatNativeDateModule,
    MatDatepickerModule,
    SimpleNotificationsModule.forRoot(),
    CommonModule,
    FormsModule,
    MaterialImportModule,
    RouterModule,
    ReactiveFormsModule,
    CalendarModule.forRoot(),
    DpDatePickerModule,
    CustomersRoutingModule,
    ChartsModule,
    NguiMapModule
  ],
  entryComponents: [
    DeleteDialog
  ],
  declarations: [CUSTOMERS_DECLARATIONS],
  providers: [
    CustomersService,
    SERVICE_PROVIDERS,
    {
      provide: DateAdapter, useClass: CustomDateAdapter
    },
    {
      provide: MAT_DATE_FORMATS, useValue: MY_FORMATS
    }
  ]
})
export class CustomersModule {

}
