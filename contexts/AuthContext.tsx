import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, APIError } from '../systems/api';
import { AUTH_TOKEN_KEY, IS_DEV } from '../src/config';

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
  signIn: (email: string, password: string) => Promise<string>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const JWT_PATTERN = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;

function logDebug(message: string, payload?: unknown) {
  if (IS_DEV) {
    if (payload !== undefined) {
      console.log(message, payload);
    } else {
      console.log(message);
    }
  }
}

function clearStoredToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem('token');
}

function getStoredToken() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('token');
  if (!token) return null;

  if (!JWT_PATTERN.test(token)) {
    clearStoredToken();
    return null;
  }

  return token;
}

function normalizeRole(role: unknown): Role {
  const value = String(role || '').trim().toLowerCase();
  if (value === 'platform_admin' || value === 'hr' || value === 'employee') {
    return value;
  }
  return 'employee';
}

function getHomeRouteByRole(role: unknown): string {
  const normalized = normalizeRole(role);
  if (normalized === 'platform_admin') return '/admin';
  if (normalized === 'hr') return '/hr';
  return '/employee';
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const init = async () => {
      logDebug('[Auth] Initializing session...');
      setLoading(true);
      setProfileError(null);

      // Set timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (mounted) {
          logDebug('[Auth] Initialization timed out, forcing loading=false');
          setLoading(false);
        }
      }, 5000);

      try {
        const token = getStoredToken();
        if (token) {
          logDebug('[Auth] Token found, loading profile...');
          if (mounted) {
            await loadProfile();
          }
        } else {
          logDebug('[Auth] No token found');
          if (mounted) {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('[Auth] Initialization error:', err);
        if (mounted) {
          setLoading(false);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const loadProfile = async () => {
    try {
      // FIX: Use dedicated auth endpoint for session validation.
      const meResponse = await api.authMe();
      const profileData = meResponse?.user;
      
      if (!profileData) {
        logDebug('[Auth] No profile data returned');
        await signOut();
        setProfileError(new Error("Profile not found"));
        setLoading(false);
        return;
      }

      const role = normalizeRole(profileData.role);
      setUser({ email: profileData.email, id: profileData.id, role });
      setProfile({
        ...profileData,
        role,
        assignedCourses: profileData.assignedCourses || profileData.assigned_courses || []
      });
      setLoading(false);
      return getHomeRouteByRole(role);
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
        // Keep backward compatibility with existing key, plus common "token" key.
        localStorage.setItem(AUTH_TOKEN_KEY, response.token);
        localStorage.setItem('token', response.token);

        // Immediate auth state hydration avoids redirect lag/flicker.
        const loginRole = normalizeRole(response?.user?.role || response?.profile?.role);
        const loginId = String(response?.user?.userId || response?.profile?.id || '');
        if (loginId) {
          setUser({
            id: loginId,
            email,
            role: loginRole,
          });
          setProfile((prev) => ({
            ...(prev || {}),
            ...(response?.profile || {}),
            id: response?.profile?.id || loginId,
            email: response?.profile?.email || email,
            role: loginRole,
            assignedCourses:
              response?.profile?.assignedCourses ||
              response?.profile?.assigned_courses ||
              [],
          } as Profile));
        }

        try {
          return await loadProfile();
        } catch {
          const fallbackDestination = getHomeRouteByRole(loginRole);
          setLoading(false);
          return fallbackDestination;
        }
      } else {
        throw new Error('No token received');
      }
    } catch (error: any) {
      setLoading(false);
      if (error instanceof APIError) {
        if (error.status === 401) {
          throw new Error('Invalid email or password');
        }
        if (error.status === 0) {
          throw new Error(error.message);
        }
      }
      throw error;
    }
  };

  const signOut = async () => {
    clearStoredToken();
    setUser(null);
    setProfile(null);
    setProfileError(null);
    setLoading(false);
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
