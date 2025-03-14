import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MarkdownModule } from 'ngx-markdown';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { RouterModule } from '@angular/router';

// PrimeNG Modules
import { InputSwitchModule } from 'primeng/inputswitch';
import { PanelModule } from 'primeng/panel';
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
import { FieldsetModule } from 'primeng/fieldset';
import { AvatarModule } from 'primeng/avatar';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SplitButtonModule } from 'primeng/splitbutton';
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
import { RefreshToastComponent } from './components/refresh-toast/refresh-toast.component';
import { DefaultNavbarComponent } from './components/default-navbar/default-navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AuthComponent } from './components/auth/auth.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { AdminTokensComponent } from './components/admin-tokens/admin-tokens.component';
import { AdminCampaignComponent } from './components/admin-campaign/admin-campaign.component';
import { AdminApplicationsComponent } from './components/admin-applications/admin-applications.component';
import { SafeUrlPipe } from './pipes/safe-url.pipe';
import { AdminWorkflowComponent } from './components/admin-workflow/admin-workflow.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FilterComponent } from './components/filter/filter.component';
import { DashboardTableComponent } from './components/dashboard/dashboard-table/dashboard-table.component';


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
    FormTableComponent,
    RefreshToastComponent,
    DefaultNavbarComponent,
    SidebarComponent,
    AuthComponent,
    AdminPanelComponent,
    AdminTokensComponent,
    AdminCampaignComponent,
    AdminApplicationsComponent,
    SafeUrlPipe,
    AdminWorkflowComponent,
    FilterComponent,
    DashboardTableComponent
  ],
  imports: [
    DragDropModule,
    InputSwitchModule,
    BrowserModule,
    BrowserModule.withServerTransition({ appId: 'serverApp' }),
    RouterModule.forRoot([]),
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
    AvatarModule,
    AutoCompleteModule,
    FieldsetModule,
    ChipsModule,
    ToastModule,
    MenubarModule,
    DialogModule,
    InputNumberModule,
    CalendarModule,
    ButtonModule,
    PanelModule,
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
    TimelineModule,
    SplitButtonModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [MessageService, ConfirmationService, provideHttpClient(withFetch())],
  bootstrap: [AppComponent]
})
export class AppModule { }
