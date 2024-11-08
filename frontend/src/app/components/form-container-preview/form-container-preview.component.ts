import { Component, Input, OnInit} from '@angular/core';
import { Question, formatQuestions } from '../../utils/question-formatter';
import { FormService } from '../../services/form.service';
import { ActivatedRoute } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';


@Component({
  selector: 'app-form-container-preview',
  templateUrl: './form-container-preview.component.html',
  styleUrl: './form-container-preview.component.scss'
})
export class FormContainerPreviewComponent {
  @Input() formContainer!: any;
  visible: boolean = false;
  showErrors = false;

  constructor(
    private formService: FormService,
    private route: ActivatedRoute,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

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

  getDisplayResponse(question: Question): string {
    if (question.type === 'checkbox') {
      return (question.selectedOptions || []).join(', ');
    } else {
      return question.response || 'No response';
    }
  }
}
