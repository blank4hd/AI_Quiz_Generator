export type QuestionType = "mcq" | "true-false" | "short-answer";
export type Difficulty = "easy" | "medium" | "hard";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  stem: string;
  options: QuestionOption[];
  explanation: string;
  difficulty: Difficulty;
  sourceReference?: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  createdAt: Date;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  pageCount?: number;
  uploadedAt: Date;
}
