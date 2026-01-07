-- =====================================================
-- هيكل قاعدة البيانات (Database Schema)
-- Database Backup - Created: 2026-01-07
-- =====================================================

-- =====================================================
-- جدول الاختبارات (Exams Table)
-- =====================================================
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

-- تفعيل أمان صف البيانات
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- جدول الأسئلة (Questions Table)
-- =====================================================
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

-- تفعيل أمان صف البيانات
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- جدول المستخدمين (Users Table)
-- =====================================================
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

-- تفعيل أمان صف البيانات
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- جدول أدوار المستخدمين (User Roles Table)
-- =====================================================
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- تفعيل أمان صف البيانات
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
