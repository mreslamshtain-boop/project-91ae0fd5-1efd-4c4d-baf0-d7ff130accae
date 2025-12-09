-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'TEACHER');

-- Create users table for authentication
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role app_role NOT NULL DEFAULT 'TEACHER',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to verify password
CREATE OR REPLACE FUNCTION public.verify_user_login(p_phone TEXT, p_password TEXT)
RETURNS TABLE(user_id UUID, user_name TEXT, user_role app_role, is_valid BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.role,
    (u.password_hash = extensions.crypt(p_password, u.password_hash) AND u.is_active = true) as is_valid
  FROM public.users u
  WHERE u.phone = p_phone;
END;
$$;

-- Function to create user with hashed password
CREATE OR REPLACE FUNCTION public.create_user_with_password(
  p_phone TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role app_role
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Function to update password
CREATE OR REPLACE FUNCTION public.update_user_password(p_user_id UUID, p_new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users
  SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

-- RLS Policies for users table
CREATE POLICY "Allow public select on users for login" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow insert on users via function" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on users" ON public.users FOR UPDATE USING (true);

-- RLS Policies for user_roles
CREATE POLICY "Allow select on user_roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Allow insert on user_roles" ON public.user_roles FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the two admin users
SELECT public.create_user_with_password('01116009666', 'Eslam2001', 'إسلام فارس', 'ADMIN');
SELECT public.create_user_with_password('01553522813', 'Amer2002', 'أمير حسين', 'ADMIN');