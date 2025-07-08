import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Store, StoreWithRating, InsertStore, StoreRating, InsertStoreRating } from "@shared/schema";

// === PUBLIC & ADMIN SHARED HOOKS ===

// Hook pour récupérer tous les magasins
export function useStores() {
  return useQuery<StoreWithRating[]>({
    queryKey: ["/api/stores"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Hook pour récupérer un magasin par ID
export function useStore(id: number) {
  return useQuery<Store>({
    queryKey: ["/api/stores", id],
    retry: false,
    enabled: !!id,
  });
}

// Hook pour récupérer les magasins à proximité
export function useNearbyStores(latitude?: number, longitude?: number, radius: number = 10) {
  return useQuery<StoreWithRating[]>({
    queryKey: ["/api/stores/nearby", latitude, longitude, radius],
    retry: false,
    enabled: !!latitude && !!longitude,
  });
}

// === ADMIN MANAGEMENT HOOKS ===

// Hook pour récupérer tous les magasins pour l'admin
export function useAdminStores() {
  return useQuery<StoreWithRating[]>({
    queryKey: ["/api/admin/stores"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Hook pour créer un magasin (admin)
export function useCreateStore() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (storeData: InsertStore) => {
      const response = await apiRequest("POST", "/api/admin/stores", storeData);
      return response.json();
    },
    onSuccess: () => {
      // Invalider tous les caches liés aux magasins
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores/nearby"] });
      toast({
        title: "Magasin créé",
        description: "Le magasin a été créé avec succès.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être administrateur pour créer un magasin.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de créer le magasin.",
          variant: "destructive",
        });
      }
    },
  });
}

// Hook pour modifier un magasin (admin)
export function useUpdateStore() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertStore> }) => {
      const response = await apiRequest("PUT", `/api/admin/stores/${id}`, data);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      // Invalider tous les caches liés aux magasins
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores/nearby"] });
      toast({
        title: "Magasin modifié",
        description: "Le magasin a été modifié avec succès.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être administrateur pour modifier un magasin.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de modifier le magasin.",
          variant: "destructive",
        });
      }
    },
  });
}

// Hook pour supprimer un magasin (admin)
export function useDeleteStore() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/stores/${id}`);
      return response.json();
    },
    onSuccess: () => {
      // Invalider tous les caches liés aux magasins
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores/nearby"] });
      toast({
        title: "Magasin supprimé",
        description: "Le magasin a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être administrateur pour supprimer un magasin.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le magasin.",
          variant: "destructive",
        });
      }
    },
  });
}

// === USER INTERACTION HOOKS ===

// Hook pour ajouter une évaluation à un magasin
export function useAddStoreRating() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (rating: InsertStoreRating) => {
      const response = await apiRequest("POST", "/api/ratings/store", rating);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", variables.storeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      toast({
        title: "Évaluation ajoutée",
        description: "Votre évaluation a été enregistrée.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être connecté pour évaluer un magasin.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer votre évaluation.",
          variant: "destructive",
        });
      }
    },
  });
}