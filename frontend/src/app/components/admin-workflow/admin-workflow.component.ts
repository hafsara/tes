import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormService } from '../../services/form.service';

@Component({
  selector: 'app-admin-workflow',
  templateUrl: './admin-workflow.component.html',
  styleUrls: ['./admin-workflow.component.scss']
})
export class AdminWorkflowComponent {
  steps = [{ id: "step1", label: "Start", type: "start", delay: 0 }];
  displayDialog = false;
  selectedStep: any = null;
  availableTypes: any[] = [];
  workflows: any[] = [];
  items: MenuItem[] = [];
  isEditing = false;
  showCreation = false;
  contextStep: any = null;
  workflowName: string = '';
  displayWorkflowDialog: boolean = false;

  constructor(private messageService: MessageService, private formService: FormService, private confirmationService: ConfirmationService,) {
    this.initContextMenu();
    this.loadWorkflows();
  }

  loadWorkflows(): void {
    this.formService.getWorkflows().subscribe({
      next: (workflows) => {
        this.workflows = workflows;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load workflows.' });
      },
    });
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
        command: () => this.deleteStep(this.contextStep.id),
        disabled: this.contextStep?.type === 'start'
      }
    ];
  }

  openContextMenu(event: Event, step: any, menu: any) {
    this.contextStep = step;
    this.initContextMenu();
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
      { label: 'Start', value: 'start' },
      { label: 'Reminder', value: 'reminder' },
      { label: 'Escalation', value: 'escalation' },
      { label: 'Escalation Reminder', value: 'reminder-escalation' }
    ];
  }

  generateStepLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'start': 'Start',
      'reminder': 'Reminder',
      'escalation': 'Escalation',
      'reminder-escalation': 'Escalation Reminder'
    };

    const filteredSteps = this.steps.filter(step => step.type === type);
    return type === 'start' ? 'Start' : `${typeMap[type]} ${filteredSteps.length + 1}`;
  }

  addStep() {
    const lastStep = this.steps[this.steps.length - 1];
    this.availableTypes = this.getAvailableStepTypes(lastStep.type);

    if (this.availableTypes.length === 0) {
      this.messageService.add({ severity: 'warn', detail: "No available step types.", life: 1000});
      return;
    }

    this.selectedStep = {
      id: `step${this.steps.length + 1}`,
      type: '',
      label: '',
      delay: 1
    };

    this.isEditing = false;
    this.displayDialog = true;
  }

  confirmAddStep() {
    if (!this.selectedStep.type) {
      this.messageService.add({ severity: 'warn', detail: "Please select a step type.", life: 1000});
      return;
    }

    this.selectedStep.label = this.generateStepLabel(this.selectedStep.type);
    this.steps.push({ ...this.selectedStep });
    this.displayDialog = false;
  }

  onEditStep(step: any) {
    this.selectedStep = { ...step };
    this.availableTypes = step.type === 'start' ? [{ label: 'Start', value: 'start' }] : this.getAllStepTypes();
    this.isEditing = true;
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
    const stepToDelete = this.steps.find(step => step.id === stepId);
    if (!stepToDelete) return;

    if (stepToDelete.type === 'start') {
      this.messageService.add({ severity: 'error', detail: "The Start step cannot be deleted.", life: 1000});
      return;
    }

    this.steps = this.steps.filter(step => step.id !== stepId);
  }

  validateWorkflow(): boolean {
    for (let i = 1; i < this.steps.length; i++) {
      const prevStep = this.steps[i - 1];
      const currentStep = this.steps[i];

      const allowedNextTypes = this.getAvailableStepTypes(prevStep.type).map(t => t.value);

      if (!allowedNextTypes.includes(currentStep.type)) {
        this.messageService.add({ severity: 'error',
          detail: `Invalid sequence: "${prevStep.label}" cannot be followed by "${currentStep.label}".`,
          life: 1000});
        return false;
      }
    }
    return true;
  }

  saveWorkflow() {
    if (!this.validateWorkflow()) {
      return;
    }

    this.displayWorkflowDialog = true;
  }

  drop(event: CdkDragDrop<any[]>) {
    const previousIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    if (this.steps[currentIndex].type === 'start' && currentIndex === 0) {
      this.messageService.add({ severity: 'error', detail: "The 'Start' step must always be the first step.", life: 1000});
      return;
    }

    if (!this.isValidMove(previousIndex, currentIndex)) {
      this.messageService.add({ severity: 'error',
        detail: "Invalid step order! Please follow the correct workflow logic.",
        life: 1000});
      return;
    }

    moveItemInArray(this.steps, previousIndex, currentIndex);
  }


  isValidMove(fromIndex: number, toIndex: number): boolean {
    const movingStep = this.steps[fromIndex];
    const targetStep = this.steps[toIndex];

    if (movingStep.type === 'escalation' && targetStep.type === 'reminder') {
      return false;
    }

    if (movingStep.type === 'reminder-escalation' && targetStep.type !== 'escalation' && targetStep.type !== 'reminder-escalation') {
      return false;
    }

    return true;
  }

  confirmSaveWorkflow() {
    if (!this.workflowName.trim()) {
      alert("Please enter a workflow title.");
      return;
    }

    const workflowData = {
      name: this.workflowName,
      steps: this.steps,
    };

    this.createWorkflow(workflowData);
    this.displayWorkflowDialog = false;
  }

  createWorkflow(workflowData: any) {
    this.formService.createWorkflow(workflowData).subscribe(
      response => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Workflow created successfully' });
        this.workflows.push({...workflowData, id: response.id, created_by: response.created_by});

      },
      error => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error creating workflow' });
      }
    );
    this.showCreation = false;
  }

  viewWorkflow(steps: any){

  }

  deleteWorkflow(id: string){
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this workflow?',
      header: 'Confirm deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.ConfirmDeleteWorkflow(id);
      },
    });
  }

  ConfirmDeleteWorkflow(id: string){
    this.formService.deleteWorkflow(id).subscribe({
      next: () => {
        this.workflows = this.workflows.filter((w) => w.id !== id);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'workflow deleted successfully.' });
      },
      error: (err) => {
        console.error('Failed to delete workflow:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete workflow.' });
      },
    });
  }
}
