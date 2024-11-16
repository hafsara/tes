import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserViewComponent } from './components/user-view/user-view.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AccessControlComponent } from './components/access-control/access-control.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'access-control', component: AccessControlComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'dashboard/:appName/load-form/:access_token', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'user-view/:access_token', component: UserViewComponent },
  { path: '404', component: PageNotFoundComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
