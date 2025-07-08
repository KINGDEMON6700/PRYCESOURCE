import { useEffect, useState, useCallback, useRef } from "react";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import { useLocation } from "wouter";
import { Navigation, Star, MapPin, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wrapper } from "@googlemaps/react-wrapper";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import type { StoreWithRating } from "@shared/schema";

// Calcul de la distance entre deux points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Couleurs des marques pour les markers
function getStoreColor(storeName?: string): string {
  if (!storeName) return "#ef4444";
  
  const nameLC = storeName.toLowerCase();
  
  if (nameLC.includes('aldi')) return "#00a0e6";
  if (nameLC.includes('lidl')) return "#ffcc00";
  if (nameLC.includes('delhaize')) return "#e60012";
  if (nameLC.includes('carrefour')) return "#0066cc";
  
  return "#ef4444";
}

// Interface pour les props du composant Map
interface MapProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  stores: StoreWithRating[];
  selectedStore: StoreWithRating | null;
  userLocation: google.maps.LatLngLiteral | null;
  navigate: (path: string) => void;
}

// Composant Google Map
function GoogleMap({ center, zoom, stores, selectedStore, userLocation, navigate }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<Map<number, google.maps.Marker>>(new Map());
  const [userMarker, setUserMarker] = useState<google.maps.Marker | null>(null);

  // Initialisation de la carte
  useEffect(() => {
    if (!mapRef.current || map) return;
    
    const newMap = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: [
        {
          "elementType": "geometry",
          "stylers": [{"color": "#1f2937"}]
        },
        {
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#8ec3b9"}]
        },
        {
          "elementType": "labels.text.stroke",
          "stylers": [{"color": "#1a7e76"}]
        },
        {
          "featureType": "administrative",
          "elementType": "geometry.stroke",
          "stylers": [{"color": "#1a7e76"}]
        },
        {
          "featureType": "administrative.land_parcel",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#64748b"}]
        },
        {
          "featureType": "water",
          "elementType": "geometry",
          "stylers": [{"color": "#0f172a"}]
        },
        {
          "featureType": "water",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#515c6d"}]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    setMap(newMap);
  }, [center, zoom, map]);

  // Gestion des markers des magasins
  useEffect(() => {
    if (!map) return;

    // Nettoyer les anciens markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers = new Map<number, google.maps.Marker>();

    // Créer les nouveaux markers
    stores.forEach(store => {
      const lat = Number(store.latitude);
      const lng = Number(store.longitude);
      
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: store.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: selectedStore?.id === store.id ? 15 : 12,
          fillColor: getStoreColor(store.name),
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: selectedStore?.id === store.id ? 3 : 2,
        },
        zIndex: selectedStore?.id === store.id ? 1000 : 100,
      });

      marker.addListener('click', () => {
        navigate(`/stores/${store.id}`);
      });

      newMarkers.set(store.id, marker);
    });

    setMarkers(newMarkers);
  }, [map, stores, selectedStore, navigate]);

  // Marker utilisateur
  useEffect(() => {
    if (!map || !userLocation) return;

    // Supprimer l'ancien marker utilisateur
    if (userMarker) {
      userMarker.setMap(null);
    }

    // Créer le nouveau marker utilisateur
    const newUserMarker = new google.maps.Marker({
      position: userLocation,
      map,
      title: "Votre position",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
      zIndex: 999,
    });

    setUserMarker(newUserMarker);
  }, [map, userLocation, userMarker]);

  return (
    <div 
      ref={mapRef}
      style={{ width: "100%", height: "400px" }}
    />
  );
}

// Composant principal MapViewGoogle
export default function MapViewGoogle() {
  const { apiKey } = useGoogleMaps();
  const [, navigate] = useLocation();
  const [selectedStore, setSelectedStore] = useState<StoreWithRating | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);

  // Récupérer les magasins
  const { data: stores = [], isLoading } = useOptimizedQuery<StoreWithRating[]>({
    queryKey: ['/api/stores'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Géolocalisation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Fallback vers Bruxelles
          setUserLocation({ lat: 50.8503, lng: 4.3517 });
        }
      );
    } else {
      setUserLocation({ lat: 50.8503, lng: 4.3517 });
    }
  }, []);

  // Calculer les magasins proches
  const nearbyStores = userLocation ? stores
    .map(store => ({
      ...store,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        Number(store.latitude),
        Number(store.longitude)
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10) : [];

  const handleViewStore = useCallback((store: StoreWithRating) => {
    navigate(`/stores/${store.id}`);
  }, [navigate]);

  const handleOpenGPS = useCallback((store: StoreWithRating) => {
    const lat = Number(store.latitude);
    const lng = Number(store.longitude);
    
    if (navigator.userAgent.includes('Mobile')) {
      // Mobile: ouvrir Waze ou Google Maps
      window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
    } else {
      // Desktop: ouvrir Google Maps
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Clé API Google Maps non configurée</p>
      </div>
    );
  }

  const center = userLocation || { lat: 50.8503, lng: 4.3517 };

  return (
    <div className="space-y-4">
      <Wrapper apiKey={apiKey}>
        <GoogleMap 
          center={center}
          zoom={12}
          stores={stores}
          selectedStore={selectedStore}
          userLocation={userLocation}
          navigate={navigate}
        />
      </Wrapper>

      {/* Liste des magasins proches */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white">Magasins proches</h3>
        <div className="space-y-2">
          {nearbyStores.map(store => (
            <Card key={store.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{store.name}</h4>
                    <p className="text-sm text-gray-400">{store.address}, {store.city}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-300">
                          {typeof store.averageRating === 'number' ? store.averageRating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        • {store.distance ? `${store.distance.toFixed(1)} km` : 'Distance inconnue'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStore(store)}
                      className="p-2"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenGPS(store)}
                      className="p-2"
                    >
                      <Navigation className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}