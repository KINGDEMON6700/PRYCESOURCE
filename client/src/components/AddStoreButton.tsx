import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Store, Search } from "lucide-react";
import { StoreForm } from "@/components/forms/StoreForm";
import { GooglePlacesStoreSearch } from "@/components/GooglePlacesStoreSearch";
import type { InsertStore } from "../../shared/schema";
import type { PlaceDetails } from "@/services/googlePlaces";
import { useToast } from "@/hooks/use-toast";

interface AddStoreButtonProps {
  onStoreAdd: (store: InsertStore) => void;
}

/**
 * Bouton pour ajouter un magasin via Google Places ou saisie manuelle
 */
export function AddStoreButton({ onStoreAdd }: AddStoreButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [googlePlacesData, setGooglePlacesData] = useState<InsertStore | null>(null);
  const { toast } = useToast();

  // Obtenir la géolocalisation de l'utilisateur au montage du composant
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // Géolocalisation non disponible ou refusée
        }
      );
    }
  }, []);

  const handleSubmit = (storeData: InsertStore) => {
    onStoreAdd(storeData);
    setIsOpen(false);
    setGooglePlacesData(null);
  };

  // Gérer la sélection d'un magasin via Google Places
  const handleGooglePlacesSelection = (storeDetails: PlaceDetails & { brand: string }) => {
    // Mapping du brand vers categoryId
    const brandToCategoryMapping: Record<string, number> = {
      "delhaize": 1, // supermarché
      "carrefour": 1, // supermarché
      "colruyt": 1, // supermarché
      "aldi": 2, // discount
      "lidl": 2, // discount
      "mcdonalds": 5, // fast-food
      "burger king": 5, // fast-food
      "quick": 5, // fast-food
    };

    const categoryId = brandToCategoryMapping[storeDetails.brand.toLowerCase()] || 1; // Par défaut supermarché

    const storeData: InsertStore = {
      name: storeDetails.name,
      categoryId: categoryId,
      address: storeDetails.address,
      city: storeDetails.city,
      postalCode: storeDetails.postalCode,
      latitude: storeDetails.latitude?.toString() || null,
      longitude: storeDetails.longitude?.toString() || null,
      phone: storeDetails.phone || null,
      isActive: true,
      openingHours: null
    };

    // Utiliser les heures d'ouverture converties au format européen
    if (storeDetails.openingHours?.european_format) {
      storeData.openingHours = storeDetails.openingHours.european_format;
    } else if (storeDetails.openingHours?.weekday_text) {
      // Fallback vers l'ancienne méthode si la conversion européenne n'est pas disponible
      const openingHours = storeDetails.openingHours.weekday_text.reduce((acc: any, text: string) => {
        const [day, hours] = text.split(': ');
        const dayKey = day.toLowerCase().replace('é', 'e');
        acc[dayKey] = hours || 'Fermé';
        return acc;
      }, {});
      storeData.openingHours = openingHours;
    }
    
    setGooglePlacesData(storeData);
    setActiveTab("manual"); // Basculer vers l'onglet manuel pour permettre les ajustements
    
    toast({
      title: "Magasin importé",
      description: "Détails récupérés avec heures d'ouverture au format européen (24h).",
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setGooglePlacesData(null);
    setActiveTab("manual");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un magasin
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Store className="h-5 w-5" />
            Ajouter un nouveau magasin
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="search" className="flex items-center gap-2 text-white data-[state=active]:bg-blue-600">
              <Search className="h-4 w-4" />
              Recherche Google
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2 text-white data-[state=active]:bg-blue-600">
              <Store className="h-4 w-4" />
              Saisie manuelle
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="space-y-4 mt-4">
            <GooglePlacesStoreSearch
              onStoreSelect={handleGooglePlacesSelection}
              onClose={() => setActiveTab("manual")}
              userLocation={userLocation || undefined}
            />
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4 mt-4">
            <StoreForm 
              onSubmit={handleSubmit}
              showTitle={false}
              store={googlePlacesData ? {
                id: 0,
                name: googlePlacesData.name,
                brand: googlePlacesData.brand,
                address: googlePlacesData.address,
                city: googlePlacesData.city,
                postalCode: googlePlacesData.postalCode,
                latitude: googlePlacesData.latitude,
                longitude: googlePlacesData.longitude,
                phone: googlePlacesData.phone,
                isActive: googlePlacesData.isActive,
                openingHours: googlePlacesData.openingHours,
                createdAt: new Date(),
                updatedAt: new Date()
              } : undefined}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}