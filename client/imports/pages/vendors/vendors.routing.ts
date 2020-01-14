import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PurchaseOrders} from "./purchaseOrders";
import { PurchaseOrder} from "./purchaseOrder";

const routes: Routes = [
  { path: 'purchase-orders', component: PurchaseOrders },
  { path: 'purchase-orders/:documentId', component: PurchaseOrder },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
