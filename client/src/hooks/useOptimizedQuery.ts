import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useDebounce } from "./usePerformanceOptimization";

// Hook optimisé pour les requêtes avec debouncing et cache intelligent
export function useOptimizedQuery<T>(
  queryKey: (string | number)[],
  options?: Omit<UseQueryOptions<T>, 'queryKey'> & {
    debounceMs?: number;
    enableOfflineSupport?: boolean;
  }
) {
  const { debounceMs = 0, enableOfflineSupport = true, ...queryOptions } = options || {};
  
  // Application du debounce si nécessaire
  const debouncedKey = useDebounce(() => queryKey, debounceMs);
  const actualKey = debounceMs > 0 ? debouncedKey : queryKey;

  return useQuery<T>({
    queryKey: actualKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
    retry: (failureCount, error) => {
      // Retry plus intelligent basé sur le type d'erreur
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) return false; // Erreurs client
        if (status >= 500) return failureCount < 3; // Erreurs serveur
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: "stale",
    ...queryOptions
  });
}

// Hook pour les listes avec pagination et virtualisation
export function useOptimizedListQuery<T>(
  queryKey: (string | number)[],
  options?: {
    pageSize?: number;
    enableInfiniteScroll?: boolean;
  } & Omit<UseQueryOptions<T[]>, 'queryKey'>
) {
  const { pageSize = 20, enableInfiniteScroll = false, ...queryOptions } = options || {};
  
  return useOptimizedQuery<T[]>(queryKey, {
    ...queryOptions,
    select: (data) => {
      // Optimisation pour les grandes listes
      if (!enableInfiniteScroll && data && data.length > pageSize) {
        return data.slice(0, pageSize);
      }
      return data;
    }
  });
}

// Hook pour les recherches avec debouncing automatique
export function useOptimizedSearchQuery<T>(
  searchTerm: string,
  queryFn: () => Promise<T>,
  options?: {
    minSearchLength?: number;
    debounceMs?: number;
  } & Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const { minSearchLength = 2, debounceMs = 300, ...queryOptions } = options || {};
  
  return useOptimizedQuery<T>(
    ['search', searchTerm],
    {
      queryFn,
      enabled: searchTerm.length >= minSearchLength,
      debounceMs,
      ...queryOptions
    }
  );
}