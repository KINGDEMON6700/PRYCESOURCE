import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { getAllCategories, getCategoryInfo } from "@/lib/categories";
import type { Product, InsertProduct } from "@shared/schema";

const productFormSchema = z.object({
  name: z.string().min(1, "Le nom du produit est requis"),
  brand: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  barcode: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
  defaultValues?: InsertProduct;
  onSubmit: (data: InsertProduct) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  showTitle?: boolean;
  submitLabel?: string;
}

const unitOptions = [
  { value: "kg", label: "Kilogramme (kg)" },
  { value: "g", label: "Gramme (g)" },
  { value: "L", label: "Litre (L)" },
  { value: "ml", label: "Millilitre (ml)" },
  { value: "pièce", label: "Pièce" },
  { value: "boîte", label: "Boîte" },
  { value: "paquet", label: "Paquet" },
  { value: "pot", label: "Pot" },
  { value: "bouteille", label: "Bouteille" },
];

export function ProductForm({ 
  product, 
  defaultValues, 
  onSubmit, 
  onCancel, 
  isLoading, 
  showTitle = true, 
  submitLabel 
}: ProductFormProps) {
  // Priorité: defaultValues > product > valeurs par défaut
  const getInitialValues = () => {
    if (defaultValues) {
      return {
        name: defaultValues.name || "",
        brand: defaultValues.brand || "",
        category: defaultValues.category || "",
        description: defaultValues.description || "",
        unit: defaultValues.unit || "",
        barcode: defaultValues.barcode || "",
        imageUrl: defaultValues.imageUrl || "",
        isActive: true,
      };
    }
    
    if (product) {
      return {
        name: product.name || "",
        brand: product.brand || "",
        category: product.category || "",
        description: product.description || "",
        unit: product.unit || "",
        barcode: product.barcode || "",
        imageUrl: product.imageUrl || "",
        isActive: product.isActive ?? true,
      };
    }
    
    return {
      name: "",
      brand: "",
      category: "",
      description: "",
      unit: "",
      barcode: "",
      imageUrl: "",
      isActive: true,
    };
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: getInitialValues(),
  });

  // Réinitialiser le formulaire quand les defaultValues changent
  useEffect(() => {
    const newValues = getInitialValues();
    form.reset(newValues);
  }, [defaultValues, product]);

  const handleSubmit = (data: ProductFormData) => {
    const submitData: InsertProduct = {
      ...data,
      brand: data.brand || null,
      category: data.category || null,
      description: data.description || null,
      unit: data.unit || null,
      barcode: data.barcode || null,
      imageUrl: data.imageUrl || null,
    };
    onSubmit(submitData);
  };

  const selectedCategory = form.watch("category");

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {product ? "Modifier le produit" : "Ajouter un produit"}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Ex: Pain de mie complet"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Marque</Label>
              <Input
                id="brand"
                {...form.register("brand")}
                placeholder="Ex: Jacquet, Bio Planet, Delhaize"
              />
              {form.formState.errors.brand && (
                <p className="text-sm text-red-500">{form.formState.errors.brand.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={form.watch("category")} onValueChange={(value) => form.setValue("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {getAllCategories().map((category) => (
                    <SelectItem key={category.key} value={category.key}>
                      <div className="flex items-center gap-2">
                        <span>{category.label}</span>
                        <Badge className={`text-xs ${getCategoryInfo(category.key).color}`}>
                          {category.key}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <div className="mt-1">
                  <Badge className={getCategoryInfo(selectedCategory).color}>
                    {getCategoryInfo(selectedCategory).label}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unité</Label>
              <Select value={form.watch("unit")} onValueChange={(value) => form.setValue("unit", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez l'unité" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Description détaillée du produit"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">Code-barres</Label>
              <Input
                id="barcode"
                value={form.watch("barcode") || ""}
                onChange={(e) => {
                  form.setValue("barcode", e.target.value);
                  form.trigger("barcode");
                }}
                placeholder="Ex: 1234567890123"
              />
              <p className="text-xs text-gray-500">
                Code-barres pour le scan automatique (EAN-13, UPC, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de l'image</Label>
              <Input
                id="imageUrl"
                {...form.register("imageUrl")}
                placeholder="https://example.com/image.jpg"
              />
              {form.formState.errors.imageUrl && (
                <p className="text-sm text-red-500">{form.formState.errors.imageUrl.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
            <Label htmlFor="isActive">Produit actif</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : (submitLabel || (product ? "Modifier" : "Ajouter"))}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}