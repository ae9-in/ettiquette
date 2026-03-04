const rawApiUrl = (import.meta.env.VITE_API_URL || '/api').trim();

function normalizeApiBase(value: string) {
  if (!value) return '/api';

  // Avoid production misconfiguration like VITE_API_URL=http://localhost:3001/api.
  if (!import.meta.env.DEV) {
    try {
      const parsed = new URL(value);
      const isLocalHost =
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname === '0.0.0.0';
      if (isLocalHost) {
        return '/api';
      }
    } catch {
      // Ignore parse errors for relative paths.
    }
  }

  const normalized = value.endsWith('/') ? value.slice(0, -1) : value;
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export const API_BASE = normalizeApiBase(rawApiUrl);
export const AUTH_TOKEN_KEY = 'auth_token';
export const IS_DEV = import.meta.env.DEV;
