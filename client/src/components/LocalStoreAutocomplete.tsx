import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2, Building2, X, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface LocalStoreData {
  id?: number;
  name: string;
  brand: string;
  address: string;
  city: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  distance?: number;
  isExisting?: boolean;
}

interface LocalStoreAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onStoreSelect?: (storeDetails: LocalStoreData) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Base de données locale de magasins belges populaires
const belgianStoreTemplates: LocalStoreData[] = [
  // Bruxelles
  { name: "Delhaize Bruxelles Centre", brand: "delhaize", address: "Rue Neuve 120", city: "Bruxelles", postalCode: "1000", latitude: 50.8503, longitude: 4.3517 },
  { name: "Carrefour Bruxelles Toison d'Or", brand: "carrefour", address: "Avenue de la Toison d'Or 15", city: "Bruxelles", postalCode: "1050", latitude: 50.8267, longitude: 4.3591 },
  { name: "Aldi Bruxelles Molière", brand: "aldi", address: "Chaussée de Charleroi 132", city: "Bruxelles", postalCode: "1060", latitude: 50.8263, longitude: 4.3342 },
  { name: "Lidl Bruxelles Flagey", brand: "lidl", address: "Place Eugène Flagey 18", city: "Bruxelles", postalCode: "1050", latitude: 50.8275, longitude: 4.3722 },
  
  // Anvers
  { name: "Delhaize Anvers Central", brand: "delhaize", address: "Meir 78", city: "Anvers", postalCode: "2000", latitude: 51.2194, longitude: 4.4025 },
  { name: "Carrefour Anvers Groenplaats", brand: "carrefour", address: "Groenplaats 21", city: "Anvers", postalCode: "2000", latitude: 51.2201, longitude: 4.4009 },
  { name: "Aldi Anvers Berchem", brand: "aldi", address: "Grote Steenweg 204", city: "Anvers", postalCode: "2600", latitude: 51.1945, longitude: 4.4205 },
  { name: "Lidl Anvers Wilrijk", brand: "lidl", address: "Boomsesteenweg 67", city: "Anvers", postalCode: "2610", latitude: 51.1693, longitude: 4.3955 },
  
  // Gand
  { name: "Delhaize Gand Korenmarkt", brand: "delhaize", address: "Korenmarkt 16", city: "Gand", postalCode: "9000", latitude: 51.0543, longitude: 3.7174 },
  { name: "Carrefour Gand Zuid", brand: "carrefour", address: "Woodrow Wilsonplein 4", city: "Gand", postalCode: "9000", latitude: 51.0355, longitude: 3.7105 },
  { name: "Aldi Gand Dampoort", brand: "aldi", address: "Dampoortstraat 15", city: "Gand", postalCode: "9000", latitude: 51.0613, longitude: 3.7416 },
  
  // Liège
  { name: "Delhaize Liège Centre", brand: "delhaize", address: "Rue de la Cathédrale 85", city: "Liège", postalCode: "4000", latitude: 50.6426, longitude: 5.5740 },
  { name: "Carrefour Liège Médiacité", brand: "carrefour", address: "Boulevard Raymond Poincaré 7", city: "Liège", postalCode: "4020", latitude: 50.6310, longitude: 5.5687 },
  { name: "Lidl Liège Sclessin", brand: "lidl", address: "Rue de Sclessin 59", city: "Liège", postalCode: "4000", latitude: 50.6145, longitude: 5.5389 },
  
  // Charleroi
  { name: "Delhaize Charleroi Centre", brand: "delhaize", address: "Boulevard Tirou 167", city: "Charleroi", postalCode: "6000", latitude: 50.4108, longitude: 4.4446 },
  { name: "Carrefour Charleroi Ville 2", brand: "carrefour", address: "Boulevard Tirou 132", city: "Charleroi", postalCode: "6000", latitude: 50.4118, longitude: 4.4439 },
  { name: "Aldi Charleroi Marcinelle", brand: "aldi", address: "Chaussée de Lodelinsart 181", city: "Charleroi", postalCode: "6001", latitude: 50.3980, longitude: 4.4159 },
  
  // Mons
  { name: "Delhaize Mons Centre", brand: "delhaize", address: "Rue de Nimy 7", city: "Mons", postalCode: "7000", latitude: 50.4542, longitude: 3.9516 },
  { name: "Carrefour Mons Grands Prés", brand: "carrefour", address: "Avenue du Tir 77", city: "Mons", postalCode: "7000", latitude: 50.4661, longitude: 3.9244 },
  { name: "Lidl Mons Jemappes", brand: "lidl", address: "Rue de l'Enseignement 2", city: "Mons", postalCode: "7012", latitude: 50.4483, longitude: 3.8874 },
  
  // Namur
  { name: "Delhaize Namur Centre", brand: "delhaize", address: "Rue de Fer 87", city: "Namur", postalCode: "5000", latitude: 50.4674, longitude: 4.8720 },
  { name: "Carrefour Namur Les Moulins", brand: "carrefour", address: "Chaussée de Liège 625", city: "Namur", postalCode: "5100", latitude: 50.4797, longitude: 4.8533 },
  
  // Bruges
  { name: "Delhaize Bruges Centre", brand: "delhaize", address: "Noordzandstraat 4", city: "Bruges", postalCode: "8000", latitude: 51.2093, longitude: 3.2247 },
  { name: "Carrefour Bruges Sint-Pieters", brand: "carrefour", address: "Sint-Pieterskaai 60", city: "Bruges", postalCode: "8000", latitude: 51.2029, longitude: 3.2191 },
  
  // Louvain
  { name: "Delhaize Louvain Bondgenotenlaan", brand: "delhaize", address: "Bondgenotenlaan 84", city: "Louvain", postalCode: "3000", latitude: 50.8798, longitude: 4.7005 },
  { name: "Carrefour Louvain Ring", brand: "carrefour", address: "Diestsesteenweg 92", city: "Louvain", postalCode: "3000", latitude: 50.8909, longitude: 4.7213 },
];

