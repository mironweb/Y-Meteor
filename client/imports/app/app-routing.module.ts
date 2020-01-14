import { NgModule }       from '@angular/core';
import { RouterModule }   from '@angular/router';

import {LoginComponent} from "../modules/accounts/login/login.component";
import {SignupComponent} from "../modules/accounts/signup/signup.component";
import {RecoverComponent} from "../modules/accounts/recover/recover.component";
import {ResetComponent} from "../modules/accounts/reset/reset.component";
import {PageResolver} from "../resolvers/PageResolver";
import {DashboardPage} from "../pages/dashboard/dashboard.page";

import {CanActivateTeam} from "../services/CanActivateTeam";
import {DashboardRedirect} from "../services/DashboardRedirect";
import {CustomersContractsPage} from "../pages/customers/components/contracts/customers-contracts.page";
import {PageNotFoundComponent} from "./page-not-found/page-not-found.component"


const resolve = {
  pageData: PageResolver,
  // groupsPermissions: GroupsPermissionsService
}

@NgModule({
  imports: [
    RouterModule.forRoot([
      {
        path: 'login', component: LoginComponent,
      },
      {
        path: 'signup', component: SignupComponent,
      },
      {
        path: 'recover', component: RecoverComponent,
      },
      {
        path: 'reset/:token', component: ResetComponent,
      },
      {
        path: '', component: DashboardPage,
        children: [
          // { path: '', redirectTo: 'customers', pathMatch: 'full'},
          { path: 'admin', loadChildren: "../pages/admin/admin.module#AdminModule", canActivate: [CanActivateTeam], resolve },
          { path: 'customers', loadChildren: "../pages/customers/customers.module#CustomersModule", resolve },
          // { path: 'customers', component: CustomersContractsPage },
          { path: 'developer', loadChildren: "../pages/developer/developer.module#DeveloperModule", canActivate: [CanActivateTeam], resolve },
          { path: 'designer', loadChildren: "../pages/designer/designer.module#DesignerModule", canActivate: [CanActivateTeam], resolve },
          { path: 'account', loadChildren: "../pages/account/account.module#AccountModule", resolve },
          { path: 'executive', loadChildren: "../pages/executive/executive.module#ExecutiveModule", canActivate: [CanActivateTeam], resolve },
          { path: 'accounting', loadChildren: "../pages/accounting/accounting.module#AccountingModule", canActivate: [CanActivateTeam], resolve },
          { path: 'sales_manager', loadChildren: "../pages/salesManager/salesManager.module#SalesManagerModule", canActivate: [CanActivateTeam], resolve },
          { path: 'sales', loadChildren: "../pages/sales/sales.module#SalesModule", canActivate: [CanActivateTeam], resolve },
          { path: 'inventory', loadChildren: "../pages/inventory/inventory.module#InventoryModule", canActivate: [CanActivateTeam], resolve },
          { path: 'vendors', loadChildren: "../pages/vendors/vendors.module#VendorsModule", canActivate: [CanActivateTeam], resolve },
          { path: 'shipping', loadChildren: "../pages/shipping/shipping.module#ShippingModule", resolve },
          // { path: '**', redirectTo: 'customers/meetings'}
        ]
      },
      {
        // path: '**', redirectTo: ''
        path: '**', component: PageNotFoundComponent
      }
    ])
  ],
  exports: [ RouterModule ] // re-export the module declarations
})
export class AppRoutingModule { }