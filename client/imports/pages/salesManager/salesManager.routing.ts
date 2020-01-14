import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SalesManagerDashboardPage } from "./salesManager-dashboard.page";
import { BudgetDashboardPage } from "../executive/components/budget/budget.page"

const routes: Routes = [
  { path: '', redirectTo: 'alerts' },
  { path: 'dashboard', component: SalesManagerDashboardPage },
  { path: 'budget', component: BudgetDashboardPage },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
