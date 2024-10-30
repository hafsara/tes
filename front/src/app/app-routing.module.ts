import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { CreateFormComponent } from './create-form/create-form.component';

const routes: Routes = [
  { path: '', redirectTo: '/admin-dashboard', pathMatch: 'full' },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'create-form', component: CreateFormComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
