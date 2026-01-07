import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Loader2, LogOut, ArrowRight } from "lucide-react";
import { ExamHeader } from "@/components/exam/ExamHeader";
import { ExamInfoForm } from "@/components/exam/ExamInfoForm";
import { SourceSelector } from "@/components/exam/SourceSelector";
import { QuestionSettings } from "@/components/exam/QuestionSettings";
import { ProgressIndicator } from "@/components/exam/ProgressIndicator";
import { QuestionsPreview } from "@/components/exam/QuestionsPreview";
import { ExportButtons } from "@/components/exam/ExportButtons";
import { ExamConfig, GenerationConfig, GenerationProgress, Exam, Question } from "@/types/exam";
import { parsePdfContent, generateQuestions, generateDiagram, needsImage, saveExam } from "@/lib/api";
import { generateExcel } from "@/lib/export-excel";
import { generatePdf } from "@/lib/export-pdf";
const initialExamConfig: ExamConfig = {
  title: "",
  description: "",
  subject: "",
  grade: "",
  durationMinutes: 60,
  passingPercent: 50
};
const initialGenerationConfig: GenerationConfig = {
  questionCount: 10,
  difficulty: {
    mode: "mixed",
    easyPercent: 33,
    mediumPercent: 34,
    hardPercent: 33
  },
  generateImages: true,
  imageMode: "percentage",
  imagePercentage: 30,
  sourceType: "description",
  customPrompt: "",
  enableQualityCheck: true
};
export default function Index() {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    user,
    logout,
    isLoading
  } = useAuth();
  const [examConfig, setExamConfig] = useState<ExamConfig>(initialExamConfig);
  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>(initialGenerationConfig);
  const [progress, setProgress] = useState<GenerationProgress>({
    step: "idle",
    message: "",
    progress: 0
  });
  const [exam, setExam] = useState<Exam | null>(null);
  const isGenerating = progress.step !== "idle" && progress.step !== "complete" && progress.step !== "error";

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  const canGenerate = examConfig.title.trim() !== "" && (examConfig.description.trim() !== "" || generationConfig.pdfFile) && !isGenerating;
  const handleGenerate = async () => {
    if (!canGenerate) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء إدخال عنوان الاختبار ووصف المحتوى أو رفع ملف PDF",
        variant: "destructive"
      });
      return;
    }
    try {
      let pdfContent: string | undefined;

      // Step 1: Parse PDF if provided
      if (generationConfig.pdfFile && (generationConfig.sourceType === 'pdf' || generationConfig.sourceType === 'both')) {
        setProgress({
          step: "analyzing",
          message: "جاري تحليل ملف PDF...",
          progress: 10
        });
        try {
          pdfContent = await parsePdfContent(generationConfig.pdfFile);
        } catch (error) {
          console.error('PDF parsing error:', error);
          toast({
            title: "تنبيه",
            description: "تعذر تحليل ملف PDF، سيتم الاستمرار بالوصف المكتوب",
            variant: "destructive"
          });
        }
      }

      // Step 2: Generate questions with AI
      setProgress({
        step: "generating",
        message: "جاري توليد الأسئلة باستخدام الذكاء الاصطناعي...",
        progress: 30
      });
      let questions: Question[];
      try {
        questions = await generateQuestions(examConfig, generationConfig, pdfContent);
      } catch (error) {
        throw new Error('فشل في توليد الأسئلة: ' + (error instanceof Error ? error.message : 'خطأ غير معروف'));
      }
      const examId = crypto.randomUUID();

      // Step 3: Generate images for questions that need them
      if (generationConfig.generateImages) {
        setProgress({
          step: "images",
          message: "جاري توليد الصور التوضيحية...",
          progress: 60
        });
        
        // Determine which questions need images
        let questionsToGenerateImages: number[] = [];
        
        if (generationConfig.imageMode === 'percentage') {
          // Force generate images for a percentage of questions
          const imageCount = Math.max(1, Math.round(questions.length * generationConfig.imagePercentage / 100));
          // Select random questions for image generation
          const indices = questions.map((_, i) => i);
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
          }
          questionsToGenerateImages = indices.slice(0, imageCount);
        } else {
          // Auto mode: only generate for questions that explicitly need images
          questionsToGenerateImages = questions
            .map((q, i) => (needsImage(q.text) || q.needsImage) ? i : -1)
            .filter(i => i !== -1);
        }
        
        console.log(`Generating images for ${questionsToGenerateImages.length} questions`);
        
        for (const i of questionsToGenerateImages) {
          const question = questions[i];
          setProgress({
            step: "images",
            message: `جاري توليد صورة للسؤال ${i + 1}...`,
            progress: 60 + Math.round(questionsToGenerateImages.indexOf(i) / questionsToGenerateImages.length * 25)
          });
          try {
            const imageUrl = await generateDiagram(question.text, examId, question.id);
            if (imageUrl) {
              questions[i] = {
                ...question,
                imageUrl
              };
            }
          } catch (error) {
            console.error(`Failed to generate image for question ${i + 1}:`, error);
          }
        }
      }

      // Step 4: Create exam object
      setProgress({
        step: "excel",
        message: "جاري إنشاء الاختبار...",
        progress: 90
      });
      const newExam: Exam = {
        id: examId,
        ...examConfig,
        questions,
        createdAt: new Date()
      };

      // Save to database
      try {
        await saveExam(newExam);
      } catch (error) {
        console.error('Failed to save exam:', error);
        // Continue anyway - the exam is still usable
      }
      setExam(newExam);
      setProgress({
        step: "complete",
        message: "تم توليد الاختبار بنجاح!",
        progress: 100
      });
      toast({
        title: "تم بنجاح!",
        description: `تم توليد ${questions.length} سؤال`
      });
    } catch (error) {
      console.error('Generation error:', error);
      setProgress({
        step: "error",
        message: error instanceof Error ? error.message : "حدث خطأ أثناء توليد الأسئلة",
        progress: 0
      });
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء توليد الأسئلة",
        variant: "destructive"
      });
    }
  };
  const handleExportExcel = async () => {
    if (!exam) return;
    generateExcel(exam);
  };
  const handleExportPdf = async (cardsPerPage: number) => {
    if (!exam) return;
    await generatePdf(exam, cardsPerPage);
  };
  const handleReset = () => {
    setProgress({
      step: "idle",
      message: "",
      progress: 0
    });
  };
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const backRoute = user?.role === 'ADMIN' ? '/admin' : '/teacher';
  return <div dir="rtl" className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card mb-6">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Qalam AI</span>
            </Link>
            <div className="h-8 w-px bg-border" />
            <Link to={backRoute}>
              <Button variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4 ml-1" />
                العودة
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container max-w-4xl mx-auto px-4 py-6">
        <ExamHeader />

        <div className="space-y-6">
          <ExamInfoForm config={examConfig} onChange={setExamConfig} />

          <SourceSelector config={generationConfig} onChange={setGenerationConfig} />

          <QuestionSettings config={generationConfig} onChange={setGenerationConfig} />

          <ProgressIndicator progress={progress} />

          {progress.step === 'error' && <Button onClick={handleReset} variant="outline" size="lg" className="w-full">
              إعادة المحاولة
            </Button>}

          {progress.step !== 'error' && <Button onClick={handleGenerate} disabled={!canGenerate} size="lg" className="w-full text-lg h-14">
              {isGenerating ? <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري التوليد...
                </> : <>
                  <Sparkles className="w-5 h-5 ml-2" />
                  ابدأ توليد الأسئلة
                </>}
            </Button>}

          <QuestionsPreview questions={exam?.questions || []} />

          <ExportButtons exam={exam} onExportExcel={handleExportExcel} onExportPdf={handleExportPdf} />
        </div>

        <footer className="text-center py-8 mt-12 border-t border-border">
          <p className="text-muted-foreground">شكراً جزيلاً لتعونكم الطيب مع منصة قلم التعليمية ❤</p>
        </footer>
      </div>
    </div>;
}