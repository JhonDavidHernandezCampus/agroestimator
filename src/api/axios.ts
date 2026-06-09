import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse, AuthResponse, StoredAuthSession } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL;
const AUTH_STORAGE_KEY = 'agro_auth_session';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export class ApiRequestError extends Error {
  status?: number;
  code?: string;
  isNetworkError: boolean;

  constructor(message: string, status?: number, code?: string, isNetworkError = false) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.isNetworkError = isNetworkError;
  }
}

if (!BASE_URL) {
  throw new Error('Missing VITE_API_URL environment variable.');
}

export function getStoredAuthSession(): StoredAuthSession | null {
  const rawValue = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as StoredAuthSession;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function setStoredAuthSession(session: StoredAuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredAuthSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function getAccessToken(): string | null {
  return getStoredAuthSession()?.auth.token ?? null;
}

function createApiRequestError(error: AxiosError<ApiResponse<unknown>>): ApiRequestError {
  if (error.response) {
    return new ApiRequestError(
      error.response.data?.message || error.message || 'Request failed.',
      error.response.status,
      error.code,
      false
    );
  }

  if (error.request) {
    return new ApiRequestError('No fue posible conectar con la API.', undefined, error.code, true);
  }

  return new ApiRequestError(error.message || 'Unexpected request error.', undefined, error.code, false);
}

function notifyUnauthorized(): void {
  clearStoredAuthSession();
  window.dispatchEvent(new Event('agro:auth-expired'));

  if (window.location.hash !== '#/login') {
    window.location.hash = '#/login';
  }
}

const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const currentSession = getStoredAuthSession();
  if (!currentSession?.auth.refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<ApiResponse<AuthResponse>>('/api/auth/refresh-token', {
        refreshToken: currentSession.auth.refreshToken,
      })
      .then((response) => {
        const nextAuth = response.data.data;
        setStoredAuthSession({
          ...currentSession,
          auth: nextAuth,
        });

        return nextAuth.token;
      })
      .catch(() => {
        notifyUnauthorized();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const config = error.config as RetryableRequestConfig | undefined;
    const requestUrl = config?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/refresh-token') ||
      requestUrl.includes('/api/auth/logout');

    if (
      config &&
      !config._retry &&
      !isAuthEndpoint &&
      (error.response?.status === 401 || error.response?.status === 403)
    ) {
      config._retry = true;

      const nextToken = await refreshAccessToken();
      if (nextToken) {
        config.headers.Authorization = `Bearer ${nextToken}`;
        return apiClient(config);
      }
    }

    if (!isAuthEndpoint && (error.response?.status === 401 || error.response?.status === 403)) {
      notifyUnauthorized();
    }

    return Promise.reject(createApiRequestError(error));
  }
);
