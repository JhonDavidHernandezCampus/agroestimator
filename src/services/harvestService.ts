import { apiClient } from '../api/axios';
import { ApiResponse, CreateHarvestRequest, Harvest, HarvestFilters, UpdateHarvestRequest } from '../types';

export const harvestService = {
  async getAll(filters: HarvestFilters = {}): Promise<Harvest[]> {
    const response = await apiClient.get<ApiResponse<Harvest[]>>('/api/harvests', {
      params: filters,
    });
    return response.data.data;
  },

  async getById(id: string): Promise<Harvest> {
    const response = await apiClient.get<ApiResponse<Harvest>>(`/api/harvests/${id}`);
    return response.data.data;
  },

  async create(payload: CreateHarvestRequest): Promise<Harvest> {
    const response = await apiClient.post<ApiResponse<Harvest>>('/api/harvests', payload);
    return response.data.data;
  },

  async update(id: string, payload: UpdateHarvestRequest): Promise<Harvest> {
    const response = await apiClient.put<ApiResponse<Harvest>>(`/api/harvests/${id}`, payload);
    return response.data.data;
  },

  async delete(id: string): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<boolean>>(`/api/harvests/${id}`);
    return response.data.data;
  },
};