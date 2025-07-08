import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Product, ProductWithPrice, InsertProduct, ProductRating, InsertProductRating } from "@shared/schema";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
}

export function useProduct(id: number) {
  return useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });
}

export function useSearchProducts(query: string) {
  return useQuery<ProductWithPrice[]>({
    queryKey: ["/api/products/search", query],
    enabled: !!query,
  });
}

export function usePopularProducts(limit: number = 10) {
  return useQuery<ProductWithPrice[]>({
    queryKey: ["/api/products/popular", limit],
  });
}

// Hook pour créer un produit (admin)
export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (productData: InsertProduct) => {
      const response = await apiRequest('POST', '/api/admin/products', productData);
      return response.json();
    },
    onSuccess: () => {
      // Invalider tous les caches liés aux produits
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/popular'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/search'] });
      toast({
        title: "Produit créé",
        description: "Le produit a été créé avec succès.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être administrateur pour créer un produit.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de créer le produit.",
          variant: "destructive",
        });
      }
    },
  });
}

// Hook pour modifier un produit (admin)
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProduct> }) => {
      const response = await apiRequest('PUT', `/api/admin/products/${id}`, data);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      // Invalider tous les caches liés aux produits
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/popular'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/search'] });
      toast({
        title: "Produit modifié",
        description: "Le produit a été modifié avec succès.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être administrateur pour modifier un produit.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de modifier le produit.",
          variant: "destructive",
        });
      }
    },
  });
}

// Hook pour supprimer un produit (admin)
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/products/${id}`);
      return response.json();
    },
    onSuccess: () => {
      // Invalider tous les caches liés aux produits
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/popular'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products/search'] });
      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être administrateur pour supprimer un produit.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le produit.",
          variant: "destructive",
        });
      }
    },
  });
}

export function useAssociateProductToStore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      storeId, 
      productId, 
      price, 
      isPromotion = false, 
      promotionEndDate = null, 
      isAvailable = true 
    }: {
      storeId: number;
      productId: number;
      price: number;
      isPromotion?: boolean;
      promotionEndDate?: Date | null;
      isAvailable?: boolean;
    }) => {
      return await apiRequest('POST', `/api/stores/${storeId}/products`, {
        productId,
        price,
        isPromotion,
        promotionEndDate,
        isAvailable,
      });
    },
    onSuccess: (_, { storeId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", storeId] });
      queryClient.invalidateQueries({ queryKey: ["/api/prices"] });
    },
  });
}

// === ADMIN MANAGEMENT HOOKS ===

// Hook pour récupérer tous les produits pour l'admin
export function useAdminProducts() {
  return useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// === USER INTERACTION HOOKS ===

// Hook pour ajouter une évaluation à un produit
export function useAddProductRating() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (rating: InsertProductRating) => {
      const response = await apiRequest("POST", "/api/ratings/product", rating);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Évaluation ajoutée",
        description: "Votre évaluation a été enregistrée.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Non autorisé",
          description: "Vous devez être connecté pour évaluer un produit.",
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