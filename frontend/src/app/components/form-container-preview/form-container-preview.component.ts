import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormService } from '../../services/form.service';
import { PollingService } from '../../services/polling.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Question, Form, formatQuestions, createForm } from '../../utils/question-formatter';

@Component({
  selector: 'app-form-container-preview',
  templateUrl: './form-container-preview.component.html',
  styleUrls: ['./form-container-preview.component.scss'],
})
export class FormContainerPreviewComponent implements OnInit, OnDestroy {
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
  newFormContainer!: any;
  pollingKey: string = 'formContainerPolling';

  constructor(
    private formService: FormService,
    private pollingService: PollingService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadFormContainer();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.pollingService.stopPolling(this.pollingKey);
  }

  private loadFormContainer(): void {
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
      this.pollingKey,
      15000,
      () => this.fetchFormContainer(),
      (data) => this.updateFormContainer(data),
      (newData) => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Form Updated',
          detail: 'The form has been updated. Click here to refresh.',
          sticky: true,
          key: 'refresh-toast',
        });
        this.pollingService.stopPolling(this.pollingKey);
      },
      (newData, previousData) => this.hasFormContainerChanged(newData, previousData)
    );
  }

  private fetchFormContainer(): Promise<any> {
    return this.formService.getFormContainerByAccessToken(this.accessToken).toPromise();
  }

  private updateFormContainer(data: any): void {
    this.newFormContainer = data;
  }

  private updateFormContainerDetails(): void {
    if (this.formContainer) {
      this.markdownDescription = this.formContainer.description.replace(/\\n/g, '\n');
      this.loadForms();
    }
  }

  private loadForms(): void {
    this.historyForms = this.formContainer.forms.filter((form: any) => form.status === 'unsubstantial');
    this.currentForm = this.formContainer.forms.find((form: any) => form.status !== 'unsubstantial');
  }

  private hasFormContainerChanged(newData: any, previousData: any): boolean {
    if (!previousData) {
      return false;
    }

    return (
      newData.validated !== previousData.validated ||
      newData.forms.length !== previousData.forms.length ||
      newData.forms.some((newForm: any) => {
        const existingForm = previousData.forms.find((form: any) => form.form_id === newForm.form_id);
        return existingForm && newForm.status !== existingForm.status;
      })
    );
  }

  handleRefresh(): void {
    if (this.newFormContainer) {
      this.formContainer = this.newFormContainer;
      this.newFormContainer = null;
      this.messageService.clear('refresh-toast');
      this.updateFormContainerDetails();
      this.startPolling();
    }
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
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'FormContainer validated', key: 'global-toast'});
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error validating form', key: 'global-toast'});
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
          key: 'global-toast'
        });
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Error while adding form: ${error}`, key: 'global-toast'});
      }
    );
  }

  verifAddNewForm(): void {
    if (this.formContainer.forms.length >= 5) {
      this.messageService.add({
        severity: 'warn',
        key: 'global-toast',
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
          key: 'global-toast',
          detail: `Form cancelled with success`,
        });
        this.cancelVisible = false;
        setTimeout(() => window.location.reload(), 1000);
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          key: 'global-toast',
          detail: `Error while canceling form: ${error}`,
        });
      }
    );
  }
}
