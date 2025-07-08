import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, Search } from "lucide-react";
import type { InsertStore } from "@shared/schema";

interface StoreTemplate {
  name: string;
  brand: string;
  address: string;
  city: string;
  postalCode: string;
  phone?: string;
  latitude: string;
  longitude: string;
  openingHours: Record<string, string>;
}

const belgianStoreTemplates: Record<string, StoreTemplate[]> = {
  "aldi": [
    {
      name: "Aldi Bruxelles Centre",
      brand: "aldi",
      address: "Rue Neuve 123",
      city: "Bruxelles",
      postalCode: "1000",
      phone: "+32 2 123 45 67",
      latitude: "50.8503",
      longitude: "4.3517",
      openingHours: {
        monday: "08:00-20:00",
        tuesday: "08:00-20:00",
        wednesday: "08:00-20:00",
        thursday: "08:00-20:00",
        friday: "08:00-20:00",
        saturday: "08:00-20:00",
        sunday: "09:00-18:00"
      }
    },
    {
      name: "Aldi Anvers Nord",
      brand: "aldi",
      address: "Noorderlaan 45",
      city: "Anvers",
      postalCode: "2030",
      phone: "+32 3 234 56 78",
      latitude: "51.2213",
      longitude: "4.4051",
      openingHours: {
        monday: "08:00-20:00",
        tuesday: "08:00-20:00",
        wednesday: "08:00-20:00",
        thursday: "08:00-20:00",
        friday: "08:00-20:00",
        saturday: "08:00-20:00",
        sunday: "09:00-18:00"
      }
    }
  ],
  "lidl": [
    {
      name: "Lidl Gand Centre",
      brand: "lidl",
      address: "Korenlei 78",
      city: "Gand",
      postalCode: "9000",
      phone: "+32 9 345 67 89",
      latitude: "51.0543",
      longitude: "3.7174",
      openingHours: {
        monday: "08:00-20:00",
        tuesday: "08:00-20:00",
        wednesday: "08:00-20:00",
        thursday: "08:00-20:00",
        friday: "08:00-20:00",
        saturday: "08:00-20:00",
        sunday: "Fermé"
      }
    },
    {
      name: "Lidl Liège Sud",
      brand: "lidl",
      address: "Boulevard de la Sauvenière 89",
      city: "Liège",
      postalCode: "4000",
      phone: "+32 4 456 78 90",
      latitude: "50.6326",
      longitude: "5.5797",
      openingHours: {
        monday: "08:00-21:00",
        tuesday: "08:00-21:00",
        wednesday: "08:00-21:00",
        thursday: "08:00-21:00",
        friday: "08:00-21:00",
        saturday: "08:00-21:00",
        sunday: "Fermé"
      }
    }
  ],
  "delhaize": [
    {
      name: "Delhaize Uccle",
      brand: "delhaize",
      address: "Chaussée de Waterloo 234",
      city: "Uccle",
      postalCode: "1180",
      phone: "+32 2 567 89 01",
      latitude: "50.7982",
      longitude: "4.3441",
      openingHours: {
        monday: "07:30-21:00",
        tuesday: "07:30-21:00",
        wednesday: "07:30-21:00",
        thursday: "07:30-21:00",
        friday: "07:30-21:00",
        saturday: "07:30-21:00",
        sunday: "08:00-20:00"
      }
    },
    {
      name: "Delhaize Namur Centre",
      brand: "delhaize",
      address: "Rue de Fer 56",
      city: "Namur",
      postalCode: "5000",
      phone: "+32 81 678 90 12",
      latitude: "50.4674",
      longitude: "4.8720",
      openingHours: {
        monday: "08:00-20:00",
        tuesday: "08:00-20:00",
        wednesday: "08:00-20:00",
        thursday: "08:00-20:00",
        friday: "08:00-20:00",
        saturday: "08:00-20:00",
        sunday: "09:00-18:00"
      }
    }
  ],
  "carrefour": [
    {
      name: "Carrefour Charleroi",
      brand: "carrefour",
      address: "Rue de la Montagne 123",
      city: "Charleroi",
      postalCode: "6000",
      phone: "+32 71 789 01 23",
      latitude: "50.4108",
      longitude: "4.4446",
      openingHours: {
        monday: "08:30-21:00",
        tuesday: "08:30-21:00",
        wednesday: "08:30-21:00",
        thursday: "08:30-21:00",
        friday: "08:30-21:00",
        saturday: "08:30-21:00",
        sunday: "09:00-18:00"
      }
    },
    {
      name: "Carrefour Louvain-la-Neuve",
      brand: "carrefour",
      address: "Place de l'Université 12",
      city: "Louvain-la-Neuve",
      postalCode: "1348",
      phone: "+32 10 890 12 34",
      latitude: "50.6692",
      longitude: "4.6118",
      openingHours: {
        monday: "09:00-20:00",
        tuesday: "09:00-20:00",
        wednesday: "09:00-20:00",
        thursday: "09:00-20:00",
        friday: "09:00-20:00",
        saturday: "09:00-20:00",
        sunday: "10:00-18:00"
      }
    }
  ]
};

interface StoreSearchFormProps {
  onSelect: (store: InsertStore) => void;
  onCancel: () => void;
}

export function StoreSearchForm({ onSelect, onCancel }: StoreSearchFormProps) {
  const [searchCity, setSearchCity] = useState("");
  const [searchBrand, setSearchBrand] = useState("");
  const [searchResults, setSearchResults] = useState<StoreTemplate[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    
    let results: StoreTemplate[] = [];
    
    // Recherche par ville et marque
    Object.entries(belgianStoreTemplates).forEach(([brand, stores]) => {
      if (searchBrand && brand?.toLowerCase() !== searchBrand?.toLowerCase()) {
        return;
      }
      
      const filteredStores = stores.filter(store => {
        if (searchCity) {
          return store.city?.toLowerCase().includes(searchCity?.toLowerCase() || '') ||
                 store.address?.toLowerCase().includes(searchCity?.toLowerCase() || '');
        }
        return true;
      });
      
      results = [...results, ...filteredStores];
    });
    
    // Si pas de critères spécifiques, afficher quelques suggestions
    if (!searchCity && !searchBrand) {
      results = Object.values(belgianStoreTemplates).flat().slice(0, 6);
    }
    
    setTimeout(() => {
      setSearchResults(results);
      setIsSearching(false);
    }, 500); // Simulation d'un délai de recherche
  };

  const handleSelectStore = (template: StoreTemplate) => {
    const storeData: InsertStore = {
      name: template.name,
      brand: template.brand,
      address: template.address,
      city: template.city,
      postalCode: template.postalCode,
      phone: template.phone,
      latitude: template.latitude,
      longitude: template.longitude,
      openingHours: template.openingHours
    };
    
    onSelect(storeData);
  };

  return (
    <div className="space-y-6">
      {/* Formulaire de recherche */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Ville</Label>
          <Input
            id="city"
            placeholder="ex: Bruxelles, Anvers..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="brand">Marque</Label>
          <select
            id="brand"
            value={searchBrand}
            onChange={(e) => setSearchBrand(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          >
            <option value="">Toutes les marques</option>
            <option value="aldi">Aldi</option>
            <option value="lidl">Lidl</option>
            <option value="delhaize">Delhaize</option>
            <option value="carrefour">Carrefour</option>
          </select>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button onClick={handleSearch} disabled={isSearching} className="flex-1">
          <Search className="h-4 w-4 mr-2" />
          {isSearching ? "Recherche..." : "Rechercher"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Résultats trouvés ({searchResults.length})</h3>
          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {searchResults.map((store, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelectStore(store)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{store.name}</CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {store.brand}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span>{store.address}, {store.postalCode} {store.city}</span>
                    </div>
                    {store.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span>{store.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span>Lun-Sam: {store.openingHours.monday || "Fermé"}</span>
                    </div>
                  </div>
                  <Button size="sm" className="w-full mt-3">
                    Sélectionner ce magasin
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isSearching && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Recherche de magasins...</p>
        </div>
      )}

      {searchResults.length === 0 && !isSearching && searchCity && (
        <div className="text-center py-8">
          <p className="text-gray-600">Aucun magasin trouvé pour vos critères.</p>
          <p className="text-sm text-gray-500 mt-1">Essayez avec une autre ville ou marque.</p>
        </div>
      )}
    </div>
  );
}