import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AccountingDashboardPage} from "./accounting-dashboard.page";

const routes: Routes = [
  { path: '', redirectTo: 'alerts' },
  { path: 'dashboard', component: AccountingDashboardPage },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
