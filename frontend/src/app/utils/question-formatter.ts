export interface Question {
  label: string;
  type: 'text' | 'radioButton' | 'checkbox' | 'dropdown';
  options: string[];
  isRequired?: boolean;
  response?: string | string[] | undefined;
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
  appId: string;
  campaignId: string;
  title: string;
  description: string;
  userEmail: string;
  reference?: string;
  managerEmail?: string;
  ccEmails?: string[];
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
