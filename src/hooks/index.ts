import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { dashboardApi } from '../api/dashboard.api';
import { farmApi } from '../api/farm.api';
import { harvestApi, CreateHarvestRequest, UpdateHarvestRequest } from '../api/harvest.api';
import { lotApi } from '../api/lot.api';
import { productApi } from '../api/product.api';
import { statisticsApi } from '../api/statistics.api';
import { vehicleApi, VehicleMutationRequest } from '../api/vehicle.api';
import { useAuth } from '../contexts/AuthContext';
import { Harvest } from '../types';

export function useLogin() {
  const { login } = useAuth();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await login(email, password);
    },
  });
}

export function useHarvests() {
  return useQuery({
    queryKey: ['harvests'],
    queryFn: async () => {
      return await harvestApi.getAll();
    },
  });
}

export function useHarvest(id: string) {
  return useQuery({
    queryKey: ['harvest', id],
    queryFn: async () => {
      return await harvestApi.getById(id);
    },
    enabled: !!id,
  });
}

export function useRegisterHarvest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (harvest: CreateHarvestRequest) => {
      return await harvestApi.create(harvest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvests'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-trends'] });
    },
  });
}

export function useUpdateHarvest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, harvest }: { id: string; harvest: UpdateHarvestRequest }) => {
      return await harvestApi.update(id, harvest);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['harvests'] });
      queryClient.invalidateQueries({ queryKey: ['harvest', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-trends'] });
    },
  });
}

export function useDeleteHarvest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await harvestApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvests'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-trends'] });
    },
  });
}

export function useStatistics() {
  return useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      return await statisticsApi.getStats();
    },
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      return await dashboardApi.getSummary();
    },
  });
}

export function useDashboardProductStats() {
  return useQuery({
    queryKey: ['dashboard-products'],
    queryFn: async () => {
      return await dashboardApi.getProductStats();
    },
  });
}

export function useDashboardTrends() {
  return useQuery({
    queryKey: ['dashboard-trends'],
    queryFn: async () => {
      return await dashboardApi.getTrends();
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      return await authApi.getProfile();
    },
  });
}

export function useFarms() {
  return useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      return await farmApi.getAll();
    },
  });
}

export function useLots(farmId?: string) {
  return useQuery({
    queryKey: ['lots', farmId],
    queryFn: async () => {
      return await lotApi.getAllByFarm(farmId as string);
    },
    enabled: !!farmId,
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      return await productApi.getAll();
    },
  });
}

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      return await vehicleApi.getAll();
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: VehicleMutationRequest) => {
      return await vehicleApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: VehicleMutationRequest }) => {
      return await vehicleApi.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await vehicleApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}
