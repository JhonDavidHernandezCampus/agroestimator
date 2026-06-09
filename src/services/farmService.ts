import { apiClient } from '../api/axios';
import { ApiResponse, FarmDto, FarmMutationRequest, FarmStatisticsDto } from '../types';

export const farmService = {
  async getAll(): Promise<FarmDto[]> {
    const response = await apiClient.get<ApiResponse<FarmDto[]>>('/api/farms');
    return response.data.data;
  },

  async getById(id: string): Promise<FarmDto> {
    const response = await apiClient.get<ApiResponse<FarmDto>>(`/api/farms/${id}`);
    return response.data.data;
  },

  async getStatistics(id: string): Promise<FarmStatisticsDto> {
    const response = await apiClient.get<ApiResponse<FarmStatisticsDto>>(`/api/farms/${id}/statistics`);
    return response.data.data;
  },

  async create(payload: FarmMutationRequest): Promise<FarmDto> {
    const response = await apiClient.post<ApiResponse<FarmDto>>('/api/farms', payload);
    return response.data.data;
  },

  async update(id: string, payload: FarmMutationRequest): Promise<FarmDto> {
    const response = await apiClient.put<ApiResponse<FarmDto>>(`/api/farms/${id}`, payload);
    return response.data.data;
  },

  async delete(id: string): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<boolean>>(`/api/farms/${id}`);
    return response.data.data;
  },
};