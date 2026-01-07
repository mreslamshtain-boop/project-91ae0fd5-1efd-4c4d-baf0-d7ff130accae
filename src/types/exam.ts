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
  needsImage?: boolean;
  qualityScore?: number;
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

export type AIModel = 'xiaomi/mimo-v2-flash:free' | 'nvidia/nemotron-3-nano-30b-a3b:free';

export interface GenerationConfig {
  questionCount: number;
  difficulty: DifficultySettings;
  generateImages: boolean;
  imageMode: 'auto' | 'percentage';
  imagePercentage: number;
  sourceType: 'description' | 'pdf' | 'both';
  pdfFile?: File;
  customPrompt?: string;
  enableQualityCheck: boolean;
  aiModel: AIModel;
}

export interface QuestionQuality {
  questionId: string;
  score: number;
  issues: string[];
  suggestion?: string;
}

export interface Exam extends ExamConfig {
  id: string;
  questions: Question[];
  createdAt: Date;
}

export interface GenerationProgress {
  step: 'idle' | 'analyzing' | 'generating' | 'quality-check' | 'regenerating' | 'images' | 'excel' | 'complete' | 'error';
  message: string;
  progress: number;
}
