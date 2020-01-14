import { NgModule } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';

import { MainDashboardComponent } from './main-dashboard.component';

@NgModule({
  imports: [
    FormsModule,
    RouterModule.forChild([
      { path: '', component: MainDashboardComponent },
      { path: 'test', component: MainDashboardComponent }
    ])
  ],
  declarations: [
    MainDashboardComponent
  ]
})
export class MainDashboardModule{}
