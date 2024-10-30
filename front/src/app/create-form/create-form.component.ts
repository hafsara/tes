import { Component } from '@angular/core';

interface Question {
  text: string;
  type: string;
  options: string[];
  isRequired: boolean;
}

@Component({
  selector: 'app-create-form',
  templateUrl: './create-form.component.html',
  styleUrls: ['./create-form.component.scss']
})
export class CreateFormComponent {
  title: string = '';
  description: string = '';
  userEmail: string = '';
  managerEmail: string = '';
  escalation: boolean = false;
  questions: Question[] = [
    { text: '', type: 'multipleChoice', options: ['Option 1'], isRequired: false }
  ];

  // Gestion de l'affichage du champ Manager Email
  toggleEscalation() {
    if (!this.escalation) {
      this.managerEmail = ''; // Réinitialise l'email du manager si l'escalade est désactivée
    }
  }

  addQuestion() {
    this.questions.push({
      text: '',
      type: 'multipleChoice',
      options: ['Option 1'],
      isRequired: false
    });
  }

  removeQuestion(index: number) {
    if (this.questions.length > 1) {
      this.questions.splice(index, 1);
    }
  }

  duplicateQuestion(index: number) {
    const questionToDuplicate = this.questions[index];
    this.questions.splice(index + 1, 0, {
      text: questionToDuplicate.text,
      type: questionToDuplicate.type,
      options: [...questionToDuplicate.options],
      isRequired: questionToDuplicate.isRequired
    });
  }

  addOption(questionIndex: number) {
    const optionNumber = this.questions[questionIndex].options.length + 1;
    this.questions[questionIndex].options.push(`Option ${optionNumber}`);
  }

  removeOption(questionIndex: number, optionIndex: number) {
    if (this.questions[questionIndex].options.length > 1) {
      this.questions[questionIndex].options.splice(optionIndex, 1);
    }
  }

  // Sauvegarde du formulaire
  saveForm() {
    if (this.title && this.description && this.userEmail) {
      const formData = {
        title: this.title,
        description: this.description,
        user: {
          email: this.userEmail,
          managerEmail: this.escalation ? this.managerEmail : null,
          escalation: this.escalation
        },
        questions: this.questions
      };
      console.log('Form Data:', formData);
      // Envoie formData à l'API backend pour enregistrement
    } else {
      alert('Veuillez remplir tous les champs obligatoires');
    }
  }
}
