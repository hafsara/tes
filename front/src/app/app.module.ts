import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Angular Material Modules
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';

// App Components and Services
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CreateFormComponent } from './create-form/create-form.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { FormHistoryComponent } from './form-history/form-history.component';
import { FormListComponent } from './form-list/form-list.component';
import { FormDetailsComponent } from './form-details/form-details.component';
import { FormContainerService } from './services/form-container.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';

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
    MatFormFieldModule,
    MatSlideToggleModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatCardModule
  ],
  providers: [FormContainerService, provideAnimationsAsync()],
  bootstrap: [AppComponent]
})
export class AppModule { }
