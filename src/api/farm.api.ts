import { apiClient } from './axios';
import { ApiResponse, FarmDto } from '../types';

export const farmApi = {
  async getAll(): Promise<FarmDto[]> {
    const response = await apiClient.get<ApiResponse<FarmDto[]>>('/api/farms');
    return response.data.data;
  },
};