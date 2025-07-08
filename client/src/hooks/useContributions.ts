import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useContributions(filters?: { status?: string; type?: string; priority?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.type) params.append("type", filters.type);
  if (filters?.priority) params.append("priority", filters.priority);
  
  const query = params.toString();
  
  return useQuery({
    queryKey: ["/api/contributions", filters],
    queryFn: () => apiRequest("GET", `/api/contributions${query ? `?${query}` : ""}`),
  });
}

export function usePendingContributionsCount() {
  return useQuery({
    queryKey: ["/api/contributions", { status: "pending" }],
    queryFn: () => apiRequest("GET", "/api/contributions?status=pending"),
    select: (data: any[]) => data.length,
  });
}