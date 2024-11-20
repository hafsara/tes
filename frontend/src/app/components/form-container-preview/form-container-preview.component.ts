import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Question, Form, formatQuestions, createForm } from '../../utils/question-formatter';
import { FormService } from '../../services/form.service';
import { PollingService } from '../../services/polling.service';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-form-container-preview',
  templateUrl: './form-container-preview.component.html',
  styleUrls: ['./form-container-preview.component.scss'],
})
export class FormContainerPreviewComponent implements OnInit, OnChanges {
  @Input() accessToken!: string;
  visible: boolean = false;
  showErrors = false;
  newForm: Form = createForm();
  currentForm: any;
  historyForms: any[] = [];
  sidebarVisible: boolean = false;
  cancelVisible: boolean = false;
  cancelComment: string = '';
  showCommentError: boolean = false;
  markdownDescription: string = '';
  activeTabIndex: number = 0;
  formContainer!: any;

  constructor(
    private formService: FormService,
    private pollingService: PollingService,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    if (this.accessToken) {
      this.loadFormContainer();
      this.startPolling();
    }
  }

  ngOnDestroy(): void {
    this.pollingService.stopPolling(this.accessToken);
  }

  loadFormContainer(): void {
    this.formService.getFormContainerByAccessToken(this.accessToken).subscribe(
      (data) => {
        this.formContainer = data;
        this.updateFormContainerDetails();
      },
      (error) => {
        console.error('Error loading form container:', error);
      }
    );
  }

  private startPolling(): void {
    this.pollingService.startPolling(
      this.accessToken,
      15000,
      () => this.fetchFormContainer(),
      (data) => this.updateFormContainer(data),
      (newData) => {
        this.messageService.add({
           severity: 'warn',
           summary: 'Form Updated',
           detail: 'The form has been updated. Click here to refresh.',
           sticky: true,
           key: 'br',
        });
        this.pollingService.stopPolling(this.accessToken);
      },
      (newData, previousData) => {
          if (!previousData) {
            return false;
          }

          const hasFormContainerChanged =
            newData.validated !== previousData.validated ||
            newData.forms.length !== previousData.forms.length ||
            newData.forms.some((newForm: any) => {
              const existingForm = previousData.forms.find((form: any) => form.form_id === newForm.form_id);
              return existingForm && newForm.status !== existingForm.status;
            });

          return hasFormContainerChanged;
    }
    );
  }

  private fetchFormContainer(): Promise<any> {
    return this.formService.getFormContainerByAccessToken(this.accessToken).toPromise();
  }

  private updateFormContainer(data: any): void {
    this.formContainer = data;
  }
  handleRefresh(): void {
    this.messageService.clear();
    this.refreshFormContainer();
  }

  refreshFormContainer(): void {
    this.formService.getFormContainerByAccessToken(this.accessToken).subscribe(
      (data) => {
        this.formContainer = data;
        console.log('Form container refreshed:', data);
      },
      (error) => {
        console.error('Error refreshing form container:', error);
      }
    );
    this.startFormPolling();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['formContainer'] && changes['formContainer'].currentValue) {
      this.updateFormContainerDetails();
    }
  }

  updateFormContainerDetails(): void {
    if (this.formContainer) {
      this.markdownDescription = this.formContainer.description.replace(/\\n/g, '\n');
      this.loadForms();
    }
  }

  loadForms(): void {
    this.historyForms = this.formContainer.forms.filter((form: any) => form.status === 'unsubstantial');
    this.currentForm = this.formContainer.forms.find((form: any) => form.status !== 'unsubstantial');
  }

  selectForm(form: Form): void {
    this.currentForm = form;
  }

  selectPreviousForm(form: any): void {
    this.selectForm(form);
    this.activeTabIndex = 0;
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  showDialog(): void {
    this.visible = true;
  }

  validateFormContainer(event: Event): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure that you want to validate?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: 'none',
      rejectIcon: 'none',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.confirmValidate();
        setTimeout(() => window.location.reload(), 1000);
      },
    });
  }

  confirmValidate(): void {
    this.formService.validateFormContainer(this.formContainer.id, this.currentForm.form_id).subscribe(
      (response) => {
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'FormContainer validated' });
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error validating form' });
      }
    );
  }

  resetForm(): void {
    this.newForm = createForm();
    this.visible = false;
  }

  addForm(event: Event): void {
    if (this.validateNewForm()) {
      this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: 'Are you sure that you want to create new form?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptIcon: 'none',
        rejectIcon: 'none',
        rejectButtonStyleClass: 'p-button-text',
        accept: () => {
          this.confirmAddForm();
          this.visible = false;
          setTimeout(() => window.location.reload(), 1000);
        },
      });
    } else {
      this.showErrors = true;
    }
  }

  confirmAddForm(): void {
    this.formService.addFormToContainer(this.formContainer.id, this.newForm).subscribe(
      (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Confirmed',
          detail: `Form added with success, ID: ${response.form_id}`,
        });
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error while adding form: ${error}` });
      }
    );
  }

  verifAddNewForm(): void {
    if (this.formContainer.forms.length >= 5) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Limit reached',
        detail: 'You cannot add more than 5 forms to this container.',
      });
      return;
    } else {
      this.showDialog();
    }
  }

  validateNewForm(): boolean {
    return this.newForm.questions.every((question) => {
      const isQuestionTextValid = question.label.trim() !== '';
      const areOptionsValid =
        question.type === 'text' ||
        (question.options.length > 0 && question.options.every((option) => option.trim() !== ''));
      return isQuestionTextValid && areOptionsValid;
    });
  }

  showCancelComment(): void {
    this.cancelComment = '';
    this.cancelVisible = true;
    this.showCommentError = false;
  }

  cancelForm(): void {
    if (this.cancelComment.trim().length < 4) {
      this.showCommentError = true;
      return;
    }
    this.showCommentError = false;

    this.formService.cancelForm(this.formContainer.id, this.currentForm.form_id, this.cancelComment).subscribe(
      (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Confirmed',
          detail: `Form cancelled with success`,
        });
        this.cancelVisible = false;
        setTimeout(() => window.location.reload(), 1000);
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Error while canceling form: ${error}`,
        });
      }
    );
  }
}
