import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';

// PrimeNG Modules
import { DialogModule } from 'primeng/dialog';
import { StepsModule } from 'primeng/steps';
import { CalendarModule } from 'primeng/calendar';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { TabViewModule } from 'primeng/tabview';
import { TimelineModule } from 'primeng/timeline';
import { Table } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MultiSelectModule } from 'primeng/multiselect';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MenubarModule } from 'primeng/menubar';
import { ChipsModule } from 'primeng/chips';

import { UserViewComponent } from './components/user-view/user-view.component';
import { FormPreviewComponent } from './components/form-preview/form-preview.component';
import { CreateFormContainerComponent } from './components/create-form-container/create-form-container.component';
import { FormBuilderComponent } from './components/form-builder/form-builder.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FormContainerPreviewComponent } from './components/form-container-preview/form-container-preview.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { PreviewFormResponseComponent } from './components/form-response-preview/form-response-preview.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AccessControlComponent } from './components/access-control/access-control.component';
import { FormTableComponent } from './components/form-table/form-table.component';

@NgModule({
  declarations: [
    AppComponent,
    UserViewComponent,
    FormPreviewComponent,
    CreateFormContainerComponent,
    FormBuilderComponent,
    DashboardComponent,
    FormContainerPreviewComponent,
    TimelineComponent,
    PageNotFoundComponent,
    PreviewFormResponseComponent,
    NavbarComponent,
    AccessControlComponent,
    FormTableComponent
  ],
  imports: [
    BrowserModule,
    TableModule,
    TagModule,
    MultiSelectModule,
    CommonModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmDialogModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MarkdownModule.forRoot(),
    // PrimeNG Modules
    StepsModule,
    ChipsModule,
    ToastModule,
    MenubarModule,
    DialogModule,
    InputNumberModule,
    CalendarModule,
    ButtonModule,
    InputTextModule,
    RadioButtonModule,
    ProgressSpinnerModule,
    CheckboxModule,
    FloatLabelModule,
    InputTextareaModule,
    DropdownModule,
    ToggleButtonModule,
    TooltipModule,
    StepperModule,
    IconFieldModule,
    InputIconModule,
    CardModule,
    MenuModule,
    TabViewModule,
    TimelineModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [MessageService, ConfirmationService],
  bootstrap: [AppComponent]
})
export class AppModule { }
