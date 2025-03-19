import { Component, Output, EventEmitter, Input, OnInit } from '@angular/core';
import { FormService } from '../../services/form.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit {
  @Output() filterChange = new EventEmitter<any>();
  @Input() selectedAppIds: string[] = [];

  filters = {
    title: '',
    user_email: '',
    campaign_ids: [],
    dateRange: null
  };

  minDate: Date = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  maxDate: Date = new Date();
  campaignOptions: { name: string, id: string }[] = [];

  constructor(private formService: FormService) {}

  ngOnInit(): void {
    this.loadCampaigns();
  }

  ngOnChanges(): void {
    this.loadCampaigns();
  }

loadCampaigns(): void {
  if (this.selectedAppIds.length > 0) {
    const requests = this.selectedAppIds.map(appId => this.formService.loadCampaignOptions(appId));

    forkJoin(requests).subscribe(results => {
      const allCampaigns = results.flat(); // Aplatir les tableaux reçus
      const uniqueCampaigns = Array.from(new Map(allCampaigns.map(c => [c.id, c])).values());

      this.campaignOptions = uniqueCampaigns.map((camp: any) => ({
        name: camp.name,
        id: camp.id
      }));
    });
  }
}

  applyFilters(): void {
    this.filterChange.emit(this.filters);
  }

  clearFilters(): void {
    this.filters = {
      title: '',
      user_email: '',
      campaign_ids: [],
      dateRange: null
    };
    this.applyFilters();
  }
}
