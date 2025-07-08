import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Store, Navigation, Clock } from "lucide-react";
import type { InsertStore } from "@shared/schema";

interface SimpleStoreSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (store: InsertStore) => void;
}

// Calcul de distance haversine optimisé
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

// Base de données étendue de magasins belges avec géolocalisation précise
const storeTemplates = [
  // BRUXELLES ET ALENTOURS
  {
    name: "Aldi Bruxelles Centre",
    brand: "aldi",
    address: "Rue Neuve 123",
    city: "Bruxelles",
    postalCode: "1000",
    latitude: "50.8503",
    longitude: "4.3517",
    phone: "+32 2 219 45 67",
    openingHours: { monday: "08:30-20:00", tuesday: "08:30-20:00", wednesday: "08:30-20:00", thursday: "08:30-20:00", friday: "08:30-20:00", saturday: "08:30-20:00", sunday: "09:00-18:00" }
  },
  {
    name: "Delhaize Ixelles",
    brand: "delhaize",
    address: "Chaussée d'Ixelles 89",
    city: "Ixelles",
    postalCode: "1050",
    latitude: "50.8262",
    longitude: "4.3716",
    phone: "+32 2 511 78 90",
    openingHours: { monday: "09:00-19:00", tuesday: "09:00-19:00", wednesday: "09:00-19:00", thursday: "09:00-19:00", friday: "09:00-20:00", saturday: "09:00-19:00", sunday: "09:00-18:00" }
  },
  {
    name: "Lidl Schaerbeek",
    brand: "lidl",
    address: "Chaussée de Haecht 456",
    city: "Schaerbeek",
    postalCode: "1030",
    latitude: "50.8676",
    longitude: "4.3834",
    phone: "+32 2 245 32 10",
    openingHours: { monday: "08:00-20:00", tuesday: "08:00-20:00", wednesday: "08:00-20:00", thursday: "08:00-20:00", friday: "08:00-20:00", saturday: "08:00-20:00", sunday: "09:00-18:00" }
  },
  {
    name: "Carrefour Evere",
    brand: "carrefour",
    address: "Boulevard Lambermont 1",
    city: "Evere",
    postalCode: "1140",
    latitude: "50.8744",
    longitude: "4.4011",
    phone: "+32 2 726 45 78",
    openingHours: { monday: "08:00-21:00", tuesday: "08:00-21:00", wednesday: "08:00-21:00", thursday: "08:00-21:00", friday: "08:00-21:00", saturday: "08:00-21:00", sunday: "09:00-19:00" }
  },

  // WALLONIE
  {
    name: "Aldi Mons Centre",
    brand: "aldi",
    address: "Rue de la Grande Triperie 15",
    city: "Mons",
    postalCode: "7000",
    latitude: "50.4542",
    longitude: "3.9522",
    phone: "+32 65 35 44 55",
    openingHours: { monday: "08:30-19:00", tuesday: "08:30-19:00", wednesday: "08:30-19:00", thursday: "08:30-19:00", friday: "08:30-19:00", saturday: "08:30-19:00", sunday: "Fermé" }
  },
  {
    name: "Lidl Charleroi",
    brand: "lidl",
    address: "Boulevard Tirou 143",
    city: "Charleroi",
    postalCode: "6000",
    latitude: "50.4108",
    longitude: "4.4446",
    phone: "+32 71 30 25 30",
    openingHours: { monday: "08:00-20:00", tuesday: "08:00-20:00", wednesday: "08:00-20:00", thursday: "08:00-20:00", friday: "08:00-20:00", saturday: "08:00-20:00", sunday: "09:00-18:00" }
  },
  {
    name: "Delhaize Namur",
    brand: "delhaize",
    address: "Avenue de la Gare 12",
    city: "Namur",
    postalCode: "5000",
    latitude: "50.4674",
    longitude: "4.8719",
    phone: "+32 81 22 15 40",
    openingHours: { monday: "09:00-19:00", tuesday: "09:00-19:00", wednesday: "09:00-19:00", thursday: "09:00-19:00", friday: "09:00-20:00", saturday: "09:00-19:00", sunday: "09:00-18:00" }
  },
  {
    name: "Carrefour Liège",
    brand: "carrefour",
    address: "Rue Saint-Gilles 255",
    city: "Liège",
    postalCode: "4000",
    latitude: "50.6326",
    longitude: "5.5797",
    phone: "+32 4 223 45 67",
    openingHours: { monday: "08:00-21:00", tuesday: "08:00-21:00", wednesday: "08:00-21:00", thursday: "08:00-21:00", friday: "08:00-21:00", saturday: "08:00-21:00", sunday: "09:00-19:00" }
  },

  // FLANDRE
  {
    name: "Aldi Anvers",
    brand: "aldi",
    address: "Meir 78",
    city: "Anvers",
    postalCode: "2000",
    latitude: "51.2194",
    longitude: "4.4025",
    phone: "+32 3 234 56 78",
    openingHours: { monday: "08:30-20:00", tuesday: "08:30-20:00", wednesday: "08:30-20:00", thursday: "08:30-20:00", friday: "08:30-20:00", saturday: "08:30-20:00", sunday: "09:00-18:00" }
  },
  {
    name: "Delhaize Gand",
    brand: "delhaize",
    address: "Korenlei 45",
    city: "Gand",
    postalCode: "9000",
    latitude: "51.0543",
    longitude: "3.7174",
    phone: "+32 9 223 45 67",
    openingHours: { monday: "09:00-19:00", tuesday: "09:00-19:00", wednesday: "09:00-19:00", thursday: "09:00-19:00", friday: "09:00-20:00", saturday: "09:00-19:00", sunday: "09:00-18:00" }
  },
  {
    name: "Lidl Bruges",
    brand: "lidl",
    address: "Steenstraat 12",
    city: "Bruges",
    postalCode: "8000",
    latitude: "51.2093",
    longitude: "3.2247",
    phone: "+32 50 34 56 78",
    openingHours: { monday: "08:00-20:00", tuesday: "08:00-20:00", wednesday: "08:00-20:00", thursday: "08:00-20:00", friday: "08:00-20:00", saturday: "08:00-20:00", sunday: "09:00-18:00" }
  },
  {
    name: "Carrefour Louvain",
    brand: "carrefour",
    address: "Bondgenotenlaan 55",
    city: "Louvain",
    postalCode: "3000",
    latitude: "50.8798",
    longitude: "4.7005",
    phone: "+32 16 32 45 67",
    openingHours: { monday: "08:00-21:00", tuesday: "08:00-21:00", wednesday: "08:00-21:00", thursday: "08:00-21:00", friday: "08:00-21:00", saturday: "08:00-21:00", sunday: "09:00-19:00" }
  },

  // PLUS DE VILLES IMPORTANTES
  {
    name: "Aldi Tournai",
    brand: "aldi",
    address: "Grand Place 7",
    city: "Tournai",
    postalCode: "7500",
    latitude: "50.6054",
    longitude: "3.3890",
    phone: "+32 69 22 33 44",
    openingHours: { monday: "08:30-19:00", tuesday: "08:30-19:00", wednesday: "08:30-19:00", thursday: "08:30-19:00", friday: "08:30-19:00", saturday: "08:30-19:00", sunday: "09:00-17:00" }
  },
  {
    name: "Delhaize Hasselt",
    brand: "delhaize",
    address: "Grote Markt 21",
    city: "Hasselt",
    postalCode: "3500",
    latitude: "50.9307",
    longitude: "5.3378",
    phone: "+32 11 23 45 67",
    openingHours: { monday: "09:00-19:00", tuesday: "09:00-19:00", wednesday: "09:00-19:00", thursday: "09:00-19:00", friday: "09:00-20:00", saturday: "09:00-19:00", sunday: "09:00-18:00" }
  },
  {
    name: "Lidl Verviers",
    brand: "lidl",
    address: "Rue de la Station 89",
    city: "Verviers",
    postalCode: "4800",
    latitude: "50.5893",
    longitude: "5.8632",
    phone: "+32 87 33 22 11",
    openingHours: { monday: "08:00-20:00", tuesday: "08:00-20:00", wednesday: "08:00-20:00", thursday: "08:00-20:00", friday: "08:00-20:00", saturday: "08:00-20:00", sunday: "09:00-18:00" }
  },
  {
    name: "Carrefour Kortrijk",
    brand: "carrefour",
    address: "Grote Markt 4",
    city: "Kortrijk",
    postalCode: "8500",
    latitude: "50.8279",
    longitude: "3.2647",
    phone: "+32 56 24 35 46",
    openingHours: { monday: "08:00-21:00", tuesday: "08:00-21:00", wednesday: "08:00-21:00", thursday: "08:00-21:00", friday: "08:00-21:00", saturday: "08:00-21:00", sunday: "09:00-19:00" }
  },

  // CÔTE BELGE
  {
    name: "Aldi Ostende",
    brand: "aldi",
    address: "Kapellestraat 15",
    city: "Ostende",
    postalCode: "8400",
    latitude: "51.2287",
    longitude: "2.9271",
    phone: "+32 59 70 12 34",
    openingHours: { monday: "08:30-20:00", tuesday: "08:30-20:00", wednesday: "08:30-20:00", thursday: "08:30-20:00", friday: "08:30-20:00", saturday: "08:30-20:00", sunday: "09:00-18:00" }
  },
  {
    name: "Delhaize Blankenberge",
    brand: "delhaize",
    address: "Kerkstraat 67",
    city: "Blankenberge",
    postalCode: "8370",
    latitude: "51.3127",
    longitude: "3.1327",
    phone: "+32 50 41 23 45",
    openingHours: { monday: "09:00-19:00", tuesday: "09:00-19:00", wednesday: "09:00-19:00", thursday: "09:00-19:00", friday: "09:00-20:00", saturday: "09:00-19:00", sunday: "09:00-18:00" }
  }
];

export function SimpleStoreSearch({ open, onOpenChange, onSelect }: SimpleStoreSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);

  // Demander la géolocalisation de l'utilisateur
  useEffect(() => {
    if (open && !userLocation) {
      navigator.geolocation?.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setSortByDistance(true);
        },
        (error) => {
          // Géolocalisation non disponible
        }
      );
    }
  }, [open, userLocation]);

  // Filtrer et trier les magasins
  let filteredStores = storeTemplates.filter(store =>
    store.name?.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
    store.brand?.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
    store.city?.toLowerCase().includes(searchTerm?.toLowerCase() || '')
  );

  // Ajouter les distances si géolocalisation disponible
  if (userLocation && sortByDistance) {
    filteredStores = filteredStores
      .map(store => ({
        ...store,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          parseFloat(store.latitude),
          parseFloat(store.longitude)
        )
      }))
      .sort((a, b) => (a.distance || 999) - (b.distance || 999));
  }

  const handleSelectStore = (template: typeof storeTemplates[0]) => {
    onSelect({
      name: template.name,
      brand: template.brand,
      address: template.address,
      city: template.city,
      postalCode: template.postalCode,
      latitude: template.latitude,
      longitude: template.longitude,
      phone: template.phone,
      openingHours: template.openingHours
    });
    onOpenChange(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recherche Assistée de Magasins</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Input
            placeholder="Rechercher par nom, marque ou ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          
          {/* Contrôles de tri */}
          {userLocation && (
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Navigation className="h-4 w-4" />
                <span>Position détectée</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={sortByDistance ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortByDistance(!sortByDistance)}
                >
                  Trier par distance
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredStores.map((store, index) => {
              const storeWithDistance = store as typeof store & { distance?: number };
              const brandColors = {
                aldi: "bg-blue-100 text-blue-800",
                lidl: "bg-yellow-100 text-yellow-800", 
                delhaize: "bg-red-100 text-red-800",
                carrefour: "bg-blue-100 text-blue-800"
              };

              return (
                <Card key={index} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <Store className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">{store.name}</h3>

                          </div>
                          
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{store.address}, {store.postalCode} {store.city}</span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            {storeWithDistance.distance && (
                              <Badge variant="outline" className="text-xs">
                                <Navigation className="h-3 w-3 mr-1" />
                                {storeWithDistance.distance.toFixed(1)} km
                              </Badge>
                            )}
                            
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>Voir horaires</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleSelectStore(store)}
                        className="ml-2 flex-shrink-0"
                      >
                        Sélectionner
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredStores.length === 0 && searchTerm && (
              <div className="text-center py-8 text-gray-500">
                Aucun magasin trouvé pour "{searchTerm}"
              </div>
            )}

            {filteredStores.length === 0 && !searchTerm && (
              <div className="text-center py-8 text-gray-500">
                <Store className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="font-medium">Base de données complète de magasins belges</p>
                <p className="text-sm">{storeTemplates.length} magasins disponibles dans toute la Belgique</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}