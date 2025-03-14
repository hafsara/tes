import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent  {
 @Output() filterChange = new EventEmitter<any>();

  filters = {
    title: '',
    user_email: '',
    campaign_name: '',
    dateRange: null
  };
  minDate: Date = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  maxDate: Date = new Date();


  applyFilters(): void {
    this.filterChange.emit(this.filters);
  }

  clearFilters(): void {
    this.filters = {
      title: '',
      user_email: '',
      campaign_name: '',
      dateRange: null
    };
    this.applyFilters();
  }
}
