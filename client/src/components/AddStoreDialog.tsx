import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Store, AlertCircle, MapPin, Search } from "lucide-react";
import { GooglePlacesStoreSearch } from "./GooglePlacesStoreSearch";
import type { PlaceDetails } from "@/services/googlePlaces";

interface AddStoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddStoreDialog({ isOpen, onClose }: AddStoreDialogProps) {
  const [storeName, setStoreName] = useState("");
  const [brand, setBrand] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  });

  // Gérer la sélection d'un magasin via Google Places
  const handleGooglePlacesSelection = (storeDetails: PlaceDetails & { brand: string }) => {
    setStoreName(storeDetails.name);
    setBrand(storeDetails.brand);
    setAddress(storeDetails.address);
    setCity(storeDetails.city);
    setPostalCode(storeDetails.postalCode);
    setLatitude(storeDetails.latitude?.toString() || "");
    setLongitude(storeDetails.longitude?.toString() || "");
    
    if (storeDetails.phone) {
      setPhone(storeDetails.phone);
    }
    
    // Convertir les heures d'ouverture si disponibles
    if (storeDetails.openingHours?.weekday_text) {
      const openingHours = storeDetails.openingHours.weekday_text.reduce((acc: any, text: string) => {
        const [day, hours] = text.split(': ');
        const dayKey = day.toLowerCase().replace('é', 'e'); // lundi -> lundi, mardi -> mardi, etc.
        acc[dayKey] = hours || 'Fermé';
        return acc;
      }, {});
      setOpeningHours(JSON.stringify(openingHours));
    }
    
    setActiveTab("manual"); // Basculer vers l'onglet manuel pour permettre les ajustements
    
    toast({
      title: "Magasin importé",
      description: "Les détails ont été récupérés automatiquement. Vous pouvez les ajuster si nécessaire.",
    });
  };

  const addStoreMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/contributions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      resetForm();
      onClose();
      toast({
        title: "Magasin proposé",
        description: "Votre proposition de nouveau magasin a été envoyée aux administrateurs pour vérification.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la proposition de magasin.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setStoreName("");
    setBrand("");
    setAddress("");
    setCity("");
    setPostalCode("");
    setPhone("");
    setComment("");
    setLatitude("");
    setLongitude("");
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          toast({
            title: "Position récupérée",
            description: "Les coordonnées GPS ont été automatiquement renseignées.",
          });
        },
        (error) => {
          toast({
            title: "Erreur de géolocalisation",
            description: "Impossible de récupérer votre position. Veuillez saisir manuellement.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (!storeName || !brand || !address || !city || !postalCode) {
      toast({
        title: "Champs requis",
        description: "Veuillez renseigner tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    // Validation code postal belge
    const belgianPostalCodeRegex = /^[1-9][0-9]{3}$/;
    if (!belgianPostalCodeRegex.test(postalCode)) {
      toast({
        title: "Code postal invalide",
        description: "Veuillez saisir un code postal belge valide (4 chiffres).",
        variant: "destructive",
      });
      return;
    }

    const contributionData = {
      type: "new_store",
      data: {
        name: storeName,
        brand: brand.toLowerCase(),
        address,
        city,
        postalCode,
        phone: phone || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        openingHours: {},
        isActive: true,
      },
      comment: comment || `Nouveau magasin ${brand} proposé à ${city}`,
      priority: "normal",
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    };

    addStoreMutation.mutate(contributionData);
  };

  const brandOptions = [
    { value: "aldi", label: "Aldi" },
    { value: "lidl", label: "Lidl" },
    { value: "delhaize", label: "Delhaize" },
    { value: "carrefour", label: "Carrefour" },
    { value: "colruyt", label: "Colruyt" },
    { value: "cora", label: "Cora" },
    { value: "match", label: "Match" },
    { value: "proxy", label: "Proxy" },
    { value: "autre", label: "Autre" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Proposer un nouveau magasin
          </DialogTitle>
          <DialogDescription>
            Recherchez via Google Places ou ajoutez manuellement
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Rechercher
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Manuel
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
          {/* Nom du magasin */}
          <div className="space-y-2">
            <Label htmlFor="storeName">Nom du magasin *</Label>
            <Input
              id="storeName"
              placeholder="Ex: Aldi Mons Centre, Lidl Liège..."
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
          </div>

          {/* Marque */}
          <div className="space-y-2">
            <Label htmlFor="brand">Marque/Enseigne *</Label>
            <select
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="">Sélectionner une marque</option>
              {brandOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Adresse */}
          <div className="space-y-2">
            <Label htmlFor="address">Adresse *</Label>
            <Input
              id="address"
              placeholder="Rue, numéro..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Ville et code postal */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                placeholder="Bruxelles, Liège..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal *</Label>
              <Input
                id="postalCode"
                placeholder="1000"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone (optionnel)</Label>
            <Input
              id="phone"
              placeholder="+32 2 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Coordonnées GPS */}
          <div className="space-y-2">
            <Label>Coordonnées GPS (optionnel)</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                type="number"
                step="any"
              />
              <Input
                placeholder="Longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                type="number"
                step="any"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                title="Utiliser ma position actuelle"
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Label htmlFor="comment">Commentaire (optionnel)</Label>
            <Textarea
              id="comment"
              placeholder="Informations supplémentaires, heures d'ouverture, particularités..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          {/* Avertissement */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">Vérification requise</p>
                <p>Le magasin sera vérifié par notre équipe avant d'être ajouté à la base de données.</p>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex space-x-2">
            <Button
              onClick={handleSubmit}
              disabled={addStoreMutation.isPending || !storeName || !brand || !address || !city || !postalCode}
              className="flex-1"
            >
              {addStoreMutation.isPending ? "Envoi..." : "Proposer le magasin"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={addStoreMutation.isPending}
            >
              Annuler
            </Button>
          </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}