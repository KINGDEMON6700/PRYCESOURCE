import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Package, Search, AlertCircle, Plus } from "lucide-react";

interface AddProductToCatalogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  store: {
    id: number;
    name: string;
    brand: string;
  };
}

interface Product {
  id: number;
  name: string;
  brand?: string;
  category?: string;
  unit?: string;
  image?: string;
}

export function AddProductToCatalogDialog({ isOpen, onClose, store }: AddProductToCatalogDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [price, setPrice] = useState("");
  const [isPromotion, setIsPromotion] = useState(false);
  const [comment, setComment] = useState("");
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  
  // Nouveau produit
  const [newProductName, setNewProductName] = useState("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Recherche de produits
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["/api/products/search", searchQuery],
    queryFn: () => apiRequest("GET", `/api/products/search?q=${encodeURIComponent(searchQuery)}`),
    enabled: searchQuery.length >= 2,
  });

  const addProductToCatalogMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/contributions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stores/${store.id}/products`] });
      resetForm();
      onClose();
      toast({
        title: "Produit proposé",
        description: "Votre proposition d'ajout de produit au catalogue a été envoyée pour vérification.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la proposition.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSearchQuery("");
    setSelectedProduct(null);
    setIsAvailable(true);
    setPrice("");
    setIsPromotion(false);
    setComment("");
    setShowNewProductForm(false);
    setNewProductName("");
    setNewProductBrand("");
    setNewProductCategory("");
    setNewProductUnit("");
  };

  const handleSubmitExistingProduct = () => {
    if (!selectedProduct) {
      toast({
        title: "Produit requis",
        description: "Veuillez sélectionner un produit à ajouter.",
        variant: "destructive",
      });
      return;
    }

    const priceValue = price ? parseFloat(price) : null;
    if (price && (isNaN(priceValue!) || priceValue! < 0)) {
      toast({
        title: "Prix invalide",
        description: "Veuillez saisir un prix valide.",
        variant: "destructive",
      });
      return;
    }

    const contributionData = {
      type: "add_product_to_store",
      storeId: store.id,
      productId: selectedProduct.id,
      reportedPrice: priceValue,
      reportedAvailability: isAvailable,
      data: {
        productId: selectedProduct.id,
        storeId: store.id,
        isAvailable,
        price: priceValue,
        isPromotion: isPromotion,
        comment: comment || null,
      },
      comment: `Ajout produit "${selectedProduct.name}" au catalogue ${store.name}${price ? ` - Prix: ${price}€` : ''}${comment ? ` - ${comment}` : ''}`,
      priority: "normal",
    };

    addProductToCatalogMutation.mutate(contributionData);
  };

  const handleSubmitNewProduct = () => {
    if (!newProductName || !newProductCategory) {
      toast({
        title: "Champs requis",
        description: "Veuillez renseigner au moins le nom et la catégorie du produit.",
        variant: "destructive",
      });
      return;
    }

    const priceValue = price ? parseFloat(price) : null;
    if (price && (isNaN(priceValue!) || priceValue! < 0)) {
      toast({
        title: "Prix invalide",
        description: "Veuillez saisir un prix valide.",
        variant: "destructive",
      });
      return;
    }

    const contributionData = {
      type: "new_product_and_add_to_store",
      storeId: store.id,
      reportedPrice: priceValue,
      reportedAvailability: isAvailable,
      data: {
        product: {
          name: newProductName,
          brand: newProductBrand || null,
          category: newProductCategory,
          unit: newProductUnit || null,
        },
        storeId: store.id,
        isAvailable,
        price: priceValue,
        isPromotion: isPromotion,
        comment: comment || null,
      },
      comment: `Nouveau produit "${newProductName}" proposé pour ${store.name}${price ? ` - Prix: ${price}€` : ''}${comment ? ` - ${comment}` : ''}`,
      priority: "normal",
    };

    addProductToCatalogMutation.mutate(contributionData);
  };

  const categories = [
    "Fruits et légumes",
    "Viandes et poissons", 
    "Produits laitiers",
    "Épicerie salée",
    "Épicerie sucrée",
    "Boissons",
    "Surgelés",
    "Hygiène et beauté",
    "Entretien",
    "Bébé",
    "Animalerie",
    "Autre"
  ];

  const units = [
    "pièce",
    "kg",
    "g", 
    "L",
    "ml",
    "pack",
    "boîte",
    "sachet",
    "autre"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ajouter un produit au catalogue
          </DialogTitle>
          <DialogDescription>
            Proposer l'ajout d'un produit au catalogue de {store.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode sélection */}
          <div className="flex items-center gap-2">
            <Button
              variant={!showNewProductForm ? "default" : "outline"}
              size="sm"
              onClick={() => setShowNewProductForm(false)}
            >
              <Search className="h-4 w-4 mr-1" />
              Produit existant
            </Button>
            <Button
              variant={showNewProductForm ? "default" : "outline"}
              size="sm"
              onClick={() => setShowNewProductForm(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nouveau produit
            </Button>
          </div>

          {!showNewProductForm ? (
            <>
              {/* Recherche produit existant */}
              <div className="space-y-2">
                <Label htmlFor="search">Rechercher un produit</Label>
                <Input
                  id="search"
                  placeholder="Tapez le nom du produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Résultats de recherche */}
              {searchQuery.length >= 2 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {isSearching ? (
                    <p className="text-sm text-muted-foreground">Recherche...</p>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((product: Product) => (
                        <div
                          key={product.id}
                          className={`p-2 border rounded cursor-pointer transition-colors ${
                            selectedProduct?.id === product.id
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <div className="flex items-center gap-2">
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-8 h-8 object-cover rounded"
                                onError={(e) => {
                                  e.currentTarget.src = `https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=50&h=50&fit=crop&crop=center`;
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{product.name}</p>
                              <div className="flex items-center gap-1">
                                {product.category && (
                                  <Badge variant="outline" className="text-xs">{product.category}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucun produit trouvé. <Button variant="link" size="sm" onClick={() => setShowNewProductForm(true)}>Créer un nouveau produit</Button>
                    </p>
                  )}
                </div>
              )}

              {selectedProduct && (
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    {selectedProduct.image && (
                      <img
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = `https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=100&h=100&fit=crop&crop=center`;
                        }}
                      />
                    )}
                    <div>
                      <p className="font-medium">{selectedProduct.name}</p>
                      <div className="flex items-center gap-1">
                        {selectedProduct.category && (
                          <Badge variant="outline" className="text-xs">{selectedProduct.category}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Nouveau produit */}
              <div className="space-y-3 border p-3 rounded-lg bg-muted/50">
                <h4 className="font-medium">Informations du nouveau produit</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="newProductName">Nom du produit *</Label>
                  <Input
                    id="newProductName"
                    placeholder="Ex: Lait UHT 1L"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newProductBrand">Marque (optionnel)</Label>
                  <Input
                    id="newProductBrand"
                    placeholder="Ex: Alpro, Danone..."
                    value={newProductBrand}
                    onChange={(e) => setNewProductBrand(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="newProductCategory">Catégorie *</Label>
                    <select
                      id="newProductCategory"
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className="w-full p-2 border rounded-md bg-background text-sm"
                    >
                      <option value="">Sélectionner</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newProductUnit">Unité</Label>
                    <select
                      id="newProductUnit"
                      value={newProductUnit}
                      onChange={(e) => setNewProductUnit(e.target.value)}
                      className="w-full p-2 border rounded-md bg-background text-sm"
                    >
                      <option value="">Sélectionner</option>
                      {units.map((unit) => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Disponibilité */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="available"
              checked={isAvailable}
              onCheckedChange={(checked) => setIsAvailable(!!checked)}
            />
            <Label htmlFor="available">Produit disponible dans ce magasin</Label>
          </div>

          {/* Prix */}
          {isAvailable && (
            <>
              <div className="space-y-2">
                <Label htmlFor="price">Prix (€) - optionnel</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              {/* Promotion */}
              {price && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="promotion"
                    checked={isPromotion}
                    onCheckedChange={(checked) => setIsPromotion(!!checked)}
                  />
                  <Label htmlFor="promotion">Ce prix est en promotion</Label>
                </div>
              )}
            </>
          )}

          {/* Commentaire */}
          <div className="space-y-2">
            <Label htmlFor="comment">Commentaire (optionnel)</Label>
            <Textarea
              id="comment"
              placeholder="Informations supplémentaires..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
          </div>

          {/* Avertissement */}
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5" />
              <div className="text-sm text-green-700 dark:text-green-300">
                <p className="font-medium">Contribution appréciée</p>
                <p>Votre ajout sera vérifié par notre équipe avant publication.</p>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex space-x-2">
            <Button
              onClick={showNewProductForm ? handleSubmitNewProduct : handleSubmitExistingProduct}
              disabled={
                addProductToCatalogMutation.isPending || 
                (!showNewProductForm && !selectedProduct) ||
                (showNewProductForm && (!newProductName || !newProductCategory))
              }
              className="flex-1"
            >
              {addProductToCatalogMutation.isPending ? "Envoi..." : "Proposer l'ajout"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={addProductToCatalogMutation.isPending}
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}