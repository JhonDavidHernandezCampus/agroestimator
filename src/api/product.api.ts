import { apiClient } from './axios';
import { ApiResponse, ProductDto } from '../types';

export const productApi = {
  async getAll(): Promise<ProductDto[]> {
    const response = await apiClient.get<ApiResponse<ProductDto[]>>('/api/products');
    return response.data.data;
  },
};