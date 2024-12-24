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
  campaignOptions: { id: number; name: string; applicationName: string; createdAt: Date; createdBy: string }[] = [];
  loading: boolean = true;
  selectedCampaign: { id: number; name: string } = { id: 0, name: '' };
  editDialogVisible = false;

  constructor(private formService: FormService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadAllCampaigns();
    this.loading = false;
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

  openEditDialog(campaign: any) {
    this.selectedCampaign = { id: campaign.id, name: campaign.name };
    this.editDialogVisible = true;
  }

  updateCampaign() {
    if (this.selectedCampaign) {
      this.formService.updateCampaign(this.selectedCampaign.id, { name: this.selectedCampaign.name }).subscribe({
        next: () => {
          const index = this.campaignOptions.findIndex((c) => c.id === this.selectedCampaign.id);
          if (index > -1) {
            this.campaignOptions[index].name = this.selectedCampaign.name;
          }
          this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Campaign updated successfully' });
          this.editDialogVisible = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update campaign' });
        },
      });
    }
  }
}
