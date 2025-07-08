import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { StandardHeader } from "@/components/StandardHeader";
import { OptimizedStoreGrid } from "@/components/OptimizedStoreGrid";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import type { StoreWithRating } from "@shared/schema";

export default function AllStores() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch stores data
  const { data: stores = [], isLoading } = useOptimizedQuery<StoreWithRating[]>({
    queryKey: ["/api/stores"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Détection de la localisation utilisateur
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          // Gestion silencieuse des erreurs de géolocalisation
        }
      );
    }
  }, []);

  const handleStoreSelect = (store: StoreWithRating) => {
    navigate(`/stores/${store.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StandardHeader 
        title="Tous les magasins"
        showBackButton={true}
      />
      
      <div className="px-4 pt-20 pb-6">
        <OptimizedStoreGrid
          stores={stores}
          loading={isLoading}
          enableVirtualization={true}
          enableSearch={true}
          enableFilters={true}
          itemsPerPage={30}
          onStoreClick={(store) => navigate(`/stores/${store.id}`)}
        />
      </div>

      <BottomNavigation />
    </div>
  );
}