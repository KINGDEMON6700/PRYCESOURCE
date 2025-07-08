import { memo, useMemo, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { VirtualizedProductList } from "./VirtualizedProductList";
import { ProductCard } from "./ProductCard";
import { SearchBar } from "./SearchBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useOptimizedSearchQuery } from "@/hooks/useOptimizedQuery";
import { useDebounce } from "@/hooks/usePerformanceOptimization";
import { Grid, List, Filter } from "lucide-react";
import type { ProductWithPrice } from "@shared/schema";

interface OptimizedProductGridProps {
  products: ProductWithPrice[];
  loading?: boolean;
  enableVirtualization?: boolean;
  enableSearch?: boolean;
  enableFilters?: boolean;
  itemsPerPage?: number;
  onProductClick?: (product: ProductWithPrice) => void;
}

const CATEGORIES = [
  "Tous",
  "Fruits & Légumes", 
  "Viandes & Poissons",
  "Produits laitiers",
  "Boulangerie",
  "Épicerie salée",
  "Épicerie sucrée",
  "Boissons",
  "Surgelés",
  "Hygiène & Beauté",
  "Entretien"
];

export const OptimizedProductGrid = memo(({
  products,
  loading = false,
  enableVirtualization = true,
  enableSearch = true,
  enableFilters = true,
  itemsPerPage = 20,
  onProductClick
}: OptimizedProductGridProps) => {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filtrage et recherche optimisés
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filtre par catégorie
    if (selectedCategory !== "Tous") {
      filtered = filtered.filter(product => 
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Recherche textuelle
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [products, selectedCategory, debouncedSearchTerm]);

  // Pagination pour mode non-virtualisé
  const paginatedProducts = useMemo(() => {
    if (enableVirtualization) return filteredProducts;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage, enableVirtualization]);

  const handleProductClick = useCallback((product: ProductWithPrice) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      setLocation(`/products/${product.id}`);
    }
  }, [onProductClick, setLocation]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton loading */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contrôles de recherche et filtres */}
      {(enableSearch || enableFilters) && (
        <div className="space-y-4">
          {enableSearch && (
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher des produits..."
              className="max-w-lg"
            />
          )}
          
          <div className="flex flex-wrap gap-2 items-center justify-between">
            {enableFilters && (
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(category => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer hover:bg-blue-600 hover:text-white transition-colors"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
        </span>
        {!enableVirtualization && totalPages > 1 && (
          <span>
            Page {currentPage} sur {totalPages}
          </span>
        )}
      </div>

      {/* Grille de produits */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Aucun produit ne correspond à vos critères
          </p>
        </div>
      ) : enableVirtualization ? (
        <VirtualizedProductList
          products={filteredProducts}
          onProductClick={handleProductClick}
          itemsPerRow={viewMode === 'grid' ? 2 : 1}
          itemHeight={viewMode === 'grid' ? 280 : 120}
        />
      ) : (
        <>
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
                showPriceContribution={false}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

OptimizedProductGrid.displayName = "OptimizedProductGrid";