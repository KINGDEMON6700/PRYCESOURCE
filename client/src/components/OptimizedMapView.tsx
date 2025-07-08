import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { useLocation } from "wouter";
import { useStores } from "@/hooks/useStores";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Star, Eye, Phone, Clock, MapIcon } from "lucide-react";
import type { StoreWithRating } from "@shared/schema";

// Calcul de distance entre deux points géographiques
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
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

// Création d'un marker SVG personnalisé
function createCustomMarker(storeName: string, isSelected: boolean = false): HTMLElement {
  const marker = document.createElement('div');
  marker.className = 'custom-marker';
  
  const color = getStoreColor(storeName);
  const size = isSelected ? 40 : 32;
  const borderWidth = isSelected ? 4 : 2;
  
  marker.innerHTML = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border: ${borderWidth}px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transition: all 0.2s ease;
      position: relative;
      z-index: ${isSelected ? 1000 : 100};
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `;
  
  return marker;
}

// Interface pour les props du composant Map
interface OptimizedMapProps {
  center: google.maps.LatLngLiteral;
  zoom: number;
  stores: StoreWithRating[];
  selectedStore: StoreWithRating | null;
  onStoreSelect: (store: StoreWithRating | null) => void;
  userLocation: google.maps.LatLngLiteral | null;
  navigate: (path: string) => void;
}

// Composant GoogleMap optimisé avec AdvancedMarkerElement
function OptimizedGoogleMap({ 
  center, 
  zoom, 
  stores, 
  selectedStore, 
  onStoreSelect, 
  userLocation, 
  navigate 
}: OptimizedMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialisation de la carte
  useEffect(() => {
    if (!mapRef.current || !google?.maps) return;

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#242a3a" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#242a3a" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#ffffff" }],
        },
        {
          featureType: "administrative",
          elementType: "geometry",
          stylers: [{ color: "#374151" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#374151" }],
        },
        {
          featureType: "road.highway",
          elementType: "geometry",
          stylers: [{ color: "#4f46e5" }],
        },
        {
          featureType: "road.arterial",
          elementType: "geometry",
          stylers: [{ color: "#374151" }],
        },
        {
          featureType: "road.local",
          elementType: "geometry",
          stylers: [{ color: "#374151" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#1e40af" }],
        },
      ],
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: "greedy",
      clickableIcons: false,
    });

    mapInstance.current = map;
    
    // InfoWindow pour les détails des magasins
    infoWindowRef.current = new google.maps.InfoWindow({
      disableAutoPan: false,
      pixelOffset: new google.maps.Size(0, -10),
    });

    setIsMapLoaded(true);

    // Gestionnaire d'événements de la carte
    const handleMapClick = () => {
      onStoreSelect(null);
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };

    const clickListener = map.addListener("click", handleMapClick);

    return () => {
      if (clickListener) {
        google.maps.event.removeListener(clickListener);
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [center, zoom, onStoreSelect]);

  // Gestion du marker utilisateur
  useEffect(() => {
    if (!mapInstance.current || !userLocation || !isMapLoaded) return;

    // Supprimer l'ancien marker utilisateur
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    // Créer le marker utilisateur
    userMarkerRef.current = new google.maps.Marker({
      map: mapInstance.current,
      position: userLocation,
      title: "Votre position",
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
      zIndex: 999,
    });

  }, [userLocation, isMapLoaded]);

  // Gestion des markers des magasins
  useEffect(() => {
    if (!mapInstance.current || !isMapLoaded) return;

    // Supprimer tous les anciens markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current.clear();

    // Créer les nouveaux markers
    stores.forEach(store => {
      const lat = Number(store.latitude);
      const lng = Number(store.longitude);
      
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      // Créer le marker avec icône personnalisée
      const marker = new google.maps.Marker({
        map: mapInstance.current,
        position: { lat, lng },
        title: store.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: selectedStore?.id === store.id ? 12 : 10,
          fillColor: getStoreColor(store.name),
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: selectedStore?.id === store.id ? 3 : 2,
        },
        zIndex: selectedStore?.id === store.id ? 1000 : 100,
      });

      // Gestionnaire de clic sur le marker
      marker.addListener("click", () => {
        onStoreSelect(store);
        
        // Afficher l'InfoWindow
        if (infoWindowRef.current) {
          const distance = userLocation ? 
            calculateDistance(userLocation.lat, userLocation.lng, lat, lng) : null;
          
          infoWindowRef.current.setContent(`
            <div style="
              background: #1f2937;
              color: white;
              padding: 16px;
              border-radius: 8px;
              min-width: 250px;
              max-width: 300px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
              <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${store.name}</h3>
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px;">${store.address}</p>
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 14px;">${store.city}, ${store.postalCode}</p>
              
              <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="color: #fbbf24;">★</span>
                  <span style="font-size: 14px;">${typeof store.averageRating === 'number' ? store.averageRating.toFixed(1) : 'N/A'}</span>
                  <span style="color: #9ca3af; font-size: 12px;">(${store.ratingCount || 0})</span>
                </div>
                ${distance ? `<span style="color: #9ca3af; font-size: 12px;">• ${distance.toFixed(1)} km</span>` : ''}
              </div>
              
              <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button onclick="window.location.href='/stores/${store.id}'" style="
                  background: #3b82f6;
                  color: white;
                  border: none;
                  padding: 6px 12px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 500;
                ">Voir le magasin</button>
                
                <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}', '_blank')" style="
                  background: #10b981;
                  color: white;
                  border: none;
                  padding: 6px 12px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 500;
                ">Itinéraire</button>
                
                ${store.phone ? `<button onclick="window.location.href='tel:${store.phone}'" style="
                  background: #f59e0b;
                  color: white;
                  border: none;
                  padding: 6px 12px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 500;
                ">Appeler</button>` : ''}
              </div>
            </div>
          `);
          
          infoWindowRef.current.open(mapInstance.current, marker);
        }
      });

      markersRef.current.set(store.id, marker);
    });

  }, [stores, selectedStore, userLocation, isMapLoaded, onStoreSelect]);

  // Centrer la carte sur le magasin sélectionné
  useEffect(() => {
    if (!mapInstance.current || !selectedStore) return;

    const lat = Number(selectedStore.latitude);
    const lng = Number(selectedStore.longitude);
    
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      mapInstance.current.panTo({ lat, lng });
    }
  }, [selectedStore]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '400px',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#1f2937',
        position: 'relative'
      }}
    >
      {!isMapLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '14px',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #374151',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 8px'
          }}></div>
          Chargement de la carte...
        </div>
      )}
    </div>
  );
}

// Composant principal
export default function OptimizedMapView() {
  const [, navigate] = useLocation();
  const { apiKey, isLoaded } = useGoogleMaps();
  const { data: stores = [] } = useStores();
  const [selectedStore, setSelectedStore] = useState<StoreWithRating | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [center, setCenter] = useState<google.maps.LatLngLiteral>({
    lat: 50.6402809,
    lng: 4.6667145
  });

  // Géolocalisation utilisateur
  useEffect(() => {
    if (!navigator.geolocation) return;

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    const success = (position: GeolocationPosition) => {
      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      setUserLocation(location);
      setCenter(location);
    };

    const error = () => {
      // Garder le centre par défaut (Bruxelles)
    };

    navigator.geolocation.getCurrentPosition(success, error, options);
  }, []);

  // Mémoriser les magasins avec distance
  const storesWithDistance = useMemo(() => {
    if (!userLocation) return stores;
    
    return stores
      .map(store => ({
        ...store,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          Number(store.latitude),
          Number(store.longitude)
        )
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [stores, userLocation]);

  // Gestionnaire d'erreur pour Google Maps
  const renderMapError = (status: Status) => (
    <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
      <div className="text-center">
        <MapIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-white text-sm">
          {status === Status.LOADING ? 'Chargement...' : 'Erreur de chargement de la carte'}
        </p>
      </div>
    </div>
  );

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800 rounded-lg">
        <div className="text-center">
          <MapIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-white text-sm">Clé API Google Maps non configurée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Carte Google Maps */}
      <Wrapper apiKey={apiKey} render={renderMapError}>
        <OptimizedGoogleMap
          center={center}
          zoom={13}
          stores={storesWithDistance}
          selectedStore={selectedStore}
          onStoreSelect={setSelectedStore}
          userLocation={userLocation}
          navigate={navigate}
        />
      </Wrapper>

      {/* Liste des magasins proches */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white mb-3">
          Magasins proches ({storesWithDistance.length})
        </h3>
        
        <div className="grid gap-2 max-h-64 overflow-y-auto">
          {storesWithDistance.slice(0, 10).map(store => (
            <Card 
              key={store.id} 
              className={`bg-gray-800 border-gray-700 cursor-pointer transition-all duration-200 hover:border-blue-500 ${
                selectedStore?.id === store.id ? 'border-blue-500 bg-gray-700' : ''
              }`}
              onClick={() => setSelectedStore(store)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white text-sm">{store.name}</h4>
                    <p className="text-xs text-gray-400">{store.address}</p>
                    <p className="text-xs text-gray-400">{store.city}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-300">
                          {typeof store.averageRating === 'number' ? store.averageRating.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                      
                      {store.distance && (
                        <Badge variant="secondary" className="text-xs">
                          {store.distance.toFixed(1)} km
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/stores/${store.id}`);
                      }}
                      className="h-7 px-2"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`,
                          '_blank'
                        );
                      }}
                      className="h-7 px-2"
                    >
                      <Navigation className="w-3 h-3" />
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