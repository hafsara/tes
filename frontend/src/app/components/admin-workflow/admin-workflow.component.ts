import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-admin-workflow',
  templateUrl: './admin-workflow.component.html',
  styleUrls: ['./admin-workflow.component.scss']
})
export class AdminWorkflowComponent {
  steps = [{ id: "step1", label: "Start", type: "start", delay: 0, collapsed: true }];
  displayDialog = false;
  selectedStep: any = null;
  availableTypes: any[] = [];
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
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.deleteStep(this.contextStep.id)
      }
    ];
  }

  openContextMenu(event: Event, step: any, menu: any) {
    this.contextStep = step;
    menu.toggle(event);
  }

  getAvailableStepTypes(prevType: string): any[] {
    if (prevType === 'start' || prevType === 'reminder') {
      return [
        { label: 'Reminder', value: 'reminder' },
        { label: 'Escalation', value: 'escalation' }
      ];
    } else if (prevType === 'escalation') {
      return [{ label: 'Escalation Reminder', value: 'reminder-escalation' }];
    } else if (prevType === 'reminder-escalation') {
      return [{ label: 'Escalation Reminder', value: 'reminder-escalation' }];
    }
    return [];
  }

  getAllStepTypes(): any[] {
    return [
      { label: 'Reminder', value: 'reminder' },
      { label: 'Escalation', value: 'escalation' },
      { label: 'Escalation Reminder', value: 'reminder-escalation' }
    ];
  }

  generateStepLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'reminder': 'Reminder',
      'escalation': 'Escalation',
      'reminder-escalation': 'Escalation Reminder'
    };

    const filteredSteps = this.steps.filter(step => step.type === type);
    return `${typeMap[type]} ${filteredSteps.length + 1}`;
  }

  addStep() {
    const lastStep = this.steps[this.steps.length - 1];
    this.availableTypes = this.getAvailableStepTypes(lastStep.type);

    if (this.availableTypes.length === 0) {
      alert("No available step types.");
      return;
    }

    this.selectedStep = {
      id: `step${this.steps.length + 1}`,
      type: '',
      label: '',
      delay: 1,
      collapsed: true
    };

    this.displayDialog = true;
  }

  confirmAddStep() {
    if (!this.selectedStep.type) {
      alert("Please select a step type.");
      return;
    }

    this.selectedStep.label = this.generateStepLabel(this.selectedStep.type);
    this.steps.push({ ...this.selectedStep });
    this.displayDialog = false;
  }

  onEditStep(step: any) {
    this.selectedStep = { ...step };
    this.availableTypes = step.type === 'start' ? [] : this.getAllStepTypes(); // Prevent changing Start type
    this.displayDialog = true;
  }

  updateStep() {
    if (!this.selectedStep) return;

    const index = this.steps.findIndex(s => s.id === this.selectedStep.id);
    if (index !== -1) {
      if (this.selectedStep.type !== 'start') {
        this.selectedStep.label = this.generateStepLabel(this.selectedStep.type);
      }
      this.steps[index] = { ...this.selectedStep };
    }
    this.displayDialog = false;
  }

  deleteStep(stepId: string) {
    this.steps = this.steps.filter(step => step.id !== stepId);
  }

  validateWorkflow(): boolean {
    for (let i = 1; i < this.steps.length; i++) {
      const prevStep = this.steps[i - 1];
      const currentStep = this.steps[i];

      const allowedNextTypes = this.getAvailableStepTypes(prevStep.type).map(t => t.value);

      if (!allowedNextTypes.includes(currentStep.type)) {
        alert(`Invalid sequence: "${prevStep.label}" cannot be followed by "${currentStep.label}".`);
        return false;
      }
    }
    return true;
  }

  saveWorkflow() {
    if (!this.validateWorkflow()) {
      return;
    }
    console.log("Workflow saved:", JSON.stringify(this.steps, null, 2));
    alert("Workflow saved successfully!");
  }
}
