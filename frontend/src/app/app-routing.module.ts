import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateFormComponent } from './create-form/create-form.component';
import { UserViewComponent } from './user-view/user-view.component';

const routes: Routes = [
  { path: 'create-form', component: CreateFormComponent },
  { path: 'user-view', component: UserViewComponent },
  { path: '', redirectTo: '/create-form', pathMatch: 'full' }, // Default route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
