import { apiClient } from '../api/axios';
import {
  ApiResponse,
  DashboardSummaryDto,
  FarmStatsDto,
  MonthlyProductionDto,
  ProductStatsDto,
  Statistics,
  TrendDto,
} from '../types';

export const statisticsService = {
  async getStats(): Promise<Statistics> {
    const response = await apiClient.get<ApiResponse<Statistics>>('/api/statistics');
    return response.data.data;
  },

  async getSummary(): Promise<DashboardSummaryDto> {
    const response = await apiClient.get<ApiResponse<DashboardSummaryDto>>('/api/statistics/summary');
    return response.data.data;
  },

  async getMonthly(): Promise<MonthlyProductionDto[]> {
    const response = await apiClient.get<ApiResponse<MonthlyProductionDto[]>>('/api/statistics/monthly');
    return response.data.data;
  },

  async getFarms(): Promise<FarmStatsDto[]> {
    const response = await apiClient.get<ApiResponse<FarmStatsDto[]>>('/api/statistics/farms');
    return response.data.data;
  },

  async getProducts(): Promise<ProductStatsDto[]> {
    const response = await apiClient.get<ApiResponse<ProductStatsDto[]>>('/api/statistics/products');
    return response.data.data;
  },

  async getTrends(): Promise<TrendDto[]> {
    const response = await apiClient.get<ApiResponse<TrendDto[]>>('/api/statistics/trends');
    return response.data.data;
  },
};