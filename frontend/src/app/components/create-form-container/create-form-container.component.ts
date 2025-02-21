import { Component, Input } from '@angular/core';
import { FormService } from '../../services/form.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormContainer, Form, Question } from '../../utils/question-formatter';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-create-form-container',
  templateUrl: './create-form-container.component.html',
  styleUrls: ['./create-form-container.component.scss']
})
export class CreateFormContainerComponent {
  @Input() appOptions: { name: string; token: string }[] = [];
  currentStep: number = 0;
  showErrors = false;
  visible: boolean = false;
  appSelected: boolean = false;
  campaignName: string = '';
  selectedAppName: string = '';
  selectedCampaignName: string = '';

  formContainer: FormContainer = {
    appId: '',
    campaignId: '',
    title: '',
    description: '',
    userEmail: '',
    reference: '',
    escaladeEmail: '',
    escalate: true,
    ccEmails: [],
    reminderDelayDay: 1,
    forms: [{
      questions: [{
        label: '',
        type: 'text',
        options: [],
        isRequired: true
      }]
    }]
  };

  selectedCampaign: string | undefined;
  selectedApp: string | undefined;
  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  emailKeywords = environment.emailKeywords;
  campaignOptions: { name: string, id: string }[] = [];

  constructor(
    private formService: FormService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {}

  onAppChange(event: any) {
    this.appSelected = true;
    const selectedApp = event.value;
    const decoded: { app_id: string } = jwtDecode(selectedApp.token);
    this.formContainer.appId = decoded.app_id;
    this.loadCampaignOptions(this.formContainer.appId);
    this.selectedAppName = selectedApp.name;
  }

  onCampaignChange(event: any) {
    this.formContainer.campaignId = event.value;
    const campaign = this.campaignOptions.find(c => c.id === event.value);
    this.selectedCampaignName = campaign ? campaign.name : '';

  }

  loadCampaignOptions(appId: string): void {
    this.formService.loadCampaignOptions(appId).subscribe(
      (campaigns) => {
        this.campaignOptions = campaigns;
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Failed to load campaigns: ${error}` });
      }
    );
  }

  isManagerEmailValid(): boolean {
    const email = this.formContainer.escaladeEmail || '';
    return this.emailPattern.test(email) || this.emailKeywords.includes(email.toUpperCase());
  }

  validateCcEmails(): boolean {
    return (this.formContainer.ccEmails || []).every(email =>
      this.emailPattern.test(email) || this.emailKeywords.includes(email.toUpperCase())
    );
  }

  onCcEmailAdd(event: any): void {
    const newEmail = event.value || '';
    if (
      !this.emailPattern.test(newEmail) &&
      !this.emailKeywords.includes(newEmail.toUpperCase())
    ) {
      this.showErrors = true;
    } else {
      this.showErrors = false;
    }
  }

  onCcEmailRemove(event: any): void {
    this.showErrors = false;
  }


  validateCurrentStep(): boolean {
    if (this.currentStep === 0) {
      const isEmailValid = this.emailPattern.test(this.formContainer.userEmail || '');

      return (
        this.formContainer.appId !== '' &&
        this.formContainer.campaignId !== '' &&
        this.formContainer.title.trim() !== '' &&
        this.formContainer.description.trim() !== '' &&
        isEmailValid &&
        this.isManagerEmailValid() &&
        this.validateCcEmails()
      );
    } else if (this.currentStep === 1) {
      return this.formContainer.forms[0].questions.every(question => {
        const isQuestionTextValid = question.label.trim() !== '';
        const areOptionsValid = question.type === 'text' || (question.options.length > 0 && question.options.every(option => option.trim() !== ''));
        return isQuestionTextValid && areOptionsValid;
      });
    }
    return true;
  }

  nextStep(nextCallback: any) {
    if (this.validateCurrentStep()) {
      this.showErrors = false;
      this.currentStep++;
      nextCallback.emit();
    } else {
      this.showErrors = true;
    }
  }

  previousStep(prevCallback: any) {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showErrors = false;
      prevCallback.emit();
    }
  }

  confirmSubmit(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure that you want to submit?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: "none",
      rejectIcon: "none",
      rejectButtonStyleClass: "p-button-text",
      accept: () => {
        this.submitForm();
        //setTimeout(() => window.location.reload(), 1000);
      }
    });
  }

  submitForm() {
    const payload = {
      title: this.formContainer.title,
      app_id: this.formContainer.appId,
      campaign_id: this.formContainer.campaignId,
      description: this.formContainer.description,
      user_email: this.formContainer.userEmail,
      escalade_email: this.formContainer.escaladeEmail,
      reference: this.formContainer.reference,
      escalate: this.formContainer.escalate,
      reminder_delay: this.formContainer.reminderDelayDay,
      cc_emails: this.formContainer.ccEmails,
      forms: this.formContainer.forms
    };

    this.formService.createFormContainer(payload).subscribe(
      response => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Form created successfully' });
      },
      error => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error creating form' });
      }
    );
  }

  onAddCampaign() {
    this.visible = !this.visible;
  }

  createCampaign() {
    if (!this.campaignName.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Campaign name cannot be empty' });
      return;
    }

    const newCampaign = {
      name: this.campaignName,
      app_id: this.formContainer.appId
    };

    this.formService.createCampaign(newCampaign).subscribe(
      (response) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Campaign created successfully' });
        this.visible = false;
        this.campaignName = '';
        this.loadCampaignOptions(this.formContainer.appId);
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Failed to create campaign ${error}` });
      }
    );
  }
}
