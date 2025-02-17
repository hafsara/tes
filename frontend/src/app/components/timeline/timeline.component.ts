import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormService } from '../../services/form.service';
import { MessageService } from 'primeng/api';

interface EventItem {
  event?: string;
  timestamp?: string;
  details?: string;
  formId?: number;
}

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit, OnChanges  {
  @Input() formContainer!: any;
  events: EventItem[] = [];
  formDialogVisible = false;
  selectedForm: any = null;

  constructor(private formService: FormService, private messageService: MessageService) {}

  ngOnInit(): void {
      this.loadTimeline();
  }
  ngOnChanges(changes: SimpleChanges): void {
      if (changes['formContainer'] && !changes['formContainer'].firstChange) {
        this.loadTimeline();
      }
  }

  loadTimeline(){
      this.formService.getFormContainerTimeline(this.formContainer.id).subscribe(
        (data) => {
          this.events = data;
        },
        (error) => {
          this.messageService.add({ severity: 'warn', summary: 'Duplicate', detail: `Error while loading data: ${error}` });
        }
      );
    }

  showFormPreview(formId: number): void {
    this.formService.getFormById(formId).subscribe(
      (form) => {
        this.selectedForm = form;
        this.formDialogVisible = true;
      },
      (error) => {
        this.messageService.add({ severity: 'warn', summary: 'Duplicate', detail: `Error while retrieving form: ${error}` });
      }
    );
  }

  closeFormDialog(): void {
    this.formDialogVisible = false;
    this.selectedForm = null;
  }
}
