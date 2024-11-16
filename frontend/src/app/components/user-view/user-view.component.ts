import { Component, Input, OnInit } from '@angular/core';
import { Question, formatQuestions, Form } from '../../utils/question-formatter';
import { FormService } from '../../services/form.service';
import { ActivatedRoute, Router } from '@angular/router';
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
  sidebarVisible = true;
  currentForm: any;
  historyForms: any[] = [];

  constructor(
    private router: Router,
    private formService: FormService,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadForm();
  }
  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  selectForm(form: Form) {
    this.currentForm = form;
  }

loadForm(): void {
  const accessToken = this.route.snapshot.paramMap.get('access_token');
  if (accessToken) {
    this.formService.getFormContainerByAccessToken(accessToken).subscribe(
      (data) => {
        this.formData = data;
        this.formData.access_token = accessToken;

        if (this.formData.forms && this.formData.forms.length > 0) {
          this.formData.forms.forEach((form: Form) => {
            form.questions = formatQuestions(form.questions);
          });
        }
        this.historyForms = this.formData.forms.filter((form: any) => form.status === 'unsubstantial');
        this.currentForm = this.formData.forms.find((form: any) => form.status !== 'unsubstantial');
        const formStatus = this.currentForm?.status;
        if (this.formData.validated || formStatus === 'canceled') {
          this.router.navigate(['/404']);
        } else if (formStatus === 'answered' || formStatus === 'unsubstantial') {
          this.isSubmitted = true;
        } else {
          this.isSubmitted = false;
        }
      },
      (error) => {
        this.router.navigate(['/404']);
      }
    );
  }
}

  validateResponses(): void {
    this.currentForm.questions.forEach((question: any, index: number) => {
      const questionError = `Please respond to question ${index + 1}: ${question.label}`;

      if (question.isRequired) {
        if (question.type === 'text' && (!question.response || question.response.trim() === '')) {
          this.validationErrors.push(questionError);
        } else if (question.type === 'radioButton' && !question.response) {
          this.validationErrors.push(questionError);
        } else if (question.type === 'checkbox' && (!question.response || question.response.length === 0)) {
          this.validationErrors.push(`Please select at least one option for question ${index + 1}: ${question.label}`);
        } else if (question.type === 'dropdown' && !question.response) {
          this.validationErrors.push(questionError);
        }
      }
    });
  }

  toggleOption(question: Question, option: string): void {
    question.response = question.response || [];

    if (Array.isArray(question.response)) {
      const index = question.response.indexOf(option);
      if (index > -1) {
        question.response.splice(index, 1);
      } else {
        question.response.push(option);
      }
    }
  }

  onSubmit(): void {
      this.formService.submitUserForm(this.formData.access_token, this.currentForm).subscribe(
        () => {
          this.isSubmitted = true;
          this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Response saved successfully.' });
        },
        error => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error while submitting form. Try again!' });
        }
      );
    }

  confirm(event: Event) {
    this.validationErrors = [];
    this.validateResponses();
    if (this.validationErrors.length > 0) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Validation failed: ${this.validationErrors}`});
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
          this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Your responses has been submitted' });
          setTimeout(() => this.onSubmit(), 1000);
        }});
    }
 }
 }
