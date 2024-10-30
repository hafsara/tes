import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // <-- Ajoutez ceci

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CreateFormComponent } from './create-form/create-form.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { FormHistoryComponent } from './form-history/form-history.component';
import { FormListComponent } from './form-list/form-list.component';
import { FormDetailsComponent } from './form-details/form-details.component';
import { HttpClientModule } from '@angular/common/http';
import { FormContainerService } from './services/form-container.service'; // Assurez-vous du bon chemin d'import

@NgModule({
  declarations: [
    AppComponent,
    CreateFormComponent,
    AdminDashboardComponent,
    FormHistoryComponent,
    FormListComponent,
    FormDetailsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule // <-- Et ajoutez-le ici aussi
  ],
  providers: [FormContainerService],
  bootstrap: [AppComponent],
})
export class AppModule { }
