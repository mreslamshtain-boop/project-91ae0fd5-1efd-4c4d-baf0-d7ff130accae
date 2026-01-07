-- =====================================================
-- الفهارس (Database Indexes)
-- Database Backup - Created: 2026-01-07
-- =====================================================

-- =====================================================
-- فهارس جدول الاختبارات (Exams Indexes)
-- =====================================================
-- Primary Key Index (تلقائي)
-- CREATE UNIQUE INDEX exams_pkey ON public.exams USING btree (id);

-- =====================================================
-- فهارس جدول الأسئلة (Questions Indexes)
-- =====================================================
-- Primary Key Index (تلقائي)
-- CREATE UNIQUE INDEX questions_pkey ON public.questions USING btree (id);

-- فهرس للبحث بواسطة exam_id
CREATE INDEX idx_questions_exam_id ON public.questions USING btree (exam_id);

-- فهرس مركب للبحث بواسطة exam_id و index
CREATE INDEX idx_questions_index ON public.questions USING btree (exam_id, index);

-- =====================================================
-- فهارس جدول المستخدمين (Users Indexes)
-- =====================================================
-- Primary Key Index (تلقائي)
-- CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

-- فهرس فريد لرقم الهاتف
-- CREATE UNIQUE INDEX users_phone_key ON public.users USING btree (phone);

-- =====================================================
-- فهارس جدول أدوار المستخدمين (User Roles Indexes)
-- =====================================================
-- Primary Key Index (تلقائي)
-- CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

-- فهرس فريد مركب للمستخدم والدور
-- CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);
