// FIX: Use same-origin API in production unless explicit VITE_API_URL is provided.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText, details: null }));
    const message = error.message || 'API request failed';
    const details = error.details ? ` (${JSON.stringify(error.details)})` : '';
    throw new APIError(response.status, `${message}${details}`);
  }

  return response.json();
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
