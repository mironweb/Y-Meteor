import { NgModule } from '@angular/core';

import { routing } from './shipping.routing';
import { SharedModule } from '../../modules/shared-module';
import { CommonModule } from '@angular/common';
import { MaterialImportModule } from '../../app/material-import.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SHIPPING_DECLARATIONS, SHIPPING_ENTRY_COMPONENTS } from './index';
import { DpDatePickerModule } from 'ng2-date-picker';
import { SimpleNotificationsModule } from 'angular2-notifications';

@NgModule({
  imports: [
    routing,
    SharedModule,
    CommonModule,
    FormsModule,
    MaterialImportModule,
    RouterModule,
    ReactiveFormsModule,
    DpDatePickerModule,
    SimpleNotificationsModule.forRoot()
  ],
  entryComponents: [SHIPPING_ENTRY_COMPONENTS],
  declarations: [SHIPPING_DECLARATIONS]
})
export class ShippingModule {}
