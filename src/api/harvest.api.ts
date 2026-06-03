import { apiClient } from './axios';
import { ApiResponse, Harvest, Vehicle } from '../types';

export const harvestApi = {
  async getAll(): Promise<Harvest[]> {
    const response = await apiClient.get<ApiResponse<Harvest[]>>('/api/harvests');
    return response.data.data;
  },

  async getById(id: string): Promise<Harvest> {
    const response = await apiClient.get<ApiResponse<Harvest>>(`/api/harvests/${id}`);
    return response.data.data;
  },

  async create(harvest: Omit<Harvest, 'id'>): Promise<Harvest> {
    const response = await apiClient.post<ApiResponse<Harvest>>('/api/harvests', harvest);
    return response.data.data;
  },

  async update(id: string, harvest: Partial<Harvest>): Promise<Harvest> {
    const response = await apiClient.put<ApiResponse<Harvest>>(`/api/harvests/${id}`, harvest);
    return response.data.data;
  },

  async delete(id: string): Promise<{ id: string; deleted: boolean }> {
    const response = await apiClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(`/api/harvests/${id}`);
    return response.data.data;
  },

  async getVehicles(): Promise<Vehicle[]> {
    // Read local vehicles directly or simulate
    const response = localStorage.getItem('agro_vehicles');
    if (response) {
      return JSON.parse(response);
    }
    return [];
  }
};
