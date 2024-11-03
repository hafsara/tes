import { Component } from '@angular/core';
import { FormService } from '../../services/form.service';
import { MessageService } from 'primeng/api';

interface Question {
  label: string;
  type: string;
  options: string[];
  isRequired: boolean;
}

interface FormContainer {
  title: string;
  description: string;
  userEmail: string;
  reference: string;
  managerEmail?: string;
  escalate: boolean;
  reminderDelayDay: number;
  questions: Question[];
}

@Component({
  selector: 'app-create-form-container',
  templateUrl: './create-form-container.component.html',
  styleUrls: ['./create-form-container.component.scss']
})
export class CreateFormContainerComponent {
  currentStep: number = 0;
  showErrors = false;

  form: FormContainer = {
    title: '',
    description: '',
    userEmail: '',
    reference: '',
    managerEmail: '',
    escalate: true,
    reminderDelayDay: 1,
    questions: [
      {
        label: '',
        type: 'text',
        options: [],
        isRequired: true
      }
    ]
  };

  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  constructor(
    private formService: FormService,
    private messageService: MessageService
  ) {}

  validateCurrentStep(): boolean {
    if (this.currentStep === 0) {
      const isEmailValid = this.emailPattern.test(this.form.userEmail || '');
      const isManagerEmailValid = !this.form.escalate || (this.form.managerEmail ? this.emailPattern.test(this.form.managerEmail) : false)

      return (
        this.form.title.trim() !== '' &&
        this.form.description.trim() !== '' &&
        isEmailValid &&
        isManagerEmailValid
      );
    } else if (this.currentStep === 1) {
      return this.form.questions.every(question => {
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
      title: this.form.title,
      description: this.form.description,
      user_email: this.form.userEmail,
      manager_email: this.form.managerEmail,
      reference: this.form.reference,
      escalate: this.form.escalate,
      reminder_delay_day: this.form.reminderDelayDay,
      form: { questions: this.form.questions }
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
