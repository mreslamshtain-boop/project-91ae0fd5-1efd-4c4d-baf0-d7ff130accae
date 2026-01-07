import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogOut, ArrowRight, FileText, Calendar, Clock, Download, Trash2, Sparkles } from 'lucide-react';
import { generateExcel } from '@/lib/export-excel';
import { generatePdf } from '@/lib/export-pdf';
import { Exam, Question } from '@/types/exam';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ExamWithQuestions {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  grade: string | null;
  duration_minutes: number | null;
  passing_percent: number | null;
  created_at: string;
  questions: Question[];
}

export default function TeacherExams() {
  const navigate = useNavigate();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [exams, setExams] = useState<ExamWithQuestions[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (!authLoading && user && user.role !== 'TEACHER') {
      navigate('/admin');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data: examsData, error: examsError } = await supabase
          .from('exams')
          .select('*')
          .order('created_at', { ascending: false });

        if (examsError) throw examsError;

        const examsWithQuestions: ExamWithQuestions[] = [];
        
        for (const exam of examsData || []) {
          const { data: questionsData } = await supabase
            .from('questions')
            .select('*')
            .eq('exam_id', exam.id)
            .order('index', { ascending: true });

          const questions: Question[] = (questionsData || []).map(q => ({
            id: q.id,
            examId: q.exam_id,
            index: q.index,
            text: q.text,
            optionA: q.option_a,
            optionB: q.option_b,
            optionC: q.option_c,
            optionD: q.option_d,
            correctOption: q.correct_option as 'A' | 'B' | 'C' | 'D',
            difficulty: q.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
            mark: q.mark,
            imageUrl: q.image_url || undefined,
            explanation: q.explanation || undefined,
          }));

          examsWithQuestions.push({
            ...exam,
            questions,
          });
        }

        setExams(examsWithQuestions);
      } catch (error) {
        console.error('Error fetching exams:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchExams();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExportExcel = (examData: ExamWithQuestions) => {
    const exam: Exam = {
      id: examData.id,
      title: examData.title,
      description: examData.description || '',
      subject: examData.subject || '',
      grade: examData.grade || '',
      durationMinutes: examData.duration_minutes || 60,
      passingPercent: examData.passing_percent || 50,
      questions: examData.questions,
      createdAt: new Date(examData.created_at),
    };
    generateExcel(exam);
  };

  const handleExportPdf = async (examData: ExamWithQuestions, cardsPerPage: number) => {
    const exam: Exam = {
      id: examData.id,
      title: examData.title,
      description: examData.description || '',
      subject: examData.subject || '',
      grade: examData.grade || '',
      durationMinutes: examData.duration_minutes || 60,
      passingPercent: examData.passing_percent || 50,
      questions: examData.questions,
      createdAt: new Date(examData.created_at),
    };
    await generatePdf(exam, cardsPerPage);
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      // Delete questions first (due to foreign key)
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('exam_id', examId);

      if (questionsError) throw questionsError;

      // Delete the exam
      const { error: examError } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (examError) throw examError;

      setExams(exams.filter(e => e.id !== examId));
      toast.success('تم حذف الاختبار بنجاح');
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast.error('حدث خطأ أثناء حذف الاختبار');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Qalam AI</span>
            </Link>
            <div className="h-8 w-px bg-border" />
            <Link to="/teacher">
              <Button variant="ghost" size="sm">
                <ArrowRight className="w-4 h-4 ml-1" />
                العودة
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">اختباراتي السابقة</span>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                اختباراتي السابقة
              </CardTitle>
              <CardDescription>
                عرض وتصدير الاختبارات التي قمت بإنشائها
              </CardDescription>
            </CardHeader>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : exams.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">لا توجد اختبارات سابقة</p>
                <Link to="/">
                  <Button className="mt-4">إنشاء اختبار جديد</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <Card key={exam.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{exam.title}</h3>
                        {exam.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {exam.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          {exam.subject && (
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                              {exam.subject}
                            </span>
                          )}
                          {exam.grade && (
                            <span className="bg-secondary px-2 py-1 rounded">
                              {exam.grade}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {exam.questions.length} سؤال
                          </span>
                          {exam.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {exam.duration_minutes} دقيقة
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(exam.created_at).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mr-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportExcel(exam)}
                        >
                          <Download className="w-4 h-4 ml-1" />
                          Excel
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportPdf(exam, 2)}
                        >
                          <Download className="w-4 h-4 ml-1" />
                          PDF
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4 ml-1" />
                              حذف
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد من حذف الاختبار؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيتم حذف الاختبار "{exam.title}" وجميع أسئلته نهائياً. لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-row-reverse gap-2">
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteExam(exam.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
