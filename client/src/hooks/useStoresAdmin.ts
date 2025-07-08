import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Store, InsertStore } from "@shared/schema";

// Hooks pour la gestion CRUD avancée des magasins en admin
export function useStoresAdmin() {
  return useQuery({
    queryKey: ['/api/stores'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useStoreById(id: number) {
  return useQuery({
    queryKey: ['/api/stores', id],
    enabled: !!id,
  });
}

export function useStoreProducts(storeId: number) {
  return useQuery({
    queryKey: ['/api/stores', storeId, 'products'],
    enabled: !!storeId,
  });
}

export function useStoresWithDistance(lat?: number, lng?: number, radius?: number) {
  return useQuery({
    queryKey: ['/api/stores', { lat, lng, radius }],
    enabled: !!(lat && lng),
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (storeData: InsertStore) => {
      return apiRequest('POST', '/api/admin/stores', storeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/health'] });
    },
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertStore> }) => {
      return apiRequest('PUT', `/api/admin/stores/${id}`, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stores', id] });
    },
  });
}

export function useDeleteStore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/stores/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/health'] });
    },
  });
}

export function useToggleProductAvailability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      storeId, 
      productId, 
      isAvailable 
    }: { 
      storeId: number; 
      productId: number; 
      isAvailable: boolean; 
    }) => {
      return apiRequest('POST', `/api/admin/stores/${storeId}/products/${productId}/toggle-availability`, { isAvailable });
    },
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores', storeId, 'products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });
}

// Analytics hooks
export function useStorePerformance() {
  return useQuery({
    queryKey: ['/api/admin/analytics/store-performance'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useTopContributors(limit: number = 10) {
  return useQuery({
    queryKey: ['/api/admin/analytics/top-contributors', { limit }],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

export function useActivityHeatmap(days: number = 30) {
  return useQuery({
    queryKey: ['/api/admin/analytics/activity-heatmap', { days }],
    staleTime: 1000 * 60 * 20, // 20 minutes
  });
}

export function useAdminNotifications() {
  return useQuery({
    queryKey: ['/api/admin/notifications'],
    refetchInterval: 1000 * 60 * 2, // Recharger toutes les 2 minutes
    staleTime: 1000 * 60, // 1 minute
  });
}