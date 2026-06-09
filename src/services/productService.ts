import { apiClient } from '../api/axios';
import { ApiResponse, ProductDto, ProductMutationRequest } from '../types';

export const productService = {
  async getAll(): Promise<ProductDto[]> {
    const response = await apiClient.get<ApiResponse<ProductDto[]>>('/api/products');
    return response.data.data;
  },

  async getById(id: string): Promise<ProductDto> {
    const response = await apiClient.get<ApiResponse<ProductDto>>(`/api/products/${id}`);
    return response.data.data;
  },

  async create(payload: ProductMutationRequest): Promise<ProductDto> {
    const response = await apiClient.post<ApiResponse<ProductDto>>('/api/products', payload);
    return response.data.data;
  },

  async update(id: string, payload: ProductMutationRequest): Promise<ProductDto> {
    const response = await apiClient.put<ApiResponse<ProductDto>>(`/api/products/${id}`, {
      id,
      ...payload,
    });
    return response.data.data;
  },

  async delete(id: string): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<boolean>>(`/api/products/${id}`);
    return response.data.data;
  },
};