import { Component, Input, OnInit } from '@angular/core';
import { Question, formatQuestions } from '../../utils/question-formatter';
import { FormService } from '../../services/form.service';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss']
})
export class UserViewComponent implements OnInit {
  @Input() formData: any = { forms: [] };
  validationErrors: string[] = [];
  isSubmitted: boolean = false;

  constructor(
    private formService: FormService,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    const accessToken = this.route.snapshot.paramMap.get('access_token');
    if (accessToken) {
      this.formService.getFormContainerByAccessToken(accessToken).subscribe(data => {
        this.formData = data;
        this.formData.access_token = accessToken;
        // Apply formatting to the questions after fetching
        if (this.formData.forms && this.formData.forms.length > 0) {
          this.formData.forms[0].questions = formatQuestions(this.formData.forms[0].questions);
        }
      });
    }
  }

  validateResponses(): void {
    this.formData.forms[0].questions.forEach((question: any, index: number) => {
      const questionError = `Please respond to question ${index + 1}: ${question.label}`;

      if (question.isRequired) {
        if (question.type === 'text' && (!question.response || question.response.trim() === '')) {
          this.validationErrors.push(questionError);
        } else if (question.type === 'multipleChoice' && !question.response) {
          this.validationErrors.push(questionError);
        } else if (question.type === 'checkbox' && (!question.selectedOptions || question.selectedOptions.length === 0)) {
          this.validationErrors.push(`Please select at least one option for question ${index + 1}: ${question.label}`);
        } else if (question.type === 'dropdown' && !question.response) {
          this.validationErrors.push(questionError);
        }
      }
    });
  }

  isChecked(selectedOptions: string[], option: string): boolean {
    return selectedOptions.includes(option);
  }

  toggleOption(question: Question, option: string): void {
    question.selectedOptions = question.selectedOptions || [];
    const index = question.selectedOptions.indexOf(option);
    if (index > -1) {
      question.selectedOptions.splice(index, 1);
    } else {
      question.selectedOptions.push(option);
    }
  }

  onSubmit(): void {
      this.formService.submitUserForm(this.formData).subscribe(
        () => {
          this.isSubmitted = true;  // Mark form as submitted
          console.log("Response saved successfully.");
        },
        error => {
          console.error("Error submitting form:", error);
        }
      );
    }

  getDisplayResponse(question: Question): string {
    if (question.type === 'checkbox') {
      return (question.selectedOptions || []).join(', ');
    } else {
      return question.response || 'No response';
    }
  }

  confirm(event: Event) {
    this.validationErrors = [];
    this.validateResponses();
    if (this.validationErrors.length > 0) {
        console.log("Validation failed:", this.validationErrors);
    } else {
        this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: 'Are you sure that you want to proceed?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptIcon:"none",
        rejectIcon:"none",
        rejectButtonStyleClass:"p-button-text",
        accept: () => {
          this.messageService.add({ severity: 'info', summary: 'Confirmed', detail: 'Your responses has been submitted' });
          setTimeout(() => this.onSubmit();, 1000);
        }});
    }
 }
 }
