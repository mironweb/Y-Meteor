import { NgModule } from '@angular/core';

import { routing } from './inventory.routing';
import {SharedModule} from "../../modules/shared-module";
import {CommonModule} from "@angular/common";
import {MaterialImportModule} from "../../app/material-import.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {RouterModule} from "@angular/router";
import {INVENTORY_DECLARATIONS} from "./index";
import {InventoryPage} from "./InventoryPage";
import {SimpleNotificationsModule} from "angular2-notifications";
import { InventoryService } from "./inventory.service";


@NgModule({
  imports: [
    routing,
    SharedModule,
    CommonModule,
    FormsModule,
    MaterialImportModule,
    RouterModule,
    ReactiveFormsModule
  ],
  entryComponents: [
    InventoryPage
  ],
  providers: [
    InventoryService
  ],
  declarations: [INVENTORY_DECLARATIONS],
  bootstrap: [ InventoryPage ]

})
export class InventoryModule {}