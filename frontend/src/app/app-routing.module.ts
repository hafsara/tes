import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateFormContainerComponent } from './components/create-form-container/create-form-container.component';
import { UserViewComponent } from './components/user-view/user-view.component';

const routes: Routes = [
  { path: 'create-form', component: CreateFormContainerComponent },
  { path: 'user-view', component: UserViewComponent },
  { path: '', redirectTo: '/create-form', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
