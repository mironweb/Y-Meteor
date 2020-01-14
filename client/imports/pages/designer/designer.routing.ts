import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {DesignerDashboardPage} from "./designer-dashboard.page";

const routes: Routes = [
  { path: '', redirectTo: 'alerts' },
  { path: 'dashboard', component: DesignerDashboardPage },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
