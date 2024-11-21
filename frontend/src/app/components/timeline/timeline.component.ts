import { Component, OnInit, Input } from '@angular/core';
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
export class TimelineComponent implements OnInit {
  @Input() formContainerId!: number;
  events: EventItem[] = [];
  formDialogVisible = false;
  selectedForm: any = null;

  constructor(private formService: FormService, private messageService: MessageService) {}
  ngOnInit() {
    this.loadTimeline();
  }

  loadTimeline(){
      this.formService.getFormContainerTimeline(this.formContainerId).subscribe(
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
