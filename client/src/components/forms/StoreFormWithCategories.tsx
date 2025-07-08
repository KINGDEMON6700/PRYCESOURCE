import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import type { Store, InsertStore, StoreCategory } from "@shared/schema";

interface StoreFormProps {
  store?: Store;
  onSubmit: (data: InsertStore) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  showTitle?: boolean;
}

export function StoreFormWithCategories({ store, onSubmit, onCancel, isLoading, showTitle = true }: StoreFormProps) {
  const [name, setName] = useState(store?.name || "");
  const [categoryId, setCategoryId] = useState<number | null>(store?.categoryId || null);
  const [address, setAddress] = useState(store?.address || "");
  const [city, setCity] = useState(store?.city || "");
  const [postalCode, setPostalCode] = useState(store?.postalCode || "");
  const [latitude, setLatitude] = useState(store?.latitude ? store.latitude.toString() : "");
  const [longitude, setLongitude] = useState(store?.longitude ? store.longitude.toString() : "");
  const [phone, setPhone] = useState(store?.phone || "");
  const [openingHours, setOpeningHours] = useState(store?.openingHours || {});

  // Fetch categories
  const { data: categories = [] } = useQuery<StoreCategory[]>({
    queryKey: ["/api/store-categories"],
    queryFn: () => fetch("/api/store-categories").then(res => res.json()),
  });

  // Set default category when categories are loaded
  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;

    const formData: InsertStore = {
      name,
      categoryId,
      address,
      city,
      postalCode,
      latitude: latitude ? parseFloat(latitude) : 0,
      longitude: longitude ? parseFloat(longitude) : 0,
      phone: phone || undefined,
      openingHours: Object.keys(openingHours).length > 0 ? openingHours : undefined,
    };

    onSubmit(formData);
  };

  const handleOpeningHoursChange = (day: string, value: string) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: value
    }));
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {store ? "Modifier le magasin" : "Ajouter un magasin"}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Nom du magasin</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="categoryId" className="text-white">Catégorie</Label>
            <Select value={categoryId?.toString() || undefined} onValueChange={(value) => setCategoryId(parseInt(value))}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="address" className="text-white">Adresse</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" className="text-white">Ville</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="postalCode" className="text-white">Code postal</Label>
              <Input
                id="postalCode"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="text-white">Téléphone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="+32 XX XX XX XX"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude" className="text-white">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="longitude" className="text-white">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-white">Horaires d'ouverture</Label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries({
                monday: "Lundi",
                tuesday: "Mardi", 
                wednesday: "Mercredi",
                thursday: "Jeudi",
                friday: "Vendredi",
                saturday: "Samedi",
                sunday: "Dimanche",
              }).map(([day, label]) => (
                <div key={day} className="flex items-center space-x-2">
                  <Label className="w-20 text-sm text-white">{label}:</Label>
                  <Input
                    value={openingHours[day as keyof typeof openingHours] || ""}
                    onChange={(e) => handleOpeningHoursChange(day, e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white text-sm"
                    placeholder="ex: 8:00-20:00"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !categoryId} className="bg-blue-600 hover:bg-blue-700">
              {store ? "Modifier" : "Ajouter"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}