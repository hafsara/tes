export interface Question {
  label: string;
  type: string;
  options: string[];
  isRequired?: boolean;
  response?: string;
  selectedOptions?: string[];
  formattedOptions?: { label: string; value: string }[];
}

export function formatQuestions(questions: Question[]): Question[] {
  return questions.map((question) => ({
    ...question,
    isRequired: question.isRequired ?? true,
    selectedOptions: question.selectedOptions || [],
    formattedOptions: question.options.map((opt) => ({ label: opt, value: opt }))
  }));
}
