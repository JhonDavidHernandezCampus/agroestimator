import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { vehicleApi, VehicleMutationRequest } from '../api/vehicle.api';
import { useAuth } from '../contexts/AuthContext';
import {
  CreateHarvestRequest,
  FarmMutationRequest,
  HarvestFilters,
  LotMutationRequest,
  ProductMutationRequest,
  UpdateHarvestRequest,
} from '../types';
import { farmService, harvestService, lotService, productService, statisticsService } from '../services';

function invalidateDashboardQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['statistics'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-monthly'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-farms'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-products'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-trends'] });
}

export function useLogin() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await login(email, password);
    },
  });
}

export function useHarvests(filters: HarvestFilters = {}) {
  return useQuery({
    queryKey: ['harvests', filters],
    queryFn: async () => {
      return await harvestService.getAll(filters);
    },
  });
}

export function useHarvest(id: string) {
  return useQuery({
    queryKey: ['harvest', id],
    queryFn: async () => {
      return await harvestService.getById(id);
    },
    enabled: !!id,
  });
}

export function useRegisterHarvest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (harvest: CreateHarvestRequest) => {
      return await harvestService.create(harvest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvests'] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useUpdateHarvest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, harvest }: { id: string; harvest: UpdateHarvestRequest }) => {
      return await harvestService.update(id, harvest);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['harvests'] });
      queryClient.invalidateQueries({ queryKey: ['harvest', variables.id] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useDeleteHarvest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await harvestService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvests'] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useStatistics() {
  return useQuery({
    queryKey: ['statistics'],
    queryFn: async () => {
      return await statisticsService.getStats();
    },
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      return await statisticsService.getSummary();
    },
  });
}

export function useDashboardMonthly() {
  return useQuery({
    queryKey: ['dashboard-monthly'],
    queryFn: async () => {
      return await statisticsService.getMonthly();
    },
  });
}

export function useDashboardFarmStats() {
  return useQuery({
    queryKey: ['dashboard-farms'],
    queryFn: async () => {
      return await statisticsService.getFarms();
    },
  });
}

export function useDashboardProductStats() {
  return useQuery({
    queryKey: ['dashboard-products'],
    queryFn: async () => {
      return await statisticsService.getProducts();
    },
  });
}

export function useDashboardTrends() {
  return useQuery({
    queryKey: ['dashboard-trends'],
    queryFn: async () => {
      return await statisticsService.getTrends();
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
      return await farmService.getAll();
    },
  });
}

export function useFarm(id: string) {
  return useQuery({
    queryKey: ['farm', id],
    queryFn: async () => {
      return await farmService.getById(id);
    },
    enabled: !!id,
  });
}

export function useFarmStatistics(id: string) {
  return useQuery({
    queryKey: ['farm-statistics', id],
    queryFn: async () => {
      return await farmService.getStatistics(id);
    },
    enabled: !!id,
  });
}

export function useCreateFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: FarmMutationRequest) => {
      return await farmService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useUpdateFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: FarmMutationRequest }) => {
      return await farmService.update(id, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      queryClient.invalidateQueries({ queryKey: ['farm', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['farm-statistics', variables.id] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useDeleteFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await farmService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useLots(farmId?: string) {
  return useQuery({
    queryKey: ['lots', farmId],
    queryFn: async () => {
      return await lotService.getAll(farmId as string);
    },
    enabled: !!farmId,
  });
}

export function useLot(id: string) {
  return useQuery({
    queryKey: ['lot', id],
    queryFn: async () => {
      return await lotService.getById(id);
    },
    enabled: !!id,
  });
}

export function useCreateLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: LotMutationRequest) => {
      return await lotService.create(payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lots', variables.farmId] });
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useUpdateLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, farmId, payload }: { id: string; farmId: string; payload: Omit<LotMutationRequest, 'farmId'> }) => {
      return await lotService.update(id, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lots', variables.farmId] });
      queryClient.invalidateQueries({ queryKey: ['lot', variables.id] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useDeleteLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; farmId: string }) => {
      return await lotService.delete(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lots', variables.farmId] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      return await productService.getAll();
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      return await productService.getById(id);
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProductMutationRequest) => {
      return await productService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ProductMutationRequest }) => {
      return await productService.update(id, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await productService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      invalidateDashboardQueries(queryClient);
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
      invalidateDashboardQueries(queryClient);
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
      invalidateDashboardQueries(queryClient);
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
      invalidateDashboardQueries(queryClient);
    },
  });
}
