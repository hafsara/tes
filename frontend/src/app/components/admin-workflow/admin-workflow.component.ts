import { Component  } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-admin-workflow',
  templateUrl: './admin-workflow.component.html',
  styleUrls: ['./admin-workflow.component.scss']
})
export class AdminWorkflowComponent {
  steps = [{ id: "step1", label: "Start", type: "start", delay: 0 }];
  displayDialog = false;
  selectedStep: any = { label: '', type: '', delay: 0 };
  stepTypes = [{ label: 'Reminder', value: 'reminder' }, { label: 'Escalate', value: 'escalation' }];
  items: MenuItem[] = [];
  contextStep: any = null;

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

  getNextStepType(prevType: string): string {
    if (prevType === 'reminder') {
      return 'reminder';
    } else if (prevType === 'escalation') {
      return 'reminder-escalation';
    }
    return 'reminder';
  }

  generateStepLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'reminder': 'Reminder',
      'escalation': 'Escalate',
      'reminder-escalation': 'Escalate Reminder'
    };

    const filteredSteps = this.steps.filter(step => step.type === type);
    return `${typeMap[type]} ${filteredSteps.length + 1}`;
  }

  addStep() {
    const lastStep = this.steps[this.steps.length - 1];
    const nextType = this.getNextStepType(lastStep.type);

    const newId = 'step' + (this.steps.length + 1);
    const newStep = {
      id: newId,
      label: this.generateStepLabel(nextType),
      type: nextType,
      delay: 1,
    };
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
