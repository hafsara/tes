import { Component  } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-admin-workflow',
  templateUrl: './admin-workflow.component.html',
  styleUrls: ['./admin-workflow.component.scss']
})
export class AdminWorkflowComponent {
  items: MenuItem[] = [];
  contextStep: any = null;
  steps = [{ id: "step1", label: "Start", type: "start", delay: 0 }];
  displayDialog = false;
  selectedStep: any = { label: '', type: '', delay: 0 };
  stepTypes = [{ label: 'Rappel', value: 'reminder' }, { label: 'Escalade', value: 'escalation' }];

  constructor() {
    this.initContextMenu();
  }

  initContextMenu() {
    this.items = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => this.onEditStep(this.contextStep)
      },
      {
        label: 'delete',
        icon: 'pi pi-trash',
        command: () => this.deleteStep(this.contextStep.id)
      }
    ];
  }

  openContextMenu(event: Event, step: any, menu: any) {
    this.contextStep = step;
    menu.toggle(event);
  }

  addStep() {
    const newId = 'step' + (this.steps.length + 1);
    const newStep = { id: newId, label: "Nouvelle étape", type: "reminder", delay: 1 };
    //this.steps.push(newStep);
    this.selectedStep = newStep;
    this.displayDialog = true;
  }

  onEditStep(step: any) {
    this.selectedStep = { ...step };
    this.displayDialog = true;
  }

  updateStep() {
    const index = this.steps.findIndex(s => s.id === this.selectedStep.id);
    if (index !== -1) {
      this.steps[index] = { ...this.selectedStep };
    }
    this.displayDialog = false;
  }

  validateStep(){
    this.steps.push(this.selectedStep);
    this.displayDialog = false;
  }

  deleteStep(stepId: string) {
    this.steps = this.steps.filter(step => step.id !== stepId);
  }
  saveWorkflow() {
    console.log("Workflow enregistré :", JSON.stringify(this.steps, null, 2));
    alert("Workflow sauvegardé !");
  }
}
