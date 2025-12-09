import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";
import { ExamHeader } from "@/components/exam/ExamHeader";
import { ExamInfoForm } from "@/components/exam/ExamInfoForm";
import { SourceSelector } from "@/components/exam/SourceSelector";
import { QuestionSettings } from "@/components/exam/QuestionSettings";
import { ProgressIndicator } from "@/components/exam/ProgressIndicator";
import { QuestionsPreview } from "@/components/exam/QuestionsPreview";
import { ExportButtons } from "@/components/exam/ExportButtons";
import {
  ExamConfig,
  GenerationConfig,
  GenerationProgress,
  Exam,
  Question,
} from "@/types/exam";

const initialExamConfig: ExamConfig = {
  title: "",
  description: "",
  subject: "",
  grade: "",
  durationMinutes: 60,
  passingPercent: 50,
};

const initialGenerationConfig: GenerationConfig = {
  questionCount: 10,
  difficulty: { mode: "mixed", easyPercent: 33, mediumPercent: 34, hardPercent: 33 },
  generateImages: true,
  sourceType: "description",
};

// Sample generated questions for demo
const sampleQuestions: Question[] = [
  {
    id: "1",
    index: 1,
    text: "ما هي الوحدة الأساسية لقياس القوة في النظام الدولي؟",
    optionA: "الجول",
    optionB: "النيوتن",
    optionC: "الواط",
    optionD: "الباسكال",
    correctOption: "B",
    difficulty: "EASY",
    mark: 1,
    explanation: "النيوتن هي الوحدة الأساسية لقياس القوة في النظام الدولي للوحدات.",
  },
  {
    id: "2",
    index: 2,
    text: "في الدائرة الكهربائية الموضحة في الشكل المقابل، ما قيمة التيار الكلي إذا كانت المقاومة الكلية 10 أوم والجهد 20 فولت؟",
    optionA: "0.5 أمبير",
    optionB: "2 أمبير",
    optionC: "5 أمبير",
    optionD: "200 أمبير",
    correctOption: "B",
    difficulty: "MEDIUM",
    mark: 2,
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop",
    explanation: "باستخدام قانون أوم: I = V/R = 20/10 = 2 أمبير",
  },
  {
    id: "3",
    index: 3,
    text: "أي من العبارات التالية صحيحة حول قانون نيوتن الثالث؟",
    optionA: "الفعل ورد الفعل يؤثران على نفس الجسم",
    optionB: "الفعل ورد الفعل متساويان في المقدار ومتعاكسان في الاتجاه",
    optionC: "الفعل دائماً أكبر من رد الفعل",
    optionD: "الفعل ورد الفعل لا يحدثان في نفس الوقت",
    correctOption: "B",
    difficulty: "MEDIUM",
    mark: 2,
    explanation: "قانون نيوتن الثالث ينص على أن لكل فعل رد فعل مساوٍ له في المقدار ومعاكس له في الاتجاه.",
  },
  {
    id: "4",
    index: 4,
    text: "ما هي العلاقة بين الطاقة الحركية وسرعة الجسم؟",
    optionA: "طردية خطية",
    optionB: "عكسية",
    optionC: "طردية تربيعية",
    optionD: "لا توجد علاقة",
    correctOption: "C",
    difficulty: "HARD",
    mark: 3,
    explanation: "الطاقة الحركية = ½ × الكتلة × مربع السرعة، لذلك العلاقة طردية تربيعية مع السرعة.",
  },
];

export default function Index() {
  const { toast } = useToast();
  const [examConfig, setExamConfig] = useState<ExamConfig>(initialExamConfig);
  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>(initialGenerationConfig);
  const [progress, setProgress] = useState<GenerationProgress>({
    step: "idle",
    message: "",
    progress: 0,
  });
  const [exam, setExam] = useState<Exam | null>(null);

  const isGenerating = progress.step !== "idle" && progress.step !== "complete" && progress.step !== "error";

  const canGenerate =
    examConfig.title.trim() !== "" &&
    (examConfig.description.trim() !== "" || generationConfig.pdfFile) &&
    !isGenerating;

  const simulateGeneration = async () => {
    setProgress({ step: "analyzing", message: "جاري تحليل المحتوى...", progress: 10 });
    await new Promise((r) => setTimeout(r, 1500));

    setProgress({ step: "generating", message: "جاري توليد الأسئلة...", progress: 40 });
    await new Promise((r) => setTimeout(r, 2000));

    if (generationConfig.generateImages) {
      setProgress({ step: "images", message: "جاري توليد الصور ورفعها...", progress: 70 });
      await new Promise((r) => setTimeout(r, 1500));
    }

    setProgress({ step: "excel", message: "جاري إنشاء ملف Excel...", progress: 90 });
    await new Promise((r) => setTimeout(r, 1000));

    setProgress({ step: "complete", message: "تم توليد الاختبار بنجاح!", progress: 100 });

    const newExam: Exam = {
      id: crypto.randomUUID(),
      ...examConfig,
      questions: sampleQuestions.slice(0, generationConfig.questionCount),
      createdAt: new Date(),
    };
    setExam(newExam);

    toast({
      title: "تم بنجاح!",
      description: `تم توليد ${newExam.questions.length} سؤال`,
    });
  };

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء إدخال عنوان الاختبار ووصف المحتوى أو رفع ملف PDF",
        variant: "destructive",
      });
      return;
    }

    try {
      await simulateGeneration();
    } catch (error) {
      setProgress({
        step: "error",
        message: "حدث خطأ أثناء توليد الأسئلة",
        progress: 0,
      });
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء توليد الأسئلة. الرجاء المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = async () => {
    toast({
      title: "قريباً",
      description: "سيتم تفعيل تصدير Excel بعد ربط قاعدة البيانات",
    });
  };

  const handleExportPdf = async (cardsPerPage: number) => {
    toast({
      title: "قريباً",
      description: `سيتم تصدير PDF بـ ${cardsPerPage} سؤال في الصفحة بعد ربط قاعدة البيانات`,
    });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <ExamHeader />

        <div className="space-y-6">
          <ExamInfoForm config={examConfig} onChange={setExamConfig} />

          <SourceSelector config={generationConfig} onChange={setGenerationConfig} />

          <QuestionSettings config={generationConfig} onChange={setGenerationConfig} />

          <ProgressIndicator progress={progress} />

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            size="lg"
            className="w-full text-lg h-14"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                جاري التوليد...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 ml-2" />
                ابدأ توليد الأسئلة
              </>
            )}
          </Button>

          <QuestionsPreview questions={exam?.questions || []} />

          <ExportButtons
            exam={exam}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
          />
        </div>

        <footer className="text-center py-8 mt-12 border-t border-border">
          <p className="text-muted-foreground">
            مولّد الاختبارات الذكي - مدعوم بالذكاء الاصطناعي
          </p>
        </footer>
      </div>
    </div>
  );
}
