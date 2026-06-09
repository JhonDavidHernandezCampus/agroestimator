import { apiClient } from '../api/axios';
import { ApiResponse, LotDto, LotMutationRequest } from '../types';

export const lotService = {
  async getAll(farmId: string): Promise<LotDto[]> {
    const response = await apiClient.get<ApiResponse<LotDto[]>>('/api/lots', {
      params: { farmId },
    });
    return response.data.data;
  },

  async getById(id: string): Promise<LotDto> {
    const response = await apiClient.get<ApiResponse<LotDto>>(`/api/lots/${id}`);
    return response.data.data;
  },

  async create(payload: LotMutationRequest): Promise<LotDto> {
    const response = await apiClient.post<ApiResponse<LotDto>>('/api/lots', payload);
    return response.data.data;
  },

  async update(id: string, payload: Omit<LotMutationRequest, 'farmId'>): Promise<LotDto> {
    const response = await apiClient.put<ApiResponse<LotDto>>(`/api/lots/${id}`, {
      id,
      ...payload,
    });
    return response.data.data;
  },

  async delete(id: string): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<boolean>>(`/api/lots/${id}`);
    return response.data.data;
  },
};