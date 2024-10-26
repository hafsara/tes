import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';

const routes: Routes = [
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: '', redirectTo: '/admin-dashboard', pathMatch: 'full' },  // Redirection par défaut, optionnelle
  // Vous pouvez ajouter d'autres routes ici
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
