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

function selectFormByStatus(status: string, formContainer: FormContainer): Form | Form[] | null {
  if (status === 'unsubstantial') {
    return formContainer.forms.filter((form) => form.status === status);
  } else {
    return formContainer.forms.find((form) => form.status === status) || null;
  }
}

export function createForm(status: string): Form {
  return {
    status: status,
    questions: []
  };
}

export function addForm(form: Form, formContainer: FormContainer): FormContainer {
  formContainer.forms.push(form);
  return formContainer;
}
