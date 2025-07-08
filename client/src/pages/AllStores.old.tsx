import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { UnifiedHeader } from "@/components/UnifiedHeader";
import { IntelligentStoreSearch } from "@/components/IntelligentStoreSearch";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import type { StoreWithRating } from "@shared/schema";

export default function AllStores() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get user's location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {

          // Fallback to Brussels coordinates if geolocation fails
          setUserLocation({
            latitude: 50.8503,
            longitude: 4.3517,
          });
        }
      );
    } else {
      // Fallback to Brussels coordinates if geolocation not supported
      setUserLocation({
        latitude: 50.8503,
        longitude: 4.3517,
      });
    }
  }, []);

  // Get all stores
  const { data: allStores = [], isLoading } = useQuery<StoreWithRating[]>({
    queryKey: ["/api/stores"],
    retry: (failureCount: number, error: Error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
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

  // Calculate distances and sort stores
  const storesWithDistance = allStores.map((store: StoreWithRating) => {
    if (userLocation) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        parseFloat(store.latitude.toString()),
        parseFloat(store.longitude.toString())
      );
      return { ...store, distance };
    }
    return store;
  }).sort((a: StoreWithRating, b: StoreWithRating) => {
    if (a.distance && b.distance) {
      return a.distance - b.distance;
    }
    return 0;
  });

  // Get unique brands
  const brands = Array.from(new Set(allStores.map((s: StoreWithRating) => s.brand))).filter(Boolean);

  // Filter stores based on search and brand
  const filteredStores = storesWithDistance.filter((store: StoreWithRating) => {
    const matchesSearch = !searchQuery || 
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBrand = !selectedBrand || store.brand === selectedBrand;
    
    return matchesSearch && matchesBrand;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrand("");
  };

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  const getBrandColor = (brand: string) => {
    const colors: Record<string, string> = {
      'delhaize': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'aldi': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'lidl': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'carrefour': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[brand] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 max-w-sm mx-auto w-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tous les magasins
            </h1>
            <div className="ml-auto flex items-center space-x-1">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {userLocation ? "Position détectée" : "Position par défaut"}
              </span>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, ville ou adresse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Filters */}
        <div className="px-4 pb-3">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <Button
              variant={!selectedBrand ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedBrand("")}
            >
              Tous
            </Button>
            {brands.map((brand) => (
              <Button
                key={brand}
                variant={selectedBrand === brand ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBrand(brand)}
                className="whitespace-nowrap"
              >
                {brand.charAt(0).toUpperCase() + brand.slice(1)}
              </Button>
            ))}
            {(searchQuery || selectedBrand) && (
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
            {filteredStores.length} magasin{filteredStores.length > 1 ? 's' : ''} trouvé{filteredStores.length > 1 ? 's' : ''}
            {searchQuery && ` pour "${searchQuery}"`}
            {selectedBrand && ` (${selectedBrand})`}
            {userLocation && " • Triés par distance"}
          </p>
        </div>
      </div>

      {/* Stores List */}
      <div className="p-4">
        {filteredStores.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucun magasin trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery || selectedBrand
                  ? "Essayez de modifier vos critères de recherche."
                  : "Aucun magasin n'est disponible pour le moment."
                }
              </p>
              {(searchQuery || selectedBrand) && (
                <Button onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredStores.map((store) => (
              <Card
                key={store.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/stores/${store.id}/products`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <img
                        src={`/logos/${store.brand}-logo.svg`}
                        alt={store.brand}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling!.textContent = store.brand.charAt(0).toUpperCase();
                        }}
                      />
                      <span className="text-xl font-bold text-gray-600 dark:text-gray-300 hidden">
                        {store.brand.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {store.name}
                        </h3>

                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                        {store.address}
                      </p>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {store.city} • {store.postalCode}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm font-medium text-yellow-600">
                            {Number(store.averageRating || 0).toFixed(1)}
                          </span>
                          <span className="text-yellow-500">★</span>
                          <span className="text-xs text-gray-500">
                            ({Number(store.ratingCount || 0)})
                          </span>
                        </div>
                        
                        {store.distance && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-blue-600" />
                            <span className="text-sm text-blue-600 font-medium">
                              {store.distance.toFixed(1)} km
                            </span>
                          </div>
                        )}
                      </div>
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