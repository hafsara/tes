import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent implements OnInit {
    items: any;

    ngOnInit() {
        this.items = [
            {
                label: 'Sign Out',
                icon: 'pi pi-sign-out',
                command: () => {}
            }
        ];
    }

}
