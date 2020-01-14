import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AccountProfilePage } from "./account-profile.page";
import { AccountSettingsPage } from "./account-settings.page";

const routes: Routes = [
  { path: '', redirectTo: 'alerts' },
  { path: 'profile', component: AccountProfilePage },
  { path: 'settings', component: AccountSettingsPage },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
