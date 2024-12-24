import { Component, Input, OnInit } from '@angular/core';
import { FormService } from '../../services/form.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-campaign',
  templateUrl: './admin-campaign.component.html',
  styleUrl: './admin-campaign.component.scss'
})
export class AdminCampaignComponent implements OnInit{
  @Input() appOptions: { name: string; token: string }[] = [];
  campaignOptions: { name: string, id: string }[] = [];
  constructor(
    private formService: FormService,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {

  }

  loadCampaign(appId: string): void {
    this.formService.loadCampaignOptions(appId).subscribe(
      (campaigns) => {
        this.campaignOptions = campaigns;
      },
      (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: `Failed to load campaigns: ${error}` });
      }
    );
  }

}
