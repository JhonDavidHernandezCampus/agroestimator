import { apiClient } from './axios';
import { ApiResponse, Harvest } from '../types';

export interface CreateHarvestRequest {
  date: string;
  farmName: string;
  lot: string;
  product: string;
  vehicle: string;
  quantity: number;
  samples: Harvest['samples'];
  pricePerKg?: number | null;
  deviceId?: string | null;
  harvestId?: string | null;
}

export interface UpdateHarvestRequest {
  lot?: string;
  quantity?: number;
  samples?: Harvest['samples'];
  pricePerKg?: number | null;
}

export const harvestApi = {
  async getAll(): Promise<Harvest[]> {
    const response = await apiClient.get<ApiResponse<Harvest[]>>('/api/harvests');
    return response.data.data;
  },

  async getById(id: string): Promise<Harvest> {
    const response = await apiClient.get<ApiResponse<Harvest>>(`/api/harvests/${id}`);
    return response.data.data;
  },

  async create(harvest: CreateHarvestRequest): Promise<Harvest> {
    const response = await apiClient.post<ApiResponse<Harvest>>('/api/harvests', harvest);
    return response.data.data;
  },

  async update(id: string, harvest: UpdateHarvestRequest): Promise<Harvest> {
    const response = await apiClient.put<ApiResponse<Harvest>>(`/api/harvests/${id}`, harvest);
    return response.data.data;
  },

  async delete(id: string): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<boolean>>(`/api/harvests/${id}`);
    return response.data.data;
  },
};
