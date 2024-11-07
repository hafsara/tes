import { Component, OnInit, Input } from '@angular/core';
import { FormService } from '../../services/form.service';

interface EventItem {
    event?: string;
    timestamp?: string;
    details?: string;
}

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss'
})
export class TimelineComponent implements OnInit {
  @Input() formContainerId!: number;
  events: EventItem[] = [];
  constructor(private formService: FormService) {}
  ngOnInit() {
    this.loadTimeline();
  }

  loadTimeline(){
      this.formService.getFormContainerTimeline(this.formContainerId).subscribe(
        (data) => {
          this.events = data;
        },
        (error) => {
          console.error('Erreur lors de la récupération des données', error);
        }
      );
    }

  getIconConfFromEvent(event:string):string{
      if (event == 'container_created') {
         return 'pi pi-star';
      }
      if (event == 'response_submitted'){
         return 'pi pi-verified';
      }
      if (event == 'reminder'){
         return 'pi pi-refresh';
      } if (event == 'escalate'){
         return 'pi p-flag';
      }
    return 'pi pi-star';
  }
}
