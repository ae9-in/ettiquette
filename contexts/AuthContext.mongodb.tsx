import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, APIError } from '../systems/api';

type Role = 'hr' | 'employee' | 'platform_admin';

type Profile = {
  id: string;
  role: Role;
  company_id?: string;
  email?: string;
  name?: string;
  department?: string;
  avatar?: string;
  progress?: Record<string, any>;
  assigned_courses?: string[];
  assignedCourses?: string[];
  xp?: number;
};

type AuthContextType = {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  profileError: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      console.log('[Auth] Initializing session...');
      setLoading(true);
      setProfileError(null);

      const timeoutId = setTimeout(() => {
        if (mounted && loading) {
          console.warn('[Auth] Initialization timed out, forcing loading=false');
          setLoading(false);
        }
      }, 5000);

      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          console.log('[Auth] Token found, loading profile...');
          if (mounted) await loadProfile();
        } else {
          console.log('[Auth] No token found');
          if (mounted) setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Initialization error:', err);
        if (mounted) setLoading(false);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await api.getProfile();
      
      if (!profileData) {
        console.warn('[Auth] No profile data returned');
        await signOut();
        setProfileError(new Error("Profile not found"));
        setLoading(false);
        return;
      }

      setUser({ email: profileData.email, id: profileData.id });
      setProfile({
        ...profileData,
        assignedCourses: profileData.assignedCourses || profileData.assigned_courses || []
      });
      setLoading(false);
    } catch (err: any) {
      console.error('[Auth] Profile load error:', err);
      if (err instanceof APIError && (err.status === 401 || err.status === 403)) {
        await signOut();
      }
      setProfileError(err);
      setLoading(false);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setProfileError(null);
    
    try {
      const response = await api.login(email, password);
      
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        await loadProfile();
      } else {
        throw new Error('No token received');
      }
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileError, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
