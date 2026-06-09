import { apiClient } from './axios';
import {
  ApiResponse,
  DashboardSummaryDto,
  ProductStatsDto,
  TrendDto,
} from '../types';

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummaryDto> {
    const response = await apiClient.get<ApiResponse<DashboardSummaryDto>>('/api/statistics/summary');
    return response.data.data;
  },

  async getProductStats(): Promise<ProductStatsDto[]> {
    const response = await apiClient.get<ApiResponse<ProductStatsDto[]>>('/api/statistics/products');
    return response.data.data;
  },

  async getTrends(): Promise<TrendDto[]> {
    const response = await apiClient.get<ApiResponse<TrendDto[]>>('/api/statistics/trends');
    return response.data.data;
  },
};