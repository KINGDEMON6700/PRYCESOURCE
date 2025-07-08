import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Grid, List, ArrowLeft, Filter } from "lucide-react";
import { OptimizedProductGrid } from "@/components/OptimizedProductGrid";
import { BottomNavigation } from "@/components/BottomNavigation";
import { StandardHeader } from "@/components/StandardHeader";
import { SearchBar } from "@/components/SearchBar";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ProductWithPrice } from "@shared/schema";

export default function AllProducts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSearchQuery("");
  };

  const handleProductClick = (product: ProductWithPrice) => {
    setLocation(`/products/${product.id}`);
  };

  const categories = [
    "Alimentaire",
    "Boissons", 
    "Hygiène",
    "Ménage",
    "Bébé",
    "Animalerie",
    "Surgelés",
    "Boulangerie"
  ];

  // Fetch all products
  const { data: allProducts = [], isLoading, error } = useQuery({
    queryKey: ['/api/products'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;

    // Filter by search query
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    return filtered;
  }, [allProducts, searchQuery, selectedCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chargement...
            </h1>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <StandardHeader 
        title="Tous les produits"
        showBackButton={true}
      />
      
      <div className="pt-16 px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Tous les produits
          </h1>
          <div className="ml-auto flex items-center space-x-1 sm:space-x-2">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="p-2"
            >
              <Grid className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="p-2"
            >
              <List className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} />
        
        {/* Filters */}
        <div className="px-4 pb-3">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("")}
            >
              Tous
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
            {(searchQuery || selectedCategory) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700"
              >
                Effacer
              </Button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
            {searchQuery && ` pour "${searchQuery}"`}
            {selectedCategory && ` dans ${selectedCategory}`}
          </p>
        </div>
      </div>

      {/* Products List */}
      <div className="p-4">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery || selectedCategory
                  ? "Essayez de modifier vos critères de recherche."
                  : "Aucun produit n'est disponible pour le moment."
                }
              </p>
              {(searchQuery || selectedCategory) && (
                <Button onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={`https://images.unsplash.com/photo-1506617420156-8e4536971650?w=80&h=80&fit=crop&crop=center&auto=format&q=${encodeURIComponent(product.name.toLowerCase())}`}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1506617420156-8e4536971650?w=80&h=80&fit=crop&crop=center&auto=format";
                      }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {product.brand}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {product.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-lg font-bold text-blue-600">
                          €{typeof product.lowestPrice === 'string' 
                            ? Number(product.lowestPrice || 0).toFixed(2) 
                            : product.lowestPrice.toFixed(2)
                          }
                        </span>
                        <span className="text-xs text-gray-500">
                          dans {product.storeCount} magasin{product.storeCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-yellow-600">
                          {Number(product.averageRating || 0).toFixed(1)}
                        </span>
                        <span className="text-yellow-500">★</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {product.ratingCount} avis
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}