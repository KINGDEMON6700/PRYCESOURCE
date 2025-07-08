import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { VirtualizedStoreList } from "./VirtualizedStoreList";
import { StoreCard } from "./StoreCard";
import { SearchBar } from "./SearchBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useDebounce } from "@/hooks/usePerformanceOptimization";
import { Grid, List, MapPin, Star } from "lucide-react";
import type { StoreWithRating } from "@shared/schema";

interface OptimizedStoreGridProps {
  stores: StoreWithRating[];
  loading?: boolean;
  enableVirtualization?: boolean;
  enableSearch?: boolean;
  enableFilters?: boolean;
  itemsPerPage?: number;
  onStoreClick?: (store: StoreWithRating) => void;
}

const STORE_BRANDS = [
  "Tous",
  "ALDI",
  "LIDL", 
  "Delhaize",
  "Carrefour",
  "Colruyt",
  "Okay",
  "Intermarché",
  "Match"
];

const STORE_CATEGORIES = [
  "Tous",
  "supermarche",
  "discount", 
  "proximite",
  "fast-food",
  "restaurant",
  "boulangerie",
  "cafe",
  "station-service",
  "pharmacie"
];

export const OptimizedStoreGrid = memo(({
  stores,
  loading = false,
  enableVirtualization = true,
  enableSearch = true,
  enableFilters = true,
  itemsPerPage = 20,
  onStoreClick
}: OptimizedStoreGridProps) => {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("Tous");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'distance' | 'name' | 'rating'>('distance');

  // Simple debounce pour le terme de recherche
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filtrage et tri optimisés
  const filteredAndSortedStores = useMemo(() => {
    let filtered = stores;

    // Filtre par marque
    if (selectedBrand !== "Tous") {
      filtered = filtered.filter(store => 
        store.brand?.toUpperCase() === selectedBrand.toUpperCase()
      );
    }

    // Filtre par catégorie
    if (selectedCategory !== "Tous") {
      filtered = filtered.filter(store => 
        store.category === selectedCategory
      );
    }

    // Recherche textuelle
    if (debouncedSearchTerm && typeof debouncedSearchTerm === 'string' && debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchLower) ||
        store.brand?.toLowerCase().includes(searchLower) ||
        store.city?.toLowerCase().includes(searchLower) ||
        store.address?.toLowerCase().includes(searchLower)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return (a.distance || 999) - (b.distance || 999);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [stores, selectedBrand, selectedCategory, debouncedSearchTerm, sortBy]);

  // Pagination pour mode non-virtualisé
  const paginatedStores = useMemo(() => {
    if (enableVirtualization) return filteredAndSortedStores;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedStores.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedStores, currentPage, itemsPerPage, enableVirtualization]);

  const handleStoreClick = useCallback((store: StoreWithRating) => {
    if (onStoreClick) {
      onStoreClick(store);
    } else {
      setLocation(`/stores/${store.id}`);
    }
  }, [onStoreClick, setLocation]);

  const totalPages = Math.ceil(filteredAndSortedStores.length / itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton loading */}
        <div className="grid grid-cols-1 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
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
              placeholder="Rechercher des magasins..."
              className="max-w-lg"
            />
          )}
          
          <div className="space-y-3">
            {enableFilters && (
              <>
                <div>
                  <p className="text-sm font-medium mb-2">Marques :</p>
                  <div className="flex flex-wrap gap-2">
                    {STORE_BRANDS.map(brand => (
                      <Badge
                        key={brand}
                        variant={selectedBrand === brand ? "default" : "outline"}
                        className="cursor-pointer hover:bg-blue-600 hover:text-white transition-colors"
                        onClick={() => setSelectedBrand(brand)}
                      >
                        {brand}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Catégories :</p>
                  <div className="flex flex-wrap gap-2">
                    {STORE_CATEGORIES.map(category => (
                      <Badge
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        className="cursor-pointer hover:bg-blue-600 hover:text-white transition-colors"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category === "supermarche" ? "Supermarché" : category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">Trier par :</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="distance">Distance</option>
                  <option value="name">Nom</option>
                  <option value="rating">Note</option>
                </select>
              </div>
              
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
        </div>
      )}

      {/* Statistiques */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          {filteredAndSortedStores.length} magasin{filteredAndSortedStores.length > 1 ? 's' : ''} trouvé{filteredAndSortedStores.length > 1 ? 's' : ''}
        </span>
        {!enableVirtualization && totalPages > 1 && (
          <span>
            Page {currentPage} sur {totalPages}
          </span>
        )}
      </div>

      {/* Liste des magasins */}
      {filteredAndSortedStores.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Aucun magasin ne correspond à vos critères
          </p>
        </div>
      ) : enableVirtualization ? (
        <VirtualizedStoreList
          stores={filteredAndSortedStores}
          onStoreClick={handleStoreClick}
          itemHeight={120}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {paginatedStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                onClick={() => handleStoreClick(store)}
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

OptimizedStoreGrid.displayName = "OptimizedStoreGrid";