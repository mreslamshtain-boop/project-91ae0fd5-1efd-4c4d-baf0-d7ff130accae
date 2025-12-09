export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type CorrectOption = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: string;
  index: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: CorrectOption;
  difficulty: Difficulty;
  mark: number;
  imageUrl?: string;
  explanation?: string;
}

export interface ExamConfig {
  title: string;
  description: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  passingPercent: number;
}

export interface DifficultySettings {
  mode: 'all-easy' | 'all-medium' | 'all-hard' | 'mixed';
  easyPercent?: number;
  mediumPercent?: number;
  hardPercent?: number;
}

export interface GenerationConfig {
  questionCount: number;
  difficulty: DifficultySettings;
  generateImages: boolean;
  sourceType: 'description' | 'pdf' | 'both';
  pdfFile?: File;
}

export interface Exam extends ExamConfig {
  id: string;
  questions: Question[];
  createdAt: Date;
}

export interface GenerationProgress {
  step: 'idle' | 'analyzing' | 'generating' | 'images' | 'excel' | 'complete' | 'error';
  message: string;
  progress: number;
}
