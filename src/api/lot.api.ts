import { apiClient } from './axios';
import { ApiResponse, LotDto } from '../types';

export const lotApi = {
  async getAllByFarm(farmId: string): Promise<LotDto[]> {
    const response = await apiClient.get<ApiResponse<LotDto[]>>('/api/lots', {
      params: { farmId },
    });
    return response.data.data;
  },
};