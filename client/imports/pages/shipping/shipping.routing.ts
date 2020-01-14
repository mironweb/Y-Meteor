import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ShippingDashboardPage } from './shipping-dashboard.page';
import { ShippingReviewPage } from './shipping-review.page';
import { ShippingCreatePage } from './shipping-create.page';
import { ShippingUpdatePage } from './shipping-update.page';

const routes: Routes = [
  { path: 'dashboard', component: ShippingDashboardPage },
  { path: 'order/:orderNumber', component: ShippingReviewPage },
  { path: 'order/:orderNumber/product/:itemCode', component: ShippingCreatePage },
  { path: 'order/:orderNumber/product/:shipmentProductId/edit', component: ShippingUpdatePage },
  { path: '**', redirectTo: 'dashboard' },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
