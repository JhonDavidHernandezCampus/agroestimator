import { apiClient } from './axios';
import { ApiResponse, Statistics } from '../types';

export const statisticsApi = {
  async getStats(): Promise<Statistics> {
    const response = await apiClient.get<ApiResponse<Statistics>>('/api/statistics');
    return response.data.data;
  },
};
