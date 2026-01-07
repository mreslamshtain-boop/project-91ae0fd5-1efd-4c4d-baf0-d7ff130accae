import { supabase } from "@/integrations/supabase/client";
import { ExamConfig, GenerationConfig, Question, Exam } from "@/types/exam";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export async function parsePdfContent(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'فشل في تحليل ملف PDF');
  }

  const data = await response.json();
  return data.content;
}

export async function generateQuestions(
  examConfig: ExamConfig,
  generationConfig: GenerationConfig,
  pdfContent?: string
): Promise<Question[]> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: examConfig.title,
      description: examConfig.description,
      subject: examConfig.subject,
      grade: examConfig.grade,
      questionCount: generationConfig.questionCount,
      difficulty: generationConfig.difficulty,
      pdfContent,
      customPrompt: generationConfig.customPrompt,
      enableQualityCheck: generationConfig.enableQualityCheck,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'فشل في توليد الأسئلة');
  }

  const data = await response.json();
  return data.questions.map((q: any, i: number) => ({
    id: crypto.randomUUID(),
    index: i + 1,
    ...q,
  }));
}

export async function generateDiagram(
  questionText: string,
  examId: string,
  questionId: string
): Promise<string | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-diagram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionText,
        examId,
        questionId,
      }),
    });

    if (!response.ok) {
      console.error('Diagram generation failed');
      return null;
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating diagram:', error);
    return null;
  }
}

export function needsImage(questionText: string): boolean {
  const patterns = [
    'في الشكل المقابل',
    'في الدائرة الموضحة',
    'الرسم البياني التالي',
    'المخطط',
    'المنحنى',
    'الشكل التالي',
    'كما هو موضح',
    'الشكل أدناه',
    'الدائرة المقابلة',
    'في الصورة',
  ];
  
  return patterns.some(pattern => questionText.includes(pattern));
}

export async function saveExam(exam: Exam): Promise<string> {
  const { data: examData, error: examError } = await supabase
    .from('exams')
    .insert({
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      grade: exam.grade,
      duration_minutes: exam.durationMinutes,
      passing_percent: exam.passingPercent,
    })
    .select('id')
    .single();

  if (examError) throw examError;

  const questionsToInsert = exam.questions.map(q => ({
    exam_id: examData.id,
    index: q.index,
    text: q.text,
    option_a: q.optionA,
    option_b: q.optionB,
    option_c: q.optionC,
    option_d: q.optionD,
    correct_option: q.correctOption,
    difficulty: q.difficulty,
    mark: q.mark,
    image_url: q.imageUrl,
    explanation: q.explanation,
  }));

  const { error: questionsError } = await supabase
    .from('questions')
    .insert(questionsToInsert);

  if (questionsError) throw questionsError;

  return examData.id;
}