/**
 * Composant d'autocomplétion pour les magasins avec fallback local
 * Utilise les magasins existants et une base de données locale
 */
export function LocalStoreAutocomplete({
  value,
  onChange,
  onStoreSelect,
  placeholder = "Nom du magasin ou ville...",
  disabled = false,
  className
}: LocalStoreAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocalStoreData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Obtenir la géolocalisation de l'utilisateur
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
          // Fallback vers Bruxelles si géolocalisation échoue
          setUserLocation({ lat: 50.8503, lng: 4.3517 });
        }
      );
    }
  }, []);

  // Fonction pour calculer la distance
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Recherche dans magasins existants et templates locaux
  useEffect(() => {
    if (value.length < 2) {
      // Afficher les magasins proches si pas de recherche
      if (userLocation) {
        const nearbyStores = belgianStoreTemplates
          .map(store => ({
            ...store,
            distance: store.latitude && store.longitude ? 
              calculateDistance(userLocation.lat, userLocation.lng, store.latitude, store.longitude) : 999
          }))
          .sort((a, b) => (a.distance || 999) - (b.distance || 999))
          .slice(0, 5);
        setSuggestions(nearbyStores);
        setShowSuggestions(true);
      }
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Rechercher dans les magasins existants via API
        const existingStores = await apiRequest("GET", `/api/stores?search=${encodeURIComponent(value)}`);
        
        // Rechercher dans les templates locaux
        const localMatches = belgianStoreTemplates.filter(store => 
          store.name.toLowerCase().includes(value.toLowerCase()) ||
          store.city.toLowerCase().includes(value.toLowerCase()) ||
          store.brand.toLowerCase().includes(value.toLowerCase()) ||
          store.address.toLowerCase().includes(value.toLowerCase())
        );

        // Calculer les distances si géolocalisation disponible
        const enrichedExisting = existingStores.map((store: any) => ({
          ...store,
          isExisting: true,
          distance: userLocation && store.latitude && store.longitude ? 
            calculateDistance(userLocation.lat, userLocation.lng, store.latitude, store.longitude) : 999
        }));

        const enrichedLocal = localMatches.map(store => ({
          ...store,
          distance: userLocation && store.latitude && store.longitude ? 
            calculateDistance(userLocation.lat, userLocation.lng, store.latitude, store.longitude) : 999
        }));

        // Combiner et trier par distance
        const allSuggestions = [...enrichedExisting, ...enrichedLocal]
          .sort((a, b) => (a.distance || 999) - (b.distance || 999))
          .slice(0, 8);

        setSuggestions(allSuggestions);
        setShowSuggestions(allSuggestions.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        // Fallback sur templates locaux seulement
        const localMatches = belgianStoreTemplates.filter(store => 
          store.name.toLowerCase().includes(value.toLowerCase()) ||
          store.city.toLowerCase().includes(value.toLowerCase()) ||
          store.brand.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 5);
        
        setSuggestions(localMatches);
        setShowSuggestions(localMatches.length > 0);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value, userLocation]);

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Gestion clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleStoreSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Sélection d'un magasin
  const handleStoreSelect = (store: LocalStoreData) => {
    onChange(store.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    if (onStoreSelect) {
      onStoreSelect(store);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const clearInput = () => {
    onChange("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const detectGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          
          // Afficher magasins proches après détection
          const nearbyStores = belgianStoreTemplates
            .map(store => ({
              ...store,
              distance: store.latitude && store.longitude ? 
                calculateDistance(position.coords.latitude, position.coords.longitude, store.latitude, store.longitude) : 999
            }))
            .sort((a, b) => (a.distance || 999) - (b.distance || 999))
            .slice(0, 8);
          
          setSuggestions(nearbyStores);
          setShowSuggestions(true);
        },
        () => {
          // Erreur géolocalisation - utiliser Bruxelles par défaut
        }
      );
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => (value.length >= 2 || suggestions.length > 0) && setShowSuggestions(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={`pl-10 pr-8 ${className || ""}`}
          />
          
          {/* Indicateurs de statut */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
            {value && !isSearching && (
              <button
                type="button"
                onClick={clearInput}
                className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detectGeoLocation}
          className="flex-shrink-0"
          title="Magasins près de moi"
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>

      {/* Liste de suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.name}-${suggestion.city}-${index}`}
              className={`p-3 cursor-pointer transition-colors ${
                index === selectedIndex 
                  ? 'bg-blue-50 dark:bg-blue-900/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleStoreSelect(suggestion)}
            >
              <div className="flex items-start space-x-3">
                <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {suggestion.name}
                    </span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {suggestion.brand}
                    </Badge>
                    {suggestion.isExisting && (
                      <Badge variant="outline" className="text-xs">
                        Existant
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{suggestion.address}, {suggestion.city}</span>
                    {suggestion.distance && suggestion.distance < 100 && (
                      <span className="text-xs text-blue-600 ml-2">
                        ~{suggestion.distance.toFixed(1)}km
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message d'état vide */}
      {showSuggestions && value.length >= 2 && suggestions.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-4 text-center">
          <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aucun magasin trouvé
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Continuez à taper ou utilisez la géolocalisation
          </p>
        </div>
      )}
    </div>
  );
}