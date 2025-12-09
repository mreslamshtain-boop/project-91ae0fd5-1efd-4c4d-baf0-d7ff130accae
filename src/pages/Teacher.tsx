import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, LogOut, GraduationCap, FileText, PlusCircle } from 'lucide-react';

export default function Teacher() {
  const navigate = useNavigate();
  const { user, logout, isLoading: authLoading } = useAuth();

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (!authLoading && user && user.role !== 'TEACHER') {
      navigate('/admin');
    }
  }, [user, authLoading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">لوحة المعلم</h1>
              <p className="text-sm text-muted-foreground">مرحباً، {user.name || 'معلم'}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>مرحباً بك في مولّد الاختبارات الذكي</CardTitle>
              <CardDescription>
                يمكنك إنشاء اختبارات متعددة الخيارات بسهولة باستخدام الذكاء الاصطناعي
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <Link to="/">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <PlusCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">إنشاء اختبار جديد</h3>
                      <p className="text-sm text-muted-foreground">ابدأ في توليد أسئلة اختبار جديد</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors">
              <Link to="/teacher/exams">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">اختباراتي السابقة</h3>
                      <p className="text-sm text-muted-foreground">عرض وتصدير الاختبارات السابقة</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}