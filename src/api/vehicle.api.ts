import { apiClient } from './axios';
import { ApiResponse, VehicleDto } from '../types';

export interface VehicleMutationRequest {
  name: string;
  plate: string;
  vehicleType?: string | null;
  capacityKg: number;
  tareWeightKg?: number | null;
  fuelLevel?: number | null;
  nextServiceDate?: string | null;
  status: string;
  maintenanceNotes?: string | null;
}

export const vehicleApi = {
  async getAll(): Promise<VehicleDto[]> {
    const response = await apiClient.get<ApiResponse<VehicleDto[]>>('/api/vehicles');
    return response.data.data;
  },

  async getById(id: string): Promise<VehicleDto> {
    const response = await apiClient.get<ApiResponse<VehicleDto>>(`/api/vehicles/${id}`);
    return response.data.data;
  },

  async create(payload: VehicleMutationRequest): Promise<VehicleDto> {
    const response = await apiClient.post<ApiResponse<VehicleDto>>('/api/vehicles', payload);
    return response.data.data;
  },

  async update(id: string, payload: VehicleMutationRequest): Promise<VehicleDto> {
    const response = await apiClient.put<ApiResponse<VehicleDto>>(`/api/vehicles/${id}`, payload);
    return response.data.data;
  },

  async delete(id: string): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<boolean>>(`/api/vehicles/${id}`);
    return response.data.data;
  },
};