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
  { path: '**', redirectTo: 'access-control' },
  { path: '404', component: PageNotFoundComponent },
  { path: 'user-view/:access_token', component: UserViewComponent },
  { path: 'dashboard/load-form/:access_token', component: DashboardComponent },

];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
