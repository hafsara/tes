import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// PrimeNG Modules
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { StepperModule } from 'primeng/stepper';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { CreateFormComponent } from './components/create-form/create-form.component';
import { UserViewComponent } from './components/user-view/user-view.component';
import { FormPreviewComponent } from './components/form-preview/form-preview.component';
import { CreateFormContainerComponent } from './components/create-form-container/create-form-container.component';

@NgModule({
  declarations: [
    AppComponent,
    CreateFormComponent,
    UserViewComponent,
    FormPreviewComponent,
    CreateFormContainerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    // PrimeNG Modules
    StepsModule,
    ToastModule,
    InputNumberModule,
    ButtonModule,
    InputTextModule,
    RadioButtonModule,
    CheckboxModule,
    FloatLabelModule,
    InputTextareaModule,
    DropdownModule,
    ToggleButtonModule,
    TooltipModule,
    StepperModule,
    IconFieldModule,
    InputIconModule,
    CardModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [MessageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
