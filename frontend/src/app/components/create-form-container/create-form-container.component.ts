import { Component } from '@angular/core';
import { FormService } from '../../services/form.service';
import { MessageService } from 'primeng/api';
import { FormContainer, Form, Question } from '../../utils/question-formatter';


@Component({
  selector: 'app-create-form-container',
  templateUrl: './create-form-container.component.html',
  styleUrls: ['./create-form-container.component.scss']
})
export class CreateFormContainerComponent {
  currentStep: number = 0;
  showErrors = false;
  formContainer: FormContainer = {
    title: '',
    description: '',
    userEmail: '',
    reference: '',
    managerEmail: '',
    escalate: true,
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

  constructor(
    private formService: FormService,
    private messageService: MessageService
  ) {}

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

  submitForm() {
    const payload = {
      title: this.formContainer.title,
      description: this.formContainer.description,
      user_email: this.formContainer.userEmail,
      manager_email: this.formContainer.managerEmail,
      reference: this.formContainer.reference,
      escalate: this.formContainer.escalate,
      reminder_delay_day: this.formContainer.reminderDelayDay,
      form: { questions: this.formContainer.forms }
    };

    this.formService.createFormContainer(payload).subscribe(
      response => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Form created successfully' });
        setTimeout(() => window.location.reload(), 2000);
      },
      error => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error creating form' });
      }
    );
  }
}
