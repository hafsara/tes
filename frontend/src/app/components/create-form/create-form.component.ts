import { Component } from '@angular/core';
import { FormService } from '../../services/form.service';


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
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent {
  currentStep: number = 0;
  showErrors = false;

  constructor(private formService: FormService) {}

  questionTypes = [
    { label: 'Multiple choices', value: 'multipleChoice' },
    { label: 'Checkboxes', value: 'checkbox' },
    { label: 'Drop-down list', value: 'dropdown' },
    { label: 'Text', value: 'text' }
  ];

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

  validateCurrentStep(): boolean {
    if (this.currentStep === 0) {
      const isEmailValid = this.emailPattern.test(this.form.userEmail || '');
      const isManagerEmailValid = (!this.form.escalate || (this.form.managerEmail ? this.emailPattern.test(this.form.managerEmail) : false))

      const isValid = (
        this.form.title.trim() !== '' &&
        this.form.description.trim() !== '' &&
        isEmailValid &&
        isManagerEmailValid
      );

      console.log('Validation result for step', this.currentStep, ':', isValid);
      return isValid;

    } else if (this.currentStep === 1) {
      return this.form.questions.every(question => {
        const isQuestionTextValid = question.label.trim() !== '';
        const areOptionsValid = question.type === 'text' || (question.options.length > 0 && question.options.every(option => option.trim() !== ''));
        return isQuestionTextValid && areOptionsValid;
      });
    }
    return true;
  }

  previousStep(prevCallback: any) {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showErrors = false;
      prevCallback.emit();
    }
  }

  addQuestion() {
    this.form.questions.push({
      label: '',
      type: 'text',
      options: [],
      isRequired: true
    });
  }

  removeQuestion(index: number) {
    if (this.form.questions.length > 1) {
      this.form.questions.splice(index, 1);
    }
  }

  duplicateQuestion(index: number) {
    const questionToDuplicate = this.form.questions[index];
    this.form.questions.splice(index + 1, 0, {
      label: questionToDuplicate.label,
      type: questionToDuplicate.type,
      options: [...questionToDuplicate.options],
      isRequired: questionToDuplicate.isRequired
    });
  }

  addOption(questionIndex: number) {
    const optionNumber = this.form.questions[questionIndex].options.length + 1;
    this.form.questions[questionIndex].options.push(`Option ${optionNumber}`);
  }

  removeOption(questionIndex: number, optionIndex: number) {
    if (this.form.questions[questionIndex].options.length > 1) {
      this.form.questions[questionIndex].options.splice(optionIndex, 1);
    }
  }
  nextStep(nextCallback: any) {
    if (this.validateCurrentStep()) {
        this.showErrors = false;
        this.currentStep++;
        // Emit the next callback to notify the stepper to advance
        nextCallback.emit();
    } else {
        this.showErrors = true;
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
      form: { questions: this.form.questions }
    };

    this.formService.createFormContainer(payload).subscribe(
      response => {
        console.log('Form created successfully:', response);
      },
      error => {
        console.error('Error creating form:', error);
      }
    );
  }

  onQuestionTypeChange(question: Question) {
    if (question.type === 'text') {
        question.options = [];
    } else if (question.options.length === 0) {
        question.options = ['Option 1'];
    }
  }
trackByIndex(index: number, item: any): number {
    return index;
    }
  }