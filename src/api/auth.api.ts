import {
  apiClient,
  clearStoredAuthSession,
  getStoredAuthSession,
  setStoredAuthSession,
} from './axios';
import { ApiResponse, AuthResponse, StoredAuthSession, UserProfileDto } from '../types';

export const authApi = {
  async login(emailString: string, passwordString: string): Promise<StoredAuthSession> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/api/auth/login', {
      email: emailString,
      password: passwordString,
    });

    const auth = response.data.data;
    const profile = await authApi.getProfile().catch(() => null);
    const session = { auth, profile };

    setStoredAuthSession(session);
    return session;
  },

  async logout(): Promise<void> {
    const refreshToken = getStoredAuthSession()?.auth.refreshToken;

    try {
      await apiClient.post<ApiResponse<boolean>>('/api/auth/logout', {
        refreshToken,
      });
    } finally {
      clearStoredAuthSession();
    }
  },

  async getProfile(): Promise<UserProfileDto> {
    const response = await apiClient.get<ApiResponse<UserProfileDto>>('/api/auth/profile');
    return response.data.data;
  },

  async restoreSession(): Promise<StoredAuthSession | null> {
    const currentSession = getStoredAuthSession();
    if (!currentSession?.auth.token) {
      return null;
    }

    try {
      const profile = await authApi.getProfile();
      const restoredSession = { ...currentSession, profile };
      setStoredAuthSession(restoredSession);
      return restoredSession;
    } catch {
      clearStoredAuthSession();
      return null;
    }
  },
};
