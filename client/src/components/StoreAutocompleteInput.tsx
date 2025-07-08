import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2, Building2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GooglePlacesService, type PlaceDetails, type PlaceSuggestion } from "@/services/googlePlaces";

interface StoreAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onStoreSelect?: (storeDetails: PlaceDetails) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Composant d'autocomplétion pour la saisie de magasins
 * Combine saisie manuelle et suggestions Google Places
 */
export function StoreAutocompleteInput({
  value,
  onChange,
  onStoreSelect,
  placeholder = "Nom du magasin ou adresse...",
  disabled = false,
  className
}: StoreAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Recherche automatique après 500ms de saisie
  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Essayer d'abord Google Places API
        const googleResults = await GooglePlacesService.searchStoreSuggestions(
          value
        );
        
        if (googleResults.length > 0) {
          setSuggestions(googleResults);
          setShowSuggestions(true);
        } else {
          // Fallback sur base de données locale
          await searchLocalStores();
        }
        setSelectedIndex(-1);
      } catch (error) {
        // Fallback sur base de données locale en cas d'erreur
        await searchLocalStores();
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value]);

  // Recherche locale de fallback
  const searchLocalStores = async () => {
    try {
      // Import de la base de données exhaustive
      const { searchBelgianStores } = await import('@/data/belgianStores');
      
      // Recherche dans la base de données complète
      const localResults = searchBelgianStores(value)
        .slice(0, 8)
        .map((store, index) => ({
          placeId: `local_${store.name.replace(/[^a-zA-Z0-9]/g, '_')}_${index}`,
          name: store.name,
          address: `${store.address}, ${store.postalCode} ${store.city}`,
          types: ['store', 'grocery_or_supermarket'],
          brand: store.brand,
          city: store.city,
          postalCode: store.postalCode,
          latitude: store.latitude,
          longitude: store.longitude,
          phone: store.phone
        }));

      setSuggestions(localResults);
      setShowSuggestions(localResults.length > 0);
    } catch (error) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

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
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Sélection d'un magasin depuis les suggestions
  const handleSuggestionSelect = async (suggestion: PlaceSuggestion) => {
    if (!onStoreSelect) {
      // Si pas de callback, juste remplir le champ
      onChange(suggestion.name);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingDetails(true);
    setShowSuggestions(false);

    try {
      // Si c'est une suggestion locale, créer directement les détails
      if (suggestion.placeId.startsWith('local_')) {
        const localDetails = createLocalStoreDetails(suggestion);
        if (localDetails) {
          onStoreSelect(localDetails);
          onChange(localDetails.name);
          return;
        }
      }

      // Sinon essayer l'API Google Places
      const details = await GooglePlacesService.getPlaceDetails(suggestion.placeId);
      
      if (details) {
        // Détecter automatiquement la marque du magasin
        const detectedBrand = GooglePlacesService.detectStoreBrand(details.name);
        
        onStoreSelect({
          ...details,
          brand: detectedBrand
        } as PlaceDetails & { brand: string });
        
        onChange(details.name);
      } else {
        // Fallback sur le nom de la suggestion
        onChange(suggestion.name);
      }
    } catch (error) {
      // En cas d'erreur, utiliser le nom de la suggestion
      onChange(suggestion.name);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Créer des détails pour un magasin local
  const createLocalStoreDetails = (suggestion: PlaceSuggestion): (PlaceDetails & { brand: string }) | null => {
    const addressParts = suggestion.address.split(', ');
    const cityWithPostal = addressParts[addressParts.length - 1];
    const postalMatch = cityWithPostal.match(/(\d{4})\s+(.+)/);
    
    if (!postalMatch) return null;
    
    const postalCode = postalMatch[1];
    const city = postalMatch[2];
    const streetAddress = addressParts.slice(0, -1).join(', ');
    
    const detectedBrand = GooglePlacesService.detectStoreBrand(suggestion.name);
    
    return {
      placeId: suggestion.placeId,
      name: suggestion.name,
      address: suggestion.address,
      city: city,
      postalCode: postalCode,
      latitude: 50.8503, // Coordonnées par défaut (Bruxelles)
      longitude: 4.3517,
      brand: detectedBrand,
      types: suggestion.types
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (e.target.value.length >= 3) {
      setShowSuggestions(true);
    }
  };

  const clearInput = () => {
    onChange("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled || isLoadingDetails}
          className={`pl-10 pr-8 ${className || ""}`}
        />
        
        {/* Indicateurs de statut */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {isLoadingDetails && (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          )}
          {isSearching && !isLoadingDetails && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
          {value && !isSearching && !isLoadingDetails && (
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

      {/* Liste de suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.placeId}
              className={`p-3 cursor-pointer transition-colors ${
                index === selectedIndex 
                  ? 'bg-blue-50 dark:bg-blue-900/20' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <div className="flex items-start space-x-3">
                <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {suggestion.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {GooglePlacesService.detectStoreBrand(suggestion.name)}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{suggestion.address}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message d'état vide */}
      {showSuggestions && value.length >= 3 && suggestions.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-4 text-center">
          <Building2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aucun magasin trouvé
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Continuez à taper ou saisissez manuellement
          </p>
        </div>
      )}
    </div>
  );
}