import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

import type { Store, InsertStore, StoreCategory } from "@shared/schema";

const storeFormSchema = z.object({
  name: z.string().min(1, "Le nom du magasin est requis"),
  categoryId: z.number().min(1, "La catégorie est requise"),
  address: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, "La ville est requise"), 
  postalCode: z.string().min(1, "Le code postal est requis"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
  openingHours: z.object({
    monday: z.string().optional(),
    tuesday: z.string().optional(),
    wednesday: z.string().optional(),
    thursday: z.string().optional(),
    friday: z.string().optional(),
    saturday: z.string().optional(),
    sunday: z.string().optional(),
  }).optional(),
});

type StoreFormData = z.infer<typeof storeFormSchema>;

interface StoreFormProps {
  store?: Store;
  onSubmit: (data: InsertStore) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  showTitle?: boolean;
}

// Mapping des anciennes marques vers les catégories
const brandToCategoryMapping: Record<string, number> = {
  "delhaize": 1, // supermarché
  "carrefour": 1, // supermarché
  "colruyt": 1, // supermarché
  "aldi": 2, // discount
  "lidl": 2, // discount
  "mcdonalds": 5, // fast-food
  "burger king": 5, // fast-food
  "quick": 5, // fast-food
  "autre": 1, // par défaut supermarché
};

export function StoreForm({ store, onSubmit, onCancel, isLoading, showTitle = true }: StoreFormProps) {
  const [useCoordinates, setUseCoordinates] = useState(!!store?.latitude);

  // Récupérer les catégories de magasin
  const { data: categories = [] } = useQuery<StoreCategory[]>({
    queryKey: ["/api/store-categories"],
  });

  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: store?.name || "",
      categoryId: store?.categoryId || 1, // Par défaut supermarché
      address: store?.address || "",
      city: store?.city || "",
      postalCode: store?.postalCode || "",
      latitude: store?.latitude || "",
      longitude: store?.longitude || "",
      phone: store?.phone || "",
      isActive: store?.isActive ?? true,
      openingHours: store?.openingHours || {
        monday: "08:00-20:00",
        tuesday: "08:00-20:00", 
        wednesday: "08:00-20:00",
        thursday: "08:00-20:00",
        friday: "08:00-20:00",
        saturday: "08:00-20:00",
        sunday: "09:00-19:00",
      },
    },
  });

  const handleSubmit = (data: StoreFormData) => {
    const submitData: InsertStore = {
      ...data,
      latitude: useCoordinates && data.latitude ? data.latitude : null,
      longitude: useCoordinates && data.longitude ? data.longitude : null,
      phone: data.phone || null,
      openingHours: data.openingHours || null,
    };
    onSubmit(submitData);
  };

  

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {store?.id ? "Modifier le magasin" : "Ajouter un magasin"}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du magasin *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Ex: Delhaize Mons Centre"
                disabled={isLoading}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Catégorie *</Label>
              <Select 
                value={form.watch("categoryId")?.toString()} 
                onValueChange={(value) => form.setValue("categoryId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez la catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && (
                <p className="text-sm text-red-500">{form.formState.errors.categoryId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adresse *</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="Ex: Rue de la Paix 123, Mons"
              disabled={isLoading}
            />
            {form.formState.errors.address && (
              <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                {...form.register("city")}
                placeholder="Ex: Mons"
              />
              {form.formState.errors.city && (
                <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal *</Label>
              <Input
                id="postalCode"
                {...form.register("postalCode")}
                placeholder="Ex: 7000"
              />
              {form.formState.errors.postalCode && (
                <p className="text-sm text-red-500">{form.formState.errors.postalCode.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="Ex: +32 65 12 34 56"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="useCoordinates"
                checked={useCoordinates}
                onCheckedChange={setUseCoordinates}
              />
              <Label htmlFor="useCoordinates">Ajouter les coordonnées GPS</Label>
            </div>

            {useCoordinates && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    {...form.register("latitude")}
                    placeholder="Ex: 50.4542"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    {...form.register("longitude")}
                    placeholder="Ex: 3.9570"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label>Horaires d'ouverture</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                  <Label className="w-20 text-sm">{label}:</Label>
                  <Input
                    value={form.watch(`openingHours.${day}` as any) || ""}
                    onChange={(e) => {
                      form.setValue(`openingHours.${day}` as any, e.target.value);
                      form.trigger(`openingHours.${day}` as any);
                    }}
                    placeholder="08:00-20:00 ou Fermé"
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500">
              Format: HH:MM-HH:MM (ex: 08:00-20:00) ou "Fermé" pour les jours de fermeture
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Magasin actif</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : (store?.id ? "Modifier" : "Ajouter")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}