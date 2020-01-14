import {ModuleWithProviders} from '@angular/core';
import {Routes, RouterModule, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

import ExecutivePages from './index';
// import {ExecutiveOpenordersPage} from './components/executive-openorders.page';
import {CanActivateTeam} from "./guard";
import {ExecutiveEntryComponent} from "./executive-entry.component";

const baseRoute = "executive/";

const routes: Routes = [
  {path: '**', component: ExecutiveEntryComponent},

  // {path: 'dashboard', component: ExecutiveDashboardPage['ExecutiveDashboardPage'], canActivate: ['canActivateTeam']},
];

export const ROUTES_PROVIDERS = [
  {
    provide: 'canActivateTeam',
    useValue: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {

      // route.routeConfig._loadedConfig.routes.unshift({path: 'test1', component: InventoryInfoPage});
      // route.routeConfig._loadedConfig.routes.unshift({path: 'info', component: InventoryInfoPage});
      // route.routeConfig._loadedConfig.routes.pop();
      return true;
    }
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
