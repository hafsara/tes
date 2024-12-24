import { Component, Input, OnInit } from '@angular/core';
import { FormService } from '../../services/form.service';
import { MessageService } from 'primeng/api';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-admin-campaign',
  templateUrl: './admin-campaign.component.html',
  styleUrl: './admin-campaign.component.scss'
})
export class AdminCampaignComponent implements OnInit {
  @Input() appOptions: { name: string; token: string }[] = [];
  campaignOptions: { id: string; name: string; applicationName: string; createdAt: Date; createdBy: string }[] = [];
  constructor(private formService: FormService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadAllCampaigns();
  }

  decodeToken(token: string): any {
    try {
        return jwtDecode(token);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  loadAllCampaigns(): void {
    this.campaignOptions = [];

    this.appOptions.forEach((app) => {
      const decodedToken = this.decodeToken(app.token);
      if (decodedToken && decodedToken.app_id) {
        const appId = decodedToken.app_id;

        this.formService.loadCampaignOptions(appId).subscribe({
          next: (campaigns) => {
            this.campaignOptions.push(
              ...campaigns.map((campaign: any) => ({
                id: campaign.id,
                name: campaign.name,
                applicationName: app.name,
                createdAt: campaign.created_at,
                createdBy: campaign.created_by,
              }))
            );
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `Failed to load campaigns for ${app.name}: ${err}`,
            });
          },
        });
      } else {
        console.error('Invalid token or missing app_id in decoded token:', app.token);
      }
    });
  }

  editCampaign(campaign: any): void {
    // Logic to edit the campaign
    this.messageService.add({ severity: 'info', summary: 'Edit', detail: `Editing campaign ${campaign.name}` });
  }

  deleteCampaign(campaignId: string): void {
    if (confirm('Are you sure you want to delete this campaign?')) {
      // Logic to delete the campaign
      this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `Campaign deleted` });
    }
  }
}
