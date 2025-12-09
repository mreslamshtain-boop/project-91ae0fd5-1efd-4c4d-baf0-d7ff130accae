import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, LogOut, UserPlus, RefreshCw, Shield, Users, FileText } from 'lucide-react';
import { z } from 'zod';
import { Link } from 'react-router-dom';

interface Teacher {
  id: string;
  name: string | null;
  phone: string;
  is_active: boolean;
  created_at: string;
}

const createTeacherSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  phone: z.string().min(10, 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

export default function Admin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ phone: string; password: string } | null>(null);
  
  // Form state
  const [newTeacher, setNewTeacher] = useState({ name: '', phone: '', password: '' });
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; password?: string }>({});

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (!authLoading && user && user.role !== 'ADMIN') {
      navigate('/teacher');
    }
  }, [user, authLoading, navigate]);

  // Fetch teachers
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchTeachers();
    }
  }, [user]);

  const fetchTeachers = async () => {
    setIsLoadingTeachers(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, phone, is_active, created_at')
        .eq('role', 'TEACHER')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل قائمة المعلمين',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = createTeacherSchema.safeParse(newTeacher);
    if (!result.success) {
      const fieldErrors: { name?: string; phone?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'name') fieldErrors.name = err.message;
        if (err.path[0] === 'phone') fieldErrors.phone = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setFormErrors(fieldErrors);
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.rpc('create_user_with_password', {
        p_phone: newTeacher.phone,
        p_password: newTeacher.password,
        p_name: newTeacher.name,
        p_role: 'TEACHER'
      });

      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          toast({
            title: 'خطأ',
            description: 'رقم الهاتف مسجل مسبقاً',
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء حساب المعلم بنجاح',
      });

      setCreatedCredentials({ phone: newTeacher.phone, password: newTeacher.password });
      setNewTeacher({ name: '', phone: '', password: '' });
      fetchTeachers();
    } catch (error) {
      console.error('Error creating teacher:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء حساب المعلم',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (teacherId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', teacherId);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: currentStatus ? 'تم إلغاء تفعيل الحساب' : 'تم تفعيل الحساب',
      });

      fetchTeachers();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تغيير حالة الحساب',
        variant: 'destructive',
      });
    }
  };

  const handleResetPassword = async (teacherId: string, teacherPhone: string) => {
    const newPassword = prompt('أدخل كلمة المرور الجديدة:');
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: 'خطأ',
        description: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.rpc('update_user_password', {
        p_user_id: teacherId,
        p_new_password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: `تم تغيير كلمة المرور للمعلم ${teacherPhone}`,
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تغيير كلمة المرور',
        variant: 'destructive',
      });
    }
  };

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
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">لوحة تحكم الإدارة</h1>
              <p className="text-sm text-muted-foreground">مرحباً، {user.name || 'مدير'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/">
                <FileText className="w-4 h-4 ml-2" />
                مولّد الاختبارات
              </Link>
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teachers.length}</p>
                  <p className="text-sm text-muted-foreground">إجمالي المعلمين</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teachers.filter(t => t.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">معلمين نشطين</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teachers.filter(t => !t.is_active).length}</p>
                  <p className="text-sm text-muted-foreground">معلمين غير نشطين</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teachers Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>إدارة المعلمين</CardTitle>
                <CardDescription>إنشاء وإدارة حسابات المعلمين</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) setCreatedCredentials(null);
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 ml-2" />
                    إنشاء حساب معلم جديد
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>إنشاء حساب معلم جديد</DialogTitle>
                    <DialogDescription>
                      أدخل بيانات المعلم الجديد
                    </DialogDescription>
                  </DialogHeader>
                  
                  {createdCredentials ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="font-semibold text-green-800 dark:text-green-200 mb-2">تم إنشاء الحساب بنجاح!</p>
                        <p className="text-sm text-green-700 dark:text-green-300">بيانات تسجيل الدخول:</p>
                        <div className="mt-2 bg-background rounded p-2 text-sm">
                          <p><span className="font-medium">رقم الهاتف:</span> {createdCredentials.phone}</p>
                          <p><span className="font-medium">كلمة المرور:</span> {createdCredentials.password}</p>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          احفظ هذه البيانات وشاركها مع المعلم
                        </p>
                      </div>
                      <Button onClick={() => {
                        setDialogOpen(false);
                        setCreatedCredentials(null);
                      }} className="w-full">
                        إغلاق
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateTeacher} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="teacherName">اسم المعلم</Label>
                        <Input
                          id="teacherName"
                          value={newTeacher.name}
                          onChange={(e) => setNewTeacher(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="أدخل اسم المعلم"
                        />
                        {formErrors.name && (
                          <p className="text-sm text-destructive">{formErrors.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="teacherPhone">رقم الهاتف</Label>
                        <Input
                          id="teacherPhone"
                          type="tel"
                          value={newTeacher.phone}
                          onChange={(e) => setNewTeacher(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="أدخل رقم الهاتف"
                          dir="ltr"
                        />
                        {formErrors.phone && (
                          <p className="text-sm text-destructive">{formErrors.phone}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="teacherPassword">كلمة المرور</Label>
                        <Input
                          id="teacherPassword"
                          type="text"
                          value={newTeacher.password}
                          onChange={(e) => setNewTeacher(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="أدخل كلمة المرور"
                        />
                        {formErrors.password && (
                          <p className="text-sm text-destructive">{formErrors.password}</p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={isCreating}>
                        {isCreating ? (
                          <>
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            جاري الإنشاء...
                          </>
                        ) : (
                          'إنشاء الحساب'
                        )}
                      </Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTeachers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا يوجد معلمين حتى الآن
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">رقم الهاتف</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>{teacher.name || '-'}</TableCell>
                      <TableCell dir="ltr" className="text-right">{teacher.phone}</TableCell>
                      <TableCell>
                        <Badge variant={teacher.is_active ? 'default' : 'destructive'}>
                          {teacher.is_active ? 'نشط' : 'غير نشط'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(teacher.created_at).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(teacher.id, teacher.is_active)}
                          >
                            {teacher.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(teacher.id, teacher.phone)}
                          >
                            <RefreshCw className="w-4 h-4 ml-1" />
                            كلمة المرور
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}