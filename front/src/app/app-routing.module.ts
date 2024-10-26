import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateFormComponent } from './create-form/create-form.component';

const routes: Routes = [
  { path: '', redirectTo: '/create-form', pathMatch: 'full' },
  { path: 'create-form', component: CreateFormComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
