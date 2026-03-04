import { API_BASE, AUTH_TOKEN_KEY, IS_DEV } from '../src/config';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem('token');
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 15000);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    if (IS_DEV) {
      console.log(`[API] ${options.method || 'GET'} ${API_BASE}${endpoint} -> ${response.status}`);
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: response.statusText, error: null }));
      const message = error.message || 'API request failed';
      const details = error.error ? ` (${JSON.stringify(error.error)})` : '';
      throw new APIError(response.status, `${message}${details}`);
    }

    return response.json();
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new APIError(504, 'Request timed out');
    }
    if (error instanceof APIError) {
      throw error;
    }
    if (error instanceof TypeError || String(error?.message || '').includes('Failed to fetch')) {
      throw new APIError(
        0,
        'Unable to reach the authentication service. Check network/adblock and try again.'
      );
    }
    throw new APIError(500, error?.message || 'Network error');
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData: any) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  authMe: () => fetchAPI('/auth/me'),

  // Profiles
  getProfile: () => fetchAPI('/profiles/me'),
  
  getProfiles: () => fetchAPI('/profiles'),
  
  updateProfile: (id: string, data: any) =>
    fetchAPI(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProfile: (id: string) =>
    fetchAPI(`/profiles/${id}`, {
      method: 'DELETE',
    }),

  // Users
  createUser: (userData: any) =>
    fetchAPI('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  updateUser: (id: string, data: any) =>
    fetchAPI(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteUser: (id: string) =>
    fetchAPI(`/users/${id}`, {
      method: 'DELETE',
    }),

  // Progress
  updateModuleProgress: (courseId: string, moduleId: string) =>
    fetchAPI('/progress/module', {
      method: 'POST',
      body: JSON.stringify({ courseId, moduleId }),
    }),

  submitCourseCompletion: (courseId: string, score: number) =>
    fetchAPI('/progress/complete', {
      method: 'POST',
      body: JSON.stringify({ courseId, score }),
    }),

  // XP
  updateXP: (xp: number) =>
    fetchAPI('/xp', {
      method: 'POST',
      body: JSON.stringify({ xp }),
    }),
};
