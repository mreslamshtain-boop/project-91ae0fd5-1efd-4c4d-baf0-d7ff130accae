-- =====================================================
-- دوال قاعدة البيانات (Database Functions)
-- Database Backup - Created: 2026-01-07
-- =====================================================

-- =====================================================
-- دالة إنشاء مستخدم جديد مع كلمة مرور مشفرة
-- Function: Create User with Encrypted Password
-- =====================================================
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
    -- إنشاء المستخدم مع تشفير كلمة المرور
    INSERT INTO public.users (phone, password_hash, name, role)
    VALUES (p_phone, extensions.crypt(p_password, extensions.gen_salt('bf')), p_name, p_role)
    RETURNING id INTO new_user_id;
    
    -- إضافة الدور للمستخدم في جدول الأدوار
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, p_role);
    
    RETURN new_user_id;
END;
$$;

-- =====================================================
-- دالة التحقق من وجود دور للمستخدم
-- Function: Check if User Has Role
-- =====================================================
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

-- =====================================================
-- دالة تحديث عمود updated_at تلقائياً
-- Function: Auto-update updated_at Column
-- =====================================================
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

-- =====================================================
-- دالة تحديث كلمة مرور المستخدم
-- Function: Update User Password
-- =====================================================
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

-- =====================================================
-- دالة التحقق من تسجيل دخول المستخدم
-- Function: Verify User Login
-- =====================================================
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
