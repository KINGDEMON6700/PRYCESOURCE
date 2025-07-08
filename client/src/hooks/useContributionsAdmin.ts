import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Contribution, InsertContribution } from "@shared/schema";

// Hooks pour la gestion avancée des contributions en admin
export function useContributionsAdmin(status?: string, priority?: string) {
  return useQuery({
    queryKey: ['/api/admin/contributions', { status, priority }],
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useContributionsByStatus(status: string) {
  return useQuery({
    queryKey: ['/api/admin/contributions/status', status],
    enabled: !!status,
  });
}

export function useContributionsByPriority(priority: string) {
  return useQuery({
    queryKey: ['/api/admin/contributions/priority', priority],
    enabled: !!priority,
  });
}

export function useContributionStats() {
  return useQuery({
    queryKey: ['/api/admin/contributions/stats'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Mutations pour les contributions
export function useCreateContribution() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contributionData: Omit<InsertContribution, 'userId' | 'status'>) => {
      return apiRequest('POST', '/api/contributions', contributionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contributions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contributions/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/health'] });
    },
  });
}

export function useApproveContribution() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('PATCH', `/api/admin/contributions/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contributions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contributions/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/health'] });
    },
  });
}

export function useRejectContribution() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      return apiRequest('PATCH', `/api/admin/contributions/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contributions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contributions/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/health'] });
    },
  });
}

export function useUpdateContributionPriority() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, priority }: { id: number; priority: string }) => {
      return apiRequest('PATCH', `/api/admin/contributions/${id}/priority`, { priority });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contributions'] });
    },
  });
}

export function useAddAdminNotes() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return apiRequest('POST', `/api/admin/contributions/${id}/notes`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contributions'] });
    },
  });
}

// Actions en masse
export function useBulkApproveContributions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contributionIds: number[]) => {
      return apiRequest('POST', '/api/admin/contributions/bulk-approve', { contributionIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contributions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contributions/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/health'] });
    },
  });
}

export function useBulkRejectContributions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ contributionIds, reason }: { contributionIds: number[]; reason?: string }) => {
      return apiRequest('POST', '/api/admin/contributions/bulk-reject', { contributionIds, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contributions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contributions/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system/health'] });
    },
  });
}

// Export des données
export function useExportContributions() {
  return useMutation({
    mutationFn: async ({ 
      format = 'json', 
      status, 
      startDate, 
      endDate 
    }: { 
      format?: 'json' | 'csv'; 
      status?: string; 
      startDate?: string; 
      endDate?: string; 
    }) => {
      const params = new URLSearchParams();
      if (format) params.append('format', format);
      if (status) params.append('status', status);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/admin/export/contributions?${params.toString()}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contributions.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return { success: true };
      } else {
        return response.json();
      }
    },
  });
}