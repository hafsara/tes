import { Component } from '@angular/core';

interface Question {
  text: string;
  type: 'text' | 'multiple-choice' | 'checkbox'; // Types de questions disponibles
  options?: string[]; // Utilisé uniquement pour les questions à choix multiple et case à cocher
}

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent {
  formTitle = '';
  formDescription = '';
  userMail = '';
  managerMail = '';
  escalation = false;

  questions: Question[] = []; // Liste des questions

  // Ajouter une nouvelle question
  addQuestion(type: 'text' | 'multiple-choice' | 'checkbox') {
    const newQuestion: Question = {
      text: '',
      type: type,
      options: type === 'multiple-choice' || type === 'checkbox' ? [''] : undefined
    };
    this.questions.push(newQuestion);
  }

  // Ajouter une option à une question à choix multiple ou case à cocher
  addOption(questionIndex: number) {
    this.questions[questionIndex].options?.push('');
  }

  // Supprimer une option d'une question
  removeOption(questionIndex: number, optionIndex: number) {
    this.questions[questionIndex].options?.splice(optionIndex, 1);
  }

  // Soumettre le formulaire (envoyer les données à une API, etc.)
  submitForm() {
    const formData = {
      title: this.formTitle,
      description: this.formDescription,
      userMail: this.userMail,
      managerMail: this.managerMail,
      escalation: this.escalation,
      questions: this.questions
    };
    console.log('Formulaire soumis :', formData);
    // Envoyer les données à l'API backend ici si nécessaire
  }
}
