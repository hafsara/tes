import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserViewComponent } from './components/user-view/user-view.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AccessControlComponent } from './components/access-control/access-control.component';

const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'access-control', component: AccessControlComponent },
  { path: 'user-view/:access_token', component: UserViewComponent },
  { path: 'dashboard/load-form/:access_token', component: DashboardComponent },
  { path: '404', component: PageNotFoundComponent },
  { path: '**', redirectTo: '/404' },
  { path: '', redirectTo: '/access-control', pathMatch: 'full' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
