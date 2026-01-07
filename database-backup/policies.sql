-- =====================================================
-- سياسات أمان صف البيانات (RLS Policies)
-- Database Backup - Created: 2026-01-07
-- =====================================================

-- =====================================================
-- سياسات جدول الاختبارات (Exams Policies)
-- =====================================================

-- السماح بقراءة الاختبارات للجميع
CREATE POLICY "Allow public read access on exams"
ON public.exams
FOR SELECT
TO public
USING (true);

-- السماح بإضافة اختبارات للجميع
CREATE POLICY "Allow public insert on exams"
ON public.exams
FOR INSERT
TO public
WITH CHECK (true);

-- السماح بتعديل الاختبارات للجميع
CREATE POLICY "Allow public update on exams"
ON public.exams
FOR UPDATE
TO public
USING (true);

-- السماح بحذف الاختبارات للجميع
CREATE POLICY "Allow public delete on exams"
ON public.exams
FOR DELETE
TO public
USING (true);

-- =====================================================
-- سياسات جدول الأسئلة (Questions Policies)
-- =====================================================

-- السماح بقراءة الأسئلة للجميع
CREATE POLICY "Allow public read access on questions"
ON public.questions
FOR SELECT
TO public
USING (true);

-- السماح بإضافة أسئلة للجميع
CREATE POLICY "Allow public insert on questions"
ON public.questions
FOR INSERT
TO public
WITH CHECK (true);

-- السماح بتعديل الأسئلة للجميع
CREATE POLICY "Allow public update on questions"
ON public.questions
FOR UPDATE
TO public
USING (true);

-- السماح بحذف الأسئلة للجميع
CREATE POLICY "Allow public delete on questions"
ON public.questions
FOR DELETE
TO public
USING (true);

-- =====================================================
-- سياسات جدول المستخدمين (Users Policies)
-- =====================================================

-- السماح بقراءة المستخدمين للجميع (للتحقق من تسجيل الدخول)
CREATE POLICY "Allow public select on users for login"
ON public.users
FOR SELECT
TO public
USING (true);

-- السماح بإضافة مستخدمين عبر الدوال
CREATE POLICY "Allow insert on users via function"
ON public.users
FOR INSERT
TO public
WITH CHECK (true);

-- السماح بتعديل المستخدمين
CREATE POLICY "Allow update on users"
ON public.users
FOR UPDATE
TO public
USING (true);

-- ملاحظة: لا يوجد سياسة DELETE للمستخدمين (ممنوع الحذف)

-- =====================================================
-- سياسات جدول أدوار المستخدمين (User Roles Policies)
-- =====================================================

-- السماح بقراءة الأدوار للجميع
CREATE POLICY "Allow select on user_roles"
ON public.user_roles
FOR SELECT
TO public
USING (true);

-- السماح بإضافة أدوار
CREATE POLICY "Allow insert on user_roles"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (true);

-- ملاحظة: لا يوجد سياسات UPDATE أو DELETE لجدول الأدوار
