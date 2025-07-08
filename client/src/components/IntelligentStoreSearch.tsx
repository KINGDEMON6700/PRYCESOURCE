import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { StoreCard } from "./StoreCard";
import { filterStoresByQuery, getAllStoreCategories, type StoreCategoryKey } from "@/lib/storeCategories";
import type { StoreWithRating } from "@shared/schema";

interface IntelligentStoreSearchProps {
  onStoreSelect?: (store: StoreWithRating) => void;
  userLocation?: { lat: number; lng: number };
  className?: string;
}

export function IntelligentStoreSearch({ 
  onStoreSelect, 
  userLocation, 
  className = "" 
}: IntelligentStoreSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<StoreCategoryKey[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Récupération de tous les magasins
  const { data: stores = [], isLoading } = useQuery<StoreWithRating[]>({
    queryKey: ["/api/stores"]
  });

  // Filtrage intelligent des magasins
  const filteredStores = useMemo(() => {
    let result = stores;

    // Filtrage par recherche textuelle intelligent (marque ou lieu)
    if (searchQuery.trim()) {
      result = filterStoresByQuery(result, searchQuery, userLocation);
    }

    // Filtrage par catégories sélectionnées
    if (selectedCategories.length > 0) {
      result = result.filter(store => {
        const storeCategory = store.category?.toUpperCase() as StoreCategoryKey;
        return selectedCategories.includes(storeCategory);
      });
    }

    return result;
  }, [stores, searchQuery, selectedCategories, userLocation]);

  // Suggestions de recherche basées sur les données actuelles
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    const suggestions = new Set<string>();

    // Marques populaires
    const brands = ['Aldi', 'Lidl', 'Delhaize', 'Carrefour', 'Colruyt', 'Okay', 'Proxy', 'Match', 'Intermarché', 'SPAR'];
    brands.forEach(brand => {
      if (brand.toLowerCase().includes(query)) {
        suggestions.add(brand);
      }
    });

    // Villes belges populaires  
    const cities = ['Frameries', 'Mons', 'Charleroi', 'La Louvière', 'Tournai', 'Mouscron', 'Quaregnon', 'Colfontaine', 'Dour', 'Boussu'];
    cities.forEach(city => {
      if (city.toLowerCase().includes(query)) {
        suggestions.add(city);
      }
    });

    // Suggestions basées sur les magasins existants
    stores.forEach(store => {
      if (store.brand.toLowerCase().includes(query)) {
        suggestions.add(store.brand.charAt(0).toUpperCase() + store.brand.slice(1));
      }
      if (store.city.toLowerCase().includes(query)) {
        suggestions.add(store.city);
      }
    });

    return Array.from(suggestions).slice(0, 6);
  }, [stores, searchQuery]);

  const categories = getAllStoreCategories();

  const toggleCategory = (categoryKey: StoreCategoryKey) => {
    setSelectedCategories(prev => 
      prev.includes(categoryKey)
        ? prev.filter(c => c !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
  };

  const handleStoreClick = (store: StoreWithRating) => {
    if (onStoreSelect) {
      onStoreSelect(store);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barre de recherche intelligente */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher par marque (ex: Aldi) ou lieu (ex: Frameries)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-20"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="h-8 px-2"
            >
              <Filter className="h-4 w-4" />
            </Button>
            {(searchQuery || selectedCategories.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Suggestions de recherche */}
        {searchSuggestions.length > 0 && searchQuery && searchQuery.length >= 2 && (
          <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg">
            <CardContent className="p-3">
              <div className="text-xs text-gray-500 mb-2">Suggestions :</div>
              <div className="flex flex-wrap gap-2">
                {searchSuggestions.map(suggestion => (
                  <Button
                    key={suggestion}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery(suggestion);
                    }}
                    className="h-8 px-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filtres par catégorie */}
      {isFilterOpen && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">Filtrer par catégorie</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Badge
                  key={category.key}
                  variant={selectedCategories.includes(category.key) ? "default" : "outline"}
                  className={`cursor-pointer transition-all ${
                    selectedCategories.includes(category.key) 
                      ? category.color
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => toggleCategory(category.key)}
                >
                  {category.icon} {category.label}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations sur les résultats */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {filteredStores.length} magasin{filteredStores.length !== 1 ? 's' : ''} trouvé{filteredStores.length !== 1 ? 's' : ''}
          {searchQuery && (
            <span className="font-medium">
              {searchQuery.match(/^[A-Za-zÀ-ÿ\-\s]{2,}$/) && !['aldi', 'lidl', 'delhaize', 'carrefour'].some(brand => searchQuery.toLowerCase().includes(brand))
                ? ` à ${searchQuery}`
                : ` pour "${searchQuery}"`
              }
            </span>
          )}
        </span>
        {userLocation && filteredStores.length > 0 && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="text-xs">Triés par distance</span>
          </div>
        )}
      </div>

      {/* Résultats */}
      <div className="space-y-2 sm:space-y-3 w-full">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Chargement des magasins...
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery || selectedCategories.length > 0 
              ? "Aucun magasin trouvé avec ces critères"
              : "Aucun magasin disponible"
            }
          </div>
        ) : (
          filteredStores.map(store => (
            <div key={store.id} className="w-full">
              <StoreCard
                store={store}
                onClick={() => handleStoreClick(store)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}