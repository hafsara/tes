export interface Question {
  label: string;
  type: string;
  options: string[];
  isRequired?: boolean;
  response?: string;
  selectedOptions?: string[];
  formattedOptions?: { label: string; value: string }[];
}

export interface Form {
  id?: string;
  status?: string;
  questions: Question[];
}

export interface FormContainer {
  access_token?: string;
  title: string;
  description: string;
  userEmail: string;
  reference?: string;
  managerEmail?: string;
  escalate: boolean;
  reminderDelayDay: number;
  forms: Form[];
  validated?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function formatQuestions(questions: Question[]): Question[] {
  return questions.map((question) => ({
    ...question,
    isRequired: question.isRequired ?? true,
    selectedOptions: question.selectedOptions || [],
    formattedOptions: question.options.map((opt) => ({ label: opt, value: opt }))
  }));
}

export function createForm(): Form {
  return {
    questions: [{
        label: '',
        type: 'text',
        options: [],
        isRequired: true}]
  };
}

export function addForm(form: Form, formContainer: FormContainer): FormContainer {
  formContainer.forms.push(form);
  return formContainer;
}
