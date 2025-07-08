import { useQuery } from "@tanstack/react-query";
import { searchProductByBarcode, searchProductsByName, OpenFoodFactsProduct } from "@/services/openFoodFacts";

/**
 * Hook pour récupérer les données OpenFoodFacts par code-barres
 */
export function useOpenFoodFactsByBarcode(barcode: string | null | undefined) {
  return useQuery({
    queryKey: ['openFoodFacts', 'barcode', barcode],
    queryFn: () => searchProductByBarcode(barcode!),
    enabled: !!barcode && barcode.length > 0,
    staleTime: 1000 * 60 * 60, // 1 heure
    gcTime: 1000 * 60 * 60 * 24, // 24 heures
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Hook pour rechercher des produits OpenFoodFacts par nom
 */
export function useOpenFoodFactsByName(name: string | null | undefined, limit: number = 10) {
  return useQuery({
    queryKey: ['openFoodFacts', 'search', name, limit],
    queryFn: () => searchProductsByName(name!, limit),
    enabled: !!name && name.length > 2,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 2, // 2 heures
    retry: 2,
    retryDelay: 1000,
  });
}

/**
 * Hook pour enrichir les données d'un produit avec OpenFoodFacts
 */
export function useProductEnrichment(product: { name?: string; barcode?: string | null }) {
  // Priorité au code-barres s'il existe
  const barcodeQuery = useOpenFoodFactsByBarcode(product.barcode);
  
  // Recherche par nom si pas de code-barres ou si pas de résultats
  const nameQuery = useOpenFoodFactsByName(
    product.name,
    5
  );

  // Détermine quelle données utiliser
  const openFoodFactsData = barcodeQuery.data || nameQuery.data?.[0] || null;
  
  return {
    data: openFoodFactsData,
    isLoading: barcodeQuery.isLoading || nameQuery.isLoading,
    error: barcodeQuery.error || nameQuery.error,
    hasBarcode: !!product.barcode,
    foundByBarcode: !!barcodeQuery.data,
    foundByName: !!nameQuery.data?.[0],
  };
}