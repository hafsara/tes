import { Component, OnInit } from '@angular/core';
import { FormService } from '../../services/form.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormContainer, Form, Question } from '../../utils/question-formatter';

@Component({
  selector: 'app-create-form-container',
  templateUrl: './create-form-container.component.html',
  styleUrls: ['./create-form-container.component.scss']
})
export class CreateFormContainerComponent implements OnInit{
  currentStep: number = 0;
  showErrors = false;
  formContainer: FormContainer = {
    app_id: '',
    campaign_id: '',
    title: '',
    description: '',
    userEmail: '',
    reference: '',
    managerEmail: '',
    escalate: true,
    ccEmail: [],
    reminderDelayDay: 1,
    forms: [{
      questions: [{
        label: '',
        type: 'text',
        options: [],
        isRequired: true}]
      }]
  };

  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  appOptions: { label: string; value: string }[] = [];
  companyOptions: { name: string }[] = [];
  selectedApp: string | null = null;
  selectedCompany: string | null = null;

  constructor(
    private formService: FormService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
  ) {}
  ngOnInit(): void {
    this.loadAppOptions();
  }

  loadAppOptions() {
    this.appOptions = [
      { label: 'App 1', value: 'app1' },
      { label: 'App 2', value: 'app2' }
    ];
  }

  onAppChange(event: any) {
    this.loadCompanyOptions(event.value);
  }

  loadCompanyOptions(appId: string) {
      this.companyOptions = [{name: "com1"}, {name: "com2"}];
      this.selectedCompany = this.companyOptions.length > 0 ? this.companyOptions[0].name : null;

  }
  validateCurrentStep(): boolean {
    if (this.currentStep === 0) {
      const isEmailValid = this.emailPattern.test(this.formContainer.userEmail || '');
      const isManagerEmailValid = !this.formContainer.escalate || (this.formContainer.managerEmail ? this.emailPattern.test(this.formContainer.managerEmail) : false)

      return (
        this.formContainer.title.trim() !== '' &&
        this.formContainer.description.trim() !== '' &&
        isEmailValid &&
        isManagerEmailValid
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

  confirmSubmit(event: Event): void{
        this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: 'Are you sure that you want to submit?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptIcon:"none",
        rejectIcon:"none",
        rejectButtonStyleClass:"p-button-text",
        accept: () => {
          this.submitForm();
          setTimeout(() => window.location.reload(), 1000);
        }});
  }

  submitForm() {
    const payload = {
      title: this.formContainer.title,
      description: this.formContainer.description,
      user_email: this.formContainer.userEmail,
      escalade_email: this.formContainer.managerEmail,
      reference: this.formContainer.reference,
      escalate: this.formContainer.escalate,
      reminder_delay_day: this.formContainer.reminderDelayDay,
      forms: { questions: this.formContainer.forms[0].questions }
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
}
