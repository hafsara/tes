import { Component } from '@angular/core';

interface Question {
  text: string;
  type: string;
  options: string[];
  isRequired: boolean;
}

interface FormContainer {
  title: string;
  description: string;
  userEmail: string;
  managerEmail?: string;
  escalation: boolean;
  questions: Question[];
}

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent {
  form: FormContainer = {
    title: '',
    description: '',
    userEmail: '',
    managerEmail: '',
    escalation: false,
    questions: [{ text: '', type: 'multipleChoice', options: ['Option 1'], isRequired: true }]
  };

  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Propriétés pour afficher les erreurs
  showTitleError = false;
  showDescriptionError = false;
  showUserEmailError = false;
  showManagerEmailError = false;

  // Méthode de validation pour l'étape 1
  validateStep1(): boolean {
    this.showTitleError = this.form.title.trim() === '';
    this.showDescriptionError = this.form.description.trim() === '';
    this.showUserEmailError = !this.emailPattern.test(this.form.userEmail);

    if (this.form.escalation) {
      this.showManagerEmailError = !this.emailPattern.test(this.form.managerEmail || '');
    } else {
      this.showManagerEmailError = false;
    }

    // Retourne true si tous les champs sont valides
    return !this.showTitleError && !this.showDescriptionError && !this.showUserEmailError && !this.showManagerEmailError;
  }

  // Fonction pour passer à l'étape suivante
nextStep(nextCallback: any) {
  if (this.validateStep1()) {
    console.log("Tous les champs sont valides, passage à l'étape suivante.");
    if (nextCallback) {
      nextCallback(); // Assurez-vous que nextCallback existe avant de l'exécuter
    } else {
      console.error("nextCallback est indéfini.");
    }
  } else {
    console.log("Certains champs sont invalides, restez sur l'étape actuelle.");
  }
}

  // Fonction pour revenir à l'étape précédente
  previousStep(prevCallback: Function) {
    prevCallback();
  }
}
