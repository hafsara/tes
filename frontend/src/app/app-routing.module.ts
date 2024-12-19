import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserViewComponent } from './components/user-view/user-view.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { AccessControlComponent } from './components/access-control/access-control.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { AuthComponent } from './components/auth/auth.component';
import { sSOGuard } from './guards/sso.guard';

const routes: Routes = [
  { path: 'access-control', component: AccessControlComponent, canActivate: [sSOGuard]},
  { path: 'auth', component: AuthComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [sSOGuard, AuthGuard] },
  { path: 'create-form', component: DashboardComponent, canActivate: [sSOGuard, AuthGuard] },
  { path: 'dashboard/:appName/load-form/:access_token', component: DashboardComponent, canActivate: [sSOGuard, AuthGuard] },
  { path: 'user-view/:access_token', component: UserViewComponent, canActivate: [sSOGuard] },
  { path: '404', component: PageNotFoundComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
