import { useState, useEffect, useRef } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { ProductWithPrice, StoreWithRating } from "@shared/schema";

interface SearchWithAutocompleteProps {
  placeholder?: string;
  showRecentSearches?: boolean;
  onProductSelect?: (product: ProductWithPrice) => void;
  onStoreSelect?: (store: StoreWithRating) => void;
  onSearch?: (query: string) => void;
}

export function SearchWithAutocomplete({
  placeholder = "Rechercher...",
  showRecentSearches = false,
  onProductSelect,
  onStoreSelect,
  onSearch
}: SearchWithAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (showRecentSearches) {
      const saved = localStorage.getItem("pryce_recent_searches");
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch {
          // Ignore invalid JSON
        }
      }
    }
  }, [showRecentSearches]);

  // Save to recent searches
  const saveToRecentSearches = (searchQuery: string) => {
    if (!showRecentSearches || !searchQuery.trim()) return;
    
    const newSearches = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(newSearches);
    localStorage.setItem("pryce_recent_searches", JSON.stringify(newSearches));
  };

  // Search suggestions
  const { data: suggestions } = useQuery<{
    products: ProductWithPrice[];
    stores: StoreWithRating[];
  }>({
    queryKey: ["/api/search/suggestions", { q: query }],
    enabled: query.length >= 2,
  });

  // Handle search
  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      saveToRecentSearches(searchQuery.trim());
      onSearch?.(searchQuery.trim());
      setIsOpen(false);
    }
  };

  // Handle product/store selection
  const handleProductSelect = (product: ProductWithPrice) => {
    saveToRecentSearches(product.name);
    onProductSelect?.(product);
    setQuery("");
    setIsOpen(false);
  };

  const handleStoreSelect = (store: StoreWithRating) => {
    saveToRecentSearches(store.name);
    onStoreSelect?.(store);
    setQuery("");
    setIsOpen(false);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyPress}
          className="pl-10 pr-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-700"
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 bg-gray-800 border-gray-600 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {/* Recent Searches */}
            {showRecentSearches && recentSearches.length > 0 && !query && (
              <div className="p-3 border-b border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recherches récentes
                </h4>
                {recentSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSearch(search)}
                    className="w-full justify-start text-left text-gray-400 hover:text-white hover:bg-gray-700 mb-1"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {query.length >= 2 && suggestions && (
              <>
                {/* Products */}
                {suggestions.products && suggestions.products.length > 0 && (
                  <div className="p-3 border-b border-gray-700">
                    <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Produits
                    </h4>
                    {suggestions.products.slice(0, 3).map((product) => (
                      <Button
                        key={product.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleProductSelect(product)}
                        className="w-full justify-start text-left text-gray-300 hover:text-white hover:bg-gray-700 mb-1"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{product.name}</span>
                          {product.brand && (
                            <span className="text-xs text-gray-500">{product.brand}</span>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}

                {/* Stores */}
                {suggestions.stores && suggestions.stores.length > 0 && (
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Magasins</h4>
                    {suggestions.stores.slice(0, 2).map((store) => (
                      <Button
                        key={store.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStoreSelect(store)}
                        className="w-full justify-start text-left text-gray-300 hover:text-white hover:bg-gray-700 mb-1"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{store.name}</span>
                          <span className="text-xs text-gray-500">{store.city}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* No results */}
            {query.length >= 2 && suggestions && 
             (!suggestions.products?.length && !suggestions.stores?.length) && (
              <div className="p-4 text-center text-gray-500">
                Aucun résultat trouvé pour "{query}"
              </div>
            )}

            {/* Search all results */}
            {query.trim() && (
              <div className="p-3 border-t border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch(query)}
                  className="w-full justify-start text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Rechercher "{query}"
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}