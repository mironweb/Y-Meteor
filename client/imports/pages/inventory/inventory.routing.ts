import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import InventoryPages from './index';
import {InventoryInfoPage} from "./inventory-info.page";
import {InventoryCategoriesPage} from "./inventory-categories.page";
import {InventoryCategoryPage} from "./inventory-category.page";
import {InventoryWorkOrderReleasePage} from "./inventory-workOrderRelease.page";
import {InventoryWorkOrderReleaseDetailPage} from "./inventory-workOrderReleaseDetail.page";
import { InventoryProductionOrdersPage } from "./inventory-productionOrders.page";
import { InventoryProductionOrderPage } from "./inventory-productionOrder.page";
import {InventoryProductionRunsPage} from "./inventory-productionRuns.page";
import {InventoryWarehouseTempsPage} from "./inventory-warehouseTemps.page";
import {InventoryAddTempUserPage} from "./inventory-addTempUser.page";
import {InventoryWarehouseTempUserPage} from "./inventory-warehouseTempUser.page";

let routes: Routes = [
  { path: '', redirectTo: 'info' },
  { path: 'info', component: InventoryInfoPage },
  { path: 'production-orders', component: InventoryProductionOrdersPage },
  { path: 'production-orders/:documentId', component: InventoryProductionOrderPage }, // document = billId
  { path: 'production-runs', component: InventoryProductionRunsPage },
  { path: 'warehouse-temps', component: InventoryWarehouseTempsPage },
  { path: 'warehouse-temps/add-temp-user', component: InventoryAddTempUserPage },
  { path: 'warehouse-temps/:documentId', component: InventoryWarehouseTempUserPage },
  { path: 'categories', component: InventoryCategoriesPage },
  { path: 'categories/:documentId', component: InventoryCategoryPage },
  { path: 'production-order-release', component: InventoryWorkOrderReleasePage },
  { path: 'production-order-release/:documentId', component: InventoryWorkOrderReleaseDetailPage },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);