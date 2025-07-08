import { memo, useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { StoreCard } from "./StoreCard";
import { MapViewGoogle } from "./MapViewGoogle";
import { useDebounce, useThrottle } from "@/hooks/usePerformanceOptimization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, List, Grid, Filter } from "lucide-react";
import type { StoreWithRating } from "@shared/schema";

interface OptimizedStoreMapProps {
  stores: StoreWithRating[];
  userLocation?: { lat: number; lng: number };
  onStoreSelect?: (store: StoreWithRating) => void;
  enableVirtualization?: boolean;
  maxStoresShown?: number;
}

export const OptimizedStoreMap = memo(({
  stores,
  userLocation,
  onStoreSelect,
  enableVirtualization = true,
  maxStoresShown = 50
}: OptimizedStoreMapProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState<StoreWithRating | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'split'>('split');
  const [filterBy, setFilterBy] = useState<'all' | 'distance' | 'rating'>('all');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Optimisation de la liste des magasins affichés
  const optimizedStores = useMemo(() => {
    let filtered = stores;

    // Recherche
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchLower) ||
        store.brand?.toLowerCase().includes(searchLower) ||
        store.city?.toLowerCase().includes(searchLower)
      );
    }

    // Tri et limitation pour performance
    filtered = filtered
      .sort((a, b) => (a.distance || 999) - (b.distance || 999))
      .slice(0, maxStoresShown);

    return filtered;
  }, [stores, debouncedSearchTerm, maxStoresShown]);

  // Gestion du throttling pour les événements map
  const throttledMapChange = useThrottle((bounds: any) => {
    // Logique de mise à jour des bounds si nécessaire
  }, 300);

  const handleStoreClick = useCallback((store: StoreWithRating) => {
    setSelectedStore(store);
    onStoreSelect?.(store);
  }, [onStoreSelect]);

  // Lazy loading pour les composants map
  const { ref: mapRef, inView: mapInView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  const { ref: listRef, inView: listInView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  if (stores.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Aucun magasin disponible
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Contrôles de recherche et vue */}
      <div className="flex flex-col sm:flex-row gap-4 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher des magasins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
          >
            <MapPin className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'split' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('split')}
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="px-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {optimizedStores.length} magasin{optimizedStores.length > 1 ? 's' : ''} trouvé{optimizedStores.length > 1 ? 's' : ''}
          {maxStoresShown < stores.length && ` (${maxStoresShown} premiers affichés)`}
        </p>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 flex gap-4 p-4 pt-0">
        {/* Carte */}
        {(viewMode === 'map' || viewMode === 'split') && (
          <div 
            ref={mapRef}
            className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full min-h-[500px]`}
          >
            {mapInView && (
              <Card className="h-full">
                <CardContent className="p-0 h-full">
                  <MapViewGoogle
                    stores={optimizedStores}
                    userLocation={userLocation}
                    selectedStore={selectedStore}
                    onStoreSelect={handleStoreClick}
                    onMapLoad={() => setIsMapLoaded(true)}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Liste */}
        {(viewMode === 'list' || viewMode === 'split') && (
          <div 
            ref={listRef}
            className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full`}
          >
            {listInView && (
              <div className="space-y-4 h-full overflow-y-auto">
                {optimizedStores.map((store) => (
                  <div
                    key={store.id}
                    className={`transition-all duration-200 ${
                      selectedStore?.id === store.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <StoreCard
                      store={store}
                      onClick={() => handleStoreClick(store)}
                    />
                  </div>
                ))}
                
                {optimizedStores.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      Aucun magasin ne correspond à votre recherche
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

OptimizedStoreMap.displayName = "OptimizedStoreMap";