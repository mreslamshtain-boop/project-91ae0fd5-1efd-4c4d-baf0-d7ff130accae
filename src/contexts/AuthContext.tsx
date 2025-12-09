import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'ADMIN' | 'TEACHER';

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: AppRole;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('exam_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('exam_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Call the database function to verify login
      const { data, error } = await supabase.rpc('verify_user_login', {
        p_phone: phone,
        p_password: password
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
      }

      if (!data || data.length === 0) {
        return { success: false, error: 'بيانات تسجيل الدخول غير صحيحة' };
      }

      const result = data[0];

      if (!result.is_valid) {
        // Check if user exists but inactive
        const { data: userData } = await supabase
          .from('users')
          .select('is_active')
          .eq('phone', phone)
          .single();

        if (userData && !userData.is_active) {
          return { success: false, error: 'الحساب غير مفعل' };
        }
        return { success: false, error: 'بيانات تسجيل الدخول غير صحيحة' };
      }

      const loggedInUser: User = {
        id: result.user_id,
        phone: phone,
        name: result.user_name,
        role: result.user_role as AppRole,
        isActive: true
      };

      setUser(loggedInUser);
      localStorage.setItem('exam_user', JSON.stringify(loggedInUser));

      return { success: true };
    } catch (e) {
      console.error('Login exception:', e);
      return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('exam_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}