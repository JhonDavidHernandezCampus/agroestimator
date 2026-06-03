import { apiClient } from './axios';
import { ApiResponse, User } from '../types';

export const authApi = {
  async login(emailString: string, passwordString: string): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>('/api/auth/login', {
      email: emailString,
      password: passwordString,
    });
    return response.data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post<ApiResponse<{ loggedOut: boolean }>>('/api/auth/logout');
  },
};
