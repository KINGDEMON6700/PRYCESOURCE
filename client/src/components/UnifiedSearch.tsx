import { useState, useEffect, useMemo } from "react";
import { Search, Filter, MapPin, Package, X, ArrowRight, Star, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { safeRating, safePrice } from "@/lib/safeNumber";
import type { StoreWithRating, ProductWithPrice } from "@shared/schema";

interface UnifiedSearchProps {
  placeholder?: string;
  onStoreSelect?: (store: StoreWithRating) => void;
  onProductSelect?: (product: ProductWithPrice) => void;
  showRecentSearches?: boolean;
  className?: string;
}

export function UnifiedSearch({
  placeholder = "Rechercher des magasins ou produits...",
  onStoreSelect,
  onProductSelect,
  showRecentSearches = true,
  className = ""
}: UnifiedSearchProps) {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"all" | "stores" | "products">("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save search to recent searches
  const saveSearch = (term: string) => {
    if (term.trim()) {
      const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  // Fetch stores
  const { data: stores = [] } = useOptimizedQuery<StoreWithRating[]>({
    queryKey: ["/api/stores"],
    staleTime: 5 * 60 * 1000,
    enabled: searchTerm.length > 2,
  });

  // Fetch products
  const { data: products = [] } = useOptimizedQuery<ProductWithPrice[]>({
    queryKey: ["/api/products"],
    staleTime: 5 * 60 * 1000,
    enabled: searchTerm.length > 2,
  });

  // Filter results based on search term
  const filteredStores = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const searchLower = searchTerm.toLowerCase();
    return stores
      .filter(store =>
        store.name.toLowerCase().includes(searchLower) ||
        store.city.toLowerCase().includes(searchLower) ||
        store.address.toLowerCase().includes(searchLower) ||
        store.brand?.toLowerCase().includes(searchLower)
      )
      .slice(0, 6);
  }, [stores, searchTerm]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const searchLower = searchTerm.toLowerCase();
    return products
      .filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      )
      .slice(0, 6);
  }, [products, searchTerm]);

  const handleStoreClick = (store: StoreWithRating) => {
    saveSearch(searchTerm);
    onStoreSelect?.(store);
    navigate(`/stores/${store.id}`);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleProductClick = (product: ProductWithPrice) => {
    saveSearch(searchTerm);
    onProductSelect?.(product);
    navigate(`/product/${product.id}`);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleRecentSearchClick = (term: string) => {
    setSearchTerm(term);
    setIsOpen(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      saveSearch(searchTerm);
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setIsOpen(false);
    }
  };

  const showResults = searchTerm.length > 2 && isOpen;
  const hasResults = filteredStores.length > 0 || filteredProducts.length > 0;

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder={placeholder}
          className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-8 w-8 p-0 text-gray-400 hover:text-white"
            onClick={() => {
              setSearchTerm("");
              setIsOpen(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Search Results Dropdown */}
      {(showResults || (isOpen && !searchTerm && recentSearches.length > 0)) && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <Card className="bg-gray-800 border-gray-700 shadow-lg">
            <CardContent className="p-0">
              {/* Recent Searches */}
              {!searchTerm && recentSearches.length > 0 && showRecentSearches && (
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white">Recherches récentes</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="text-gray-400 hover:text-white"
                    >
                      Effacer
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {recentSearches.map((term, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-gray-300 hover:text-white"
                        onClick={() => handleRecentSearchClick(term)}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {showResults && (
                <div className="max-h-96 overflow-y-auto">
                  {hasResults ? (
                    <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
                      <TabsList className="grid w-full grid-cols-3 m-4">
                        <TabsTrigger value="all">
                          Tout ({filteredStores.length + filteredProducts.length})
                        </TabsTrigger>
                        <TabsTrigger value="stores">
                          <MapPin className="h-4 w-4 mr-1" />
                          Magasins ({filteredStores.length})
                        </TabsTrigger>
                        <TabsTrigger value="products">
                          <Package className="h-4 w-4 mr-1" />
                          Produits ({filteredProducts.length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="all" className="mt-0">
                        <div className="space-y-1">
                          {/* Show stores first */}
                          {filteredStores.slice(0, 3).map((store) => (
                            <div
                              key={`store-${store.id}`}
                              className="flex items-center p-3 hover:bg-gray-700 cursor-pointer transition-colors"
                              onClick={() => handleStoreClick(store)}
                            >
                              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <MapPin className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-white font-medium">{store.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Badge variant="outline" className="text-xs">
                                    {store.brand}
                                  </Badge>
                                  <span>{store.city}</span>
                                </div>
                              </div>
                              <div className="flex items-center text-sm text-gray-400">
                                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                {safeRating(store.averageRating)}
                              </div>
                            </div>
                          ))}

                          {/* Show products */}
                          {filteredProducts.slice(0, 3).map((product) => (
                            <div
                              key={`product-${product.id}`}
                              className="flex items-center p-3 hover:bg-gray-700 cursor-pointer transition-colors"
                              onClick={() => handleProductClick(product)}
                            >
                              <img
                                src={product.imageUrl || `https://images.unsplash.com/photo-1506617420156-8e4536971650?w=40&h=40&fit=crop&crop=center&auto=format&q=${encodeURIComponent(product.name.toLowerCase())}`}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-lg mr-3"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1506617420156-8e4536971650?w=40&h=40&fit=crop&crop=center&auto=format";
                                }}
                              />
                              <div className="flex-1">
                                <h4 className="text-white font-medium">{product.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Badge variant="outline" className="text-xs">
                                    {product.brand}
                                  </Badge>
                                  <span>{product.category}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-blue-400 font-semibold">
                                  €{product.lowestPrice.toFixed(2)}
                                </span>
                                <div className="text-xs text-gray-400">
                                  {product.storeCount} magasin(s)
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Show more results button */}
                          {(filteredStores.length > 3 || filteredProducts.length > 3) && (
                            <div className="p-3 border-t border-gray-700">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-blue-400 hover:text-blue-300"
                                onClick={() => {
                                  saveSearch(searchTerm);
                                  navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                                  setIsOpen(false);
                                }}
                              >
                                Voir tous les résultats
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="stores" className="mt-0">
                        <div className="space-y-1">
                          {filteredStores.map((store) => (
                            <div
                              key={store.id}
                              className="flex items-center p-3 hover:bg-gray-700 cursor-pointer transition-colors"
                              onClick={() => handleStoreClick(store)}
                            >
                              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <MapPin className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-white font-medium">{store.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Badge variant="outline" className="text-xs">
                                    {store.brand}
                                  </Badge>
                                  <span>{store.city}</span>
                                  <span>{store.address}</span>
                                </div>
                              </div>
                              <div className="flex items-center text-sm text-gray-400">
                                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                {safeRating(store.averageRating)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="products" className="mt-0">
                        <div className="space-y-1">
                          {filteredProducts.map((product) => (
                            <div
                              key={product.id}
                              className="flex items-center p-3 hover:bg-gray-700 cursor-pointer transition-colors"
                              onClick={() => handleProductClick(product)}
                            >
                              <img
                                src={product.imageUrl || `https://images.unsplash.com/photo-1506617420156-8e4536971650?w=40&h=40&fit=crop&crop=center&auto=format&q=${encodeURIComponent(product.name.toLowerCase())}`}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-lg mr-3"
                                onError={(e) => {
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1506617420156-8e4536971650?w=40&h=40&fit=crop&crop=center&auto=format";
                                }}
                              />
                              <div className="flex-1">
                                <h4 className="text-white font-medium">{product.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Badge variant="outline" className="text-xs">
                                    {product.brand}
                                  </Badge>
                                  <span>{product.category}</span>
                                  {product.unit && <span>• {product.unit}</span>}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-blue-400 font-semibold">
                                  €{product.lowestPrice.toFixed(2)}
                                </span>
                                <div className="text-xs text-gray-400">
                                  {product.storeCount} magasin(s)
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="p-8 text-center">
                      <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Aucun résultat trouvé
                      </h3>
                      <p className="text-gray-400">
                        Essayez d'autres mots-clés ou vérifiez l'orthographe
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overlay to close search */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}