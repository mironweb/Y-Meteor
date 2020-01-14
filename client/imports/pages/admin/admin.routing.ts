import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import {AdminLogsPage} from "./AdminLogsPage";
import {AdminUsersPage} from "./admin-users.page";
import {AdminPermissionsPage} from "./admin-permissions.page";
import {AdminPermissionPage} from "./admin-permission.page";
import {AdminGroupsPage} from "./admin-groups.page";
import {AdminGroupPage} from "./admin-group.page";
import {AdminTenantsPage} from "./admin-tenants.page";
import {AdminTenantPage} from "./admin-tenant.page";
import {AdminUserPage} from "./admin-user.page";

const routes: Routes = [
  { path: '', redirectTo: 'logs' },
  { path: 'logs', component: AdminLogsPage },
  { path: 'users', component: AdminUsersPage },
  { path: 'users/:documentId', component: AdminUserPage },
  { path: 'permissions', component: AdminPermissionsPage },
  { path: 'permissions/:documentId', component: AdminPermissionPage },
  { path: 'groups', component: AdminGroupsPage },
  { path: 'groups/:documentId', component: AdminGroupPage },
  { path: 'tenants', component: AdminTenantsPage },
  { path: 'tenants/:documentId', component: AdminTenantPage },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
