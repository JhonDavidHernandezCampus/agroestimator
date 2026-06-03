import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { harvestApi } from '../api/harvest.api';
import { statisticsApi } from '../api/statistics.api';
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
    mutationFn: async (harvest: Omit<Harvest, 'id'>) => {
      return await harvestApi.create(harvest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['harvests'] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}

export function useUpdateHarvest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, harvest }: { id: string; harvest: Partial<Harvest> }) => {
      return await harvestApi.update(id, harvest);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['harvests'] });
      queryClient.invalidateQueries({ queryKey: ['harvest', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
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
