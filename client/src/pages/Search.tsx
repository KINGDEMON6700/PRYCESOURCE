import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { UnifiedSearch } from "@/components/UnifiedSearch";
import { ProductCard } from "@/components/ProductCard";
import { StandardHeader } from "@/components/StandardHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search as SearchIcon, ArrowLeft, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ProductWithPrice } from "@shared/schema";

export default function Search() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<string[]>(["proximity"]);

  // Get initial search query from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("q");
    if (q) {
      setSearchQuery(q);
    }
  }, []);

  // Search products
  const { data: products, isLoading, error } = useQuery<ProductWithPrice[]>({
    queryKey: ["/api/products/search", { q: searchQuery }],
    enabled: !!searchQuery.trim(),
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Update URL without causing navigation
    const newUrl = query ? `/search?q=${encodeURIComponent(query)}` : "/search";
    window.history.replaceState({}, "", newUrl);
  };

  const handleProductClick = (product: ProductWithPrice) => {
    setLocation(`/product/${product.id}`);
  };

  return (
    <div className="max-w-sm mx-auto bg-gray-900 min-h-screen relative">
      <StandardHeader 
        title="Recherche"
        showBackButton={true}
      />

      <div className="pt-16">
        {/* Enhanced Search */}
        <div className="p-4">
          <UnifiedSearch
            placeholder="Rechercher des produits ou magasins..."
            showRecentSearches={true}
            onProductSelect={(product) => setLocation(`/product/${product.id}`)}
            onStoreSelect={(store) => setLocation(`/stores/${store.id}`)}
            className="mb-4"
          />
        </div>

        {/* Main Content */}
        <main className="pb-20 bg-gray-900">
        {!searchQuery.trim() ? (
          <div className="p-4 text-center py-16">
            <p className="text-gray-400">
              Tapez le nom d'un produit pour commencer la recherche
            </p>
          </div>
        ) : isLoading ? (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-3">
                    <div className="w-full h-24 bg-gray-200 rounded-lg mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-center py-16">
            <p className="text-red-500 dark:text-red-400">
              Erreur lors de la recherche. Veuillez réessayer.
            </p>
          </div>
        ) : products?.length ? (
          <div className="p-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {products.length} résultat{products.length > 1 ? "s" : ""} pour "{searchQuery}"
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => handleProductClick(product)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">
              Aucun produit trouvé pour "{searchQuery}"
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Essayez avec un autre terme de recherche
            </p>
          </div>
        )}
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
