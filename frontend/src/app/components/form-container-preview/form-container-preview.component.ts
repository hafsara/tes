import { Component, Input, OnInit} from '@angular/core';
import { Question, Form, formatQuestions, createForm } from '../../utils/question-formatter';
import { FormService } from '../../services/form.service';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';


@Component({
  selector: 'app-form-container-preview',
  templateUrl: './form-container-preview.component.html',
  styleUrl: './form-container-preview.component.scss'
})
export class FormContainerPreviewComponent implements OnInit {
  @Input() formContainer!: any;
  visible: boolean = false;
  showErrors = false;
  newForm: Form = createForm();
  currentForm: any;
  historyForms: any[] = [];
  sidebarVisible: boolean = true;

  constructor(
    private formService: FormService,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadForms();
  }

  loadForms() {
    this.historyForms = this.formContainer.forms.filter((form: any) => form.status === 'unsubstantial');
    this.currentForm = this.formContainer.forms.find((form: any) => form.status !== 'unsubstantial');
  }

  selectForm(form: any) {
    this.currentForm = form;
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  showDialog() {
    this.visible = true;
  }

  validateFormContainer(event: Event): void{
        this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: 'Are you sure that you want to validate?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptIcon:"none",
        rejectIcon:"none",
        rejectButtonStyleClass:"p-button-text",
        accept: () => {
          this.confirmValidate();
          setTimeout(() => window.location.reload(), 1000);
        }});
  }

  confirmValidate(): void {
    this.formService.validateFormContainer(this.formContainer.id, this.formContainer.forms[0].form_id).subscribe(
      (response) => {
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'FormContainer validated' });
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error validating form' });
      }
    );}

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

  resetForm(){
    this.newForm = createForm()
    this.visible = false
  }

  addForm(event: Event): void{
    if (this.validateNewForm()){
        this.confirmationService.confirm({
        target: event.target as EventTarget,
        message: 'Are you sure that you want to create new form?',
        header: 'Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptIcon:"none",
        rejectIcon:"none",
        rejectButtonStyleClass:"p-button-text",
        accept: () => {
          this.confirmAddForm()
          this.visible = false;
          setTimeout(() => window.location.reload(), 1000);
        }});
      } else{
          this.showErrors = true;
     }
  }

  confirmAddForm(): void {
    this.formService.addFormToContainer(this.formContainer.id, this.newForm).subscribe(
      (response) => {
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Form added with success, ID: ' + response.form_id });
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error while adding form: ' + error });
      }
    );
  }

  verifAddNewForm() {
    if (this.formContainer.forms.length >= 5) {
      this.messageService.add({ severity: 'warn', summary: 'Limit reached', detail: 'You cannot add more than 5 forms to this container.' });
      return;
    }else{
      this.showDialog();
    }
  }

  validateNewForm(): boolean {
      return this.newForm.questions.every(question => {
        const isQuestionTextValid = question.label.trim() !== '';
        const areOptionsValid = question.type === 'text' || (question.options.length > 0 && question.options.every(option => option.trim() !== ''));
        return isQuestionTextValid && areOptionsValid;
      });
  }
}
