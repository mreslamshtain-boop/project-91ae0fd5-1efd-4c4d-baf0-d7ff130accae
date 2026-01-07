-- =====================================================
-- النسخة الاحتياطية الكاملة لقاعدة البيانات
-- Complete Database Backup
-- Created: 2026-01-07
-- =====================================================

-- =====================================================
-- 1. أنواع البيانات المخصصة (Custom Enums)
-- =====================================================

-- نوع الأدوار في التطبيق
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'TEACHER');

-- =====================================================
-- 2. هيكل قاعدة البيانات (Database Schema)
-- =====================================================

-- جدول الاختبارات (Exams Table)
CREATE TABLE public.exams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    grade TEXT,
    duration_minutes INTEGER DEFAULT 60,
    passing_percent INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- جدول الأسئلة (Questions Table)
CREATE TABLE public.questions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID NOT NULL,
    index INTEGER NOT NULL,
    text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    mark INTEGER NOT NULL DEFAULT 1,
    image_url TEXT,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- جدول المستخدمين (Users Table)
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    role public.app_role NOT NULL DEFAULT 'TEACHER'::public.app_role,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- جدول أدوار المستخدمين (User Roles Table)
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. الفهارس (Database Indexes)
-- =====================================================

-- فهرس للبحث بواسطة exam_id
CREATE INDEX idx_questions_exam_id ON public.questions USING btree (exam_id);

-- فهرس مركب للبحث بواسطة exam_id و index
CREATE INDEX idx_questions_index ON public.questions USING btree (exam_id, index);

-- =====================================================
-- 4. دوال قاعدة البيانات (Database Functions)
-- =====================================================

-- دالة إنشاء مستخدم جديد مع كلمة مرور مشفرة
CREATE OR REPLACE FUNCTION public.create_user_with_password(
    p_phone TEXT,
    p_password TEXT,
    p_name TEXT,
    p_role public.app_role
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    new_user_id UUID;
BEGIN
    INSERT INTO public.users (phone, password_hash, name, role)
    VALUES (p_phone, extensions.crypt(p_password, extensions.gen_salt('bf')), p_name, p_role)
    RETURNING id INTO new_user_id;
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, p_role);
    
    RETURN new_user_id;
END;
$$;

-- دالة التحقق من وجود دور للمستخدم
CREATE OR REPLACE FUNCTION public.has_role(
    _user_id UUID,
    _role public.app_role
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- دالة تحديث عمود updated_at تلقائياً
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- دالة تحديث كلمة مرور المستخدم
CREATE OR REPLACE FUNCTION public.update_user_password(
    p_user_id UUID,
    p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.users
    SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
        updated_at = now()
    WHERE id = p_user_id;
    RETURN FOUND;
END;
$$;

-- دالة التحقق من تسجيل دخول المستخدم
CREATE OR REPLACE FUNCTION public.verify_user_login(
    p_phone TEXT,
    p_password TEXT
)
RETURNS TABLE(
    user_id UUID,
    user_name TEXT,
    user_role public.app_role,
    is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.role,
        (u.password_hash = extensions.crypt(p_password, u.password_hash) AND u.is_active = true) AS is_valid
    FROM public.users u
    WHERE u.phone = p_phone;
END;
$$;

-- =====================================================
-- 5. سياسات أمان صف البيانات (RLS Policies)
-- =====================================================

-- سياسات جدول الاختبارات
CREATE POLICY "Allow public read access on exams" ON public.exams FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on exams" ON public.exams FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on exams" ON public.exams FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on exams" ON public.exams FOR DELETE TO public USING (true);

-- سياسات جدول الأسئلة
CREATE POLICY "Allow public read access on questions" ON public.questions FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on questions" ON public.questions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on questions" ON public.questions FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on questions" ON public.questions FOR DELETE TO public USING (true);

-- سياسات جدول المستخدمين
CREATE POLICY "Allow public select on users for login" ON public.users FOR SELECT TO public USING (true);
CREATE POLICY "Allow insert on users via function" ON public.users FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow update on users" ON public.users FOR UPDATE TO public USING (true);

-- سياسات جدول أدوار المستخدمين
CREATE POLICY "Allow select on user_roles" ON public.user_roles FOR SELECT TO public USING (true);
CREATE POLICY "Allow insert on user_roles" ON public.user_roles FOR INSERT TO public WITH CHECK (true);

-- =====================================================
-- 6. إعدادات التخزين (Storage Configuration)
-- =====================================================

-- bucket لصور الأسئلة
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('question-images', 'question-images', true, NULL, NULL);

-- سياسات التخزين
CREATE POLICY "Allow public read access on question images"
ON storage.objects FOR SELECT TO public USING (bucket_id = 'question-images');

CREATE POLICY "Allow public upload to question images"
ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'question-images');

-- =====================================================
-- انتهت النسخة الاحتياطية
-- End of Backup
-- =====================================================
