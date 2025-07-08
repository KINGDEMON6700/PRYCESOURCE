import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Tag, ArrowUpDown, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { StoreCategory, InsertStoreCategory } from "@shared/schema";

// Icônes Lucide disponibles pour les catégories
const AVAILABLE_ICONS = [
  { name: "ShoppingCart", label: "Caddie" },
  { name: "DollarSign", label: "Dollar" },
  { name: "Store", label: "Magasin" },
  { name: "Coffee", label: "Café" },
  { name: "Utensils", label: "Couverts" },
  { name: "Croissant", label: "Croissant" },
  { name: "Car", label: "Voiture" },
  { name: "Heart", label: "Coeur" },
  { name: "Pill", label: "Pilule" },
  { name: "ChefHat", label: "Toque" },
  { name: "Building", label: "Bâtiment" },
  { name: "MapPin", label: "Épingle" },
  { name: "Clock", label: "Horloge" },
  { name: "Star", label: "Étoile" },
  { name: "Tag", label: "Étiquette" },
];

const COLOR_PRESETS = [
  { name: "Bleu", value: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { name: "Vert", value: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { name: "Rouge", value: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { name: "Orange", value: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { name: "Violet", value: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { name: "Jaune", value: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { name: "Ambre", value: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  { name: "Rose", value: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  { name: "Cyan", value: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  { name: "Indigo", value: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
];

export function StoreCategoryManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertStoreCategory>>({
    name: "",
    label: "",
    color: COLOR_PRESETS[0].value,
    iconName: AVAILABLE_ICONS[0].name,
    description: "",
    isActive: true,
    sortOrder: 0,
  });

  const { data: categories = [], isLoading } = useQuery<StoreCategory[]>({
    queryKey: ["/api/admin/store-categories"],
    queryFn: () => fetch("/api/admin/store-categories").then(res => res.json()),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (categoryData: InsertStoreCategory) => 
      apiRequest("POST", "/api/admin/store-categories", categoryData),
    onSuccess: () => {
      toast({
        title: "Catégorie créée",
        description: "La catégorie de magasin a été créée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/store-categories"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la catégorie",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertStoreCategory> }) =>
      apiRequest("PUT", `/api/admin/store-categories/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Catégorie mise à jour",
        description: "La catégorie a été modifiée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/store-categories"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la catégorie",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/store-categories/${id}`),
    onSuccess: () => {
      toast({
        title: "Catégorie supprimée",
        description: "La catégorie a été supprimée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/store-categories"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      label: "",
      color: COLOR_PRESETS[0].value,
      iconName: AVAILABLE_ICONS[0].name,
      description: "",
      isActive: true,
      sortOrder: 0,
    });
    setSelectedCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategory) {
      updateCategoryMutation.mutate({ id: selectedCategory.id, data: formData });
    } else {
      createCategoryMutation.mutate(formData as InsertStoreCategory);
    }
  };

  const handleEdit = (category: StoreCategory) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      label: category.label,
      color: category.color,
      iconName: category.iconName,
      description: category.description || "",
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (category: StoreCategory) => {
    deleteCategoryMutation.mutate(category.id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Catégories de magasins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Chargement des catégories...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Gestion des catégories de magasins
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">
            Gérez les catégories utilisées pour classifier les magasins
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle catégorie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedCategory ? "Modifier la catégorie" : "Créer une nouvelle catégorie"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom technique</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ex: supermarche"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="label">Libellé affiché</Label>
                    <Input
                      id="label"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="ex: Supermarché"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="iconName">Icône</Label>
                    <Select value={formData.iconName} onValueChange={(value) => setFormData({ ...formData, iconName: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une icône" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ICONS.map((icon) => (
                          <SelectItem key={icon.name} value={icon.name}>
                            {icon.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="color">Couleur</Label>
                    <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une couleur" />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_PRESETS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded ${color.value}`} />
                              {color.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de la catégorie..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sortOrder">Ordre d'affichage</Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                    <Label htmlFor="isActive">Catégorie active</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">
                    {selectedCategory ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className={`border-2 ${category.isActive ? 'border-primary/20' : 'border-gray-300 opacity-70'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={category.color}>
                    {category.label}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la catégorie "{category.label}" ?
                            Cette action ne peut pas être annulée.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(category)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Nom:</span>
                    <span className="text-muted-foreground">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Icône:</span>
                    <span className="text-muted-foreground">{category.iconName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Ordre:</span>
                    <span className="text-muted-foreground">{category.sortOrder}</span>
                  </div>
                  {category.description && (
                    <div className="text-xs text-muted-foreground">
                      {category.description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune catégorie de magasin configurée</p>
            <p className="text-sm">Créez votre première catégorie pour commencer</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}