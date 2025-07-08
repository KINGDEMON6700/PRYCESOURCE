import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Palette, Image, Building } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { BrandConfig, InsertBrandConfig } from "@shared/schema";

export function BrandConfigManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBrand, setSelectedBrand] = useState<BrandConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertBrandConfig>>({
    name: "",
    displayName: "",
    color: "#3B82F6",
    logoUrl: "",
    imageUrl: "",
    description: "",
    isActive: true,
  });

  const { data: brands = [], isLoading } = useQuery<BrandConfig[]>({
    queryKey: ["/api/admin/brands"],
    queryFn: () => fetch("/api/admin/brands").then(res => res.json()),
  });

  const createBrandMutation = useMutation({
    mutationFn: async (brandData: InsertBrandConfig) => {
      return await apiRequest("POST", "/api/admin/brands", brandData);
    },
    onSuccess: () => {
      toast({
        title: "Marque créée",
        description: "La configuration de marque a été créée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brands"] });
      setIsDialogOpen(false);
      setFormData({
        name: "",
        displayName: "",
        color: "#3B82F6",
        logoUrl: "",
        imageUrl: "",
        description: "",
        isActive: true,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la configuration de marque.",
        variant: "destructive",
      });
    },
  });

  const updateBrandMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertBrandConfig> }) => {
      return await apiRequest("PUT", `/api/admin/brands/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Marque modifiée",
        description: "La configuration de marque a été mise à jour.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brands"] });
      setIsDialogOpen(false);
      setSelectedBrand(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la configuration de marque.",
        variant: "destructive",
      });
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (brandId: number) => {
      return await apiRequest("DELETE", `/api/admin/brands/${brandId}`);
    },
    onSuccess: () => {
      toast({
        title: "Marque supprimée",
        description: "La configuration de marque a été supprimée.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/brands"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la configuration de marque.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBrand) {
      updateBrandMutation.mutate({ id: selectedBrand.id, data: formData });
    } else {
      createBrandMutation.mutate(formData as InsertBrandConfig);
    }
  };

  const handleEdit = (brand: BrandConfig) => {
    setSelectedBrand(brand);
    setFormData(brand);
    setIsDialogOpen(true);
  };

  const handleDelete = (brandId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette configuration de marque ?")) {
      deleteBrandMutation.mutate(brandId);
    }
  };

  const getBrandColors = (brand: string) => {
    const colors = {
      delhaize: "bg-red-500",
      aldi: "bg-blue-600", 
      lidl: "bg-yellow-500",
      carrefour: "bg-blue-500",
    };
    return colors[brand as keyof typeof colors] || "bg-gray-500";
  };

  const getGoogleImageUrl = (brandName: string) => {
    // Suggestion d'images Google pour les magasins belges
    const queries = {
      delhaize: "delhaize supermarket store belgium exterior",
      aldi: "aldi supermarket store belgium exterior",
      lidl: "lidl supermarket store belgium exterior", 
      carrefour: "carrefour hypermarket store belgium exterior",
    };
    const query = queries[brandName?.toLowerCase() as keyof typeof queries] || `${brandName || ''} store belgium`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Building className="h-5 w-5" />
            Configuration des marques
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm"
                onClick={() => {
                  setSelectedBrand(null);
                  setFormData({
                    name: "",
                    displayName: "",
                    color: "#3B82F6",
                    logoUrl: "",
                    imageUrl: "",
                    description: "",
                    isActive: true,
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ajouter une marque
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {selectedBrand ? "Modifier la marque" : "Ajouter une marque"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">Nom technique</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="delhaize"
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayName" className="text-gray-300">Nom d'affichage</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="Delhaize"
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="color" className="text-gray-300">Couleur</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-16 h-10 bg-gray-700 border-gray-600"
                        required
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#3B82F6"
                        className="bg-gray-700 border-gray-600 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="logoUrl" className="text-gray-300">URL du logo</Label>
                    <Input
                      id="logoUrl"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="imageUrl" className="text-gray-300">URL de l'image du magasin</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/store.jpg"
                      className="bg-gray-700 border-gray-600 text-white flex-1"
                    />
                    <Button 
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(getGoogleImageUrl(formData.name || ""), "_blank")}
                      className="border-gray-600 text-gray-300"
                    >
                      <Image className="h-4 w-4 mr-1" />
                      Rechercher
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Utilisez le bouton "Rechercher" pour trouver des images sur Google
                  </p>
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de la marque"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isActive" className="text-gray-300">Marque active</Label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="border-gray-600 text-gray-300"
                    >
                      Annuler
                    </Button>
                    <Button type="submit">
                      {selectedBrand ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {brands.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            Aucune configuration de marque. Créez-en une pour commencer.
          </p>
        ) : (
          brands.map((brand) => (
            <div key={brand.id} className="border border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: brand.color }}
                  >
                    {brand.logoUrl ? (
                      <img 
                        src={brand.logoUrl} 
                        alt={brand.displayName}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      brand.displayName.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-white">
                      {brand.displayName}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span>ID: {brand.name}</span>
                      <Palette className="w-3 h-3" />
                      <span>{brand.color}</span>
                    </div>
                    {brand.description && (
                      <p className="text-sm text-gray-400 mt-1">{brand.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={brand.isActive ? "default" : "secondary"}
                    className={brand.isActive ? "bg-green-600" : "bg-gray-600"}
                  >
                    {brand.isActive ? "Actif" : "Inactif"}
                  </Badge>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(brand)}
                    className="border-gray-600 text-gray-300"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(brand.id)}
                    className="border-red-600 text-red-400 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}