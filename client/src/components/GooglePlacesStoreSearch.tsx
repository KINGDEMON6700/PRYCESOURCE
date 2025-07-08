import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2, Building2, Clock, Star, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GooglePlacesService, type PlaceDetails, type PlaceSuggestion } from "@/services/googlePlaces";
import { useToast } from "@/hooks/use-toast";
import { getCategoryInfo, type StoreCategoryKey } from "@/lib/storeCategories";

interface GooglePlacesStoreSearchProps {
  onStoreSelect: (storeDetails: PlaceDetails) => void;
  onClose: () => void;
  userLocation?: { lat: number; lng: number };
}

/**
 * Composant de recherche de magasins via Google Places API
 * Permet aux administrateurs d'ajouter facilement des magasins avec données complètes
 */
export function GooglePlacesStoreSearch({ 
  onStoreSelect, 
  onClose, 
  userLocation 
}: GooglePlacesStoreSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const { toast } = useToast();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Recherche automatique après 500ms de saisie
  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await GooglePlacesService.searchStoreSuggestions(
          query,
          userLocation
        );
        setSuggestions(results);
      } catch (error) {
        toast({
          title: "Recherche indisponible",
          description: "Service de recherche temporairement indisponible. Utilisez la saisie manuelle.",
          variant: "destructive"
        });
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, userLocation, toast]);

  // Sélection d'un magasin et récupération des détails complets
  const handleStoreSelection = async (suggestion: PlaceSuggestion) => {
    setIsLoadingDetails(true);
    setSelectedSuggestion(suggestion.placeId);

    try {
      const details = await GooglePlacesService.getPlaceDetails(suggestion.placeId);
      
      if (details) {
        // Détecter automatiquement la marque du magasin
        const detectedBrand = GooglePlacesService.detectStoreBrand(details.name);
        
        onStoreSelect({
          ...details,
          brand: detectedBrand
        } as PlaceDetails & { brand: string });
        
        toast({
          title: "Magasin sélectionné",
          description: `Détails récupérés pour ${details.name}`,
        });
      } else {
        throw new Error("Impossible de récupérer les détails du magasin");
      }
    } catch (error) {

      toast({
        title: "Erreur",
        description: "Impossible de récupérer les détails du magasin.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDetails(false);
      setSelectedSuggestion(null);
    }
  };

  // Suggestions rapides par marque
  const quickSearchBrands = [
    "Aldi", "Lidl", "Delhaize", "Carrefour", "Colruyt", 
    "McDonald's", "Burger King", "KFC", "Quick", "Shell"
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Rechercher un magasin</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher un magasin (ex: Delhaize Bruxelles)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          autoFocus
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-600" />
        )}
      </div>

      {/* Recherches rapides par marque */}
      {query.length === 0 && (
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Recherche rapide par marque :</p>
            <div className="flex flex-wrap gap-2">
              {quickSearchBrands.map((brand) => (
                <Button
                  key={brand}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(brand)}
                  className="text-xs"
                >
                  {brand}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Instructions pour l'utilisateur */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Conseils de recherche :</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Tapez le nom de la marque (ex: "Delhaize", "McDonald's", "KFC")</li>
                  <li>Ajoutez une ville pour cibler une zone (ex: "Lidl Bruxelles")</li>
                  <li>Utilisez l'adresse complète pour plus de précision</li>
                  <li>Essayez différentes variantes si aucun résultat (ex: "Carrefour Market")</li>
                  <li>Incluez le type d'établissement (ex: "Shell station", "Burger King restaurant")</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Résultats de recherche */}
      {suggestions.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {suggestions.length} magasin{suggestions.length > 1 ? 's' : ''} trouvé{suggestions.length > 1 ? 's' : ''}
          </p>
          
          {suggestions.map((suggestion) => (
            <Card 
              key={suggestion.placeId} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleStoreSelection(suggestion)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {suggestion.name}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {GooglePlacesService.detectStoreBrand(suggestion.name)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{suggestion.address}</span>
                    </div>
                  </div>
                  
                  {isLoadingDetails && selectedSuggestion === suggestion.placeId ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600 ml-2" />
                  ) : (
                    <Button size="sm" variant="outline" className="ml-2">
                      Sélectionner
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* État vide */}
      {query.length >= 3 && suggestions.length === 0 && !isSearching && (
        <div className="text-center py-8">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun magasin trouvé
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            Essayez avec un autre nom ou une autre localité
          </p>
        </div>
      )}
    </div>
  );
}