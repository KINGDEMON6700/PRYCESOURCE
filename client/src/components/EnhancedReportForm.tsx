import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Store, 
  Package, 
  Euro, 
  Bug, 
  Lightbulb, 
  HelpCircle, 
  Settings,
  MapPin,
  ShoppingCart,
  AlertTriangle,
  Send
} from "lucide-react";
import type { Store as StoreType, Product as ProductType } from "@shared/schema";

interface EnhancedReportFormProps {
  onSuccess?: () => void;
  defaultType?: string;
  defaultStoreId?: number;
  defaultProductId?: number;
  prefilledData?: {
    type?: string;
    storeId?: string | number;
    productId?: string | number;
    storeName?: string;
    productName?: string;
    currentPrice?: string;
    brand?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    phone?: string;
    category?: string;
    unit?: string;
    barcode?: string;
  };
}

export function EnhancedReportForm({ 
  onSuccess, 
  defaultType = "", 
  defaultStoreId, 
  defaultProductId,
  prefilledData 
}: EnhancedReportFormProps) {
  const [activeTab, setActiveTab] = useState(
    prefilledData?.type ? getTabFromType(prefilledData.type) : 
    defaultType ? getTabFromType(defaultType) : 
    "content"
  );
  const [formData, setFormData] = useState({
    type: prefilledData?.type || defaultType || "",
    storeId: prefilledData?.storeId?.toString() || defaultStoreId?.toString() || "",
    productId: prefilledData?.productId?.toString() || defaultProductId?.toString() || "",
    comment: "",
    priority: "normal",
    severity: "low",
    reportedPrice: prefilledData?.currentPrice || "",
    reportedAvailability: true,
    data: {
      storeName: prefilledData?.storeName || "",
      productName: prefilledData?.productName || "",
      brand: prefilledData?.brand || "",
      address: prefilledData?.address || "",
      city: prefilledData?.city || "",
      postalCode: prefilledData?.postalCode || "",
      phone: prefilledData?.phone || "",
      category: prefilledData?.category || "",
      unit: prefilledData?.unit || "",
      barcode: prefilledData?.barcode || "",
    } as any,
  });

  // Mettre à jour le formulaire si les props par défaut changent
  useEffect(() => {
    if (defaultType) {
      setFormData(prev => ({ ...prev, type: defaultType }));
      setActiveTab(getTabFromType(defaultType));
    }
    if (defaultStoreId) {
      setFormData(prev => ({ ...prev, storeId: defaultStoreId.toString() }));
    }
    if (defaultProductId) {
      setFormData(prev => ({ ...prev, productId: defaultProductId.toString() }));
    }
  }, [defaultType, defaultStoreId, defaultProductId]);

  // Ajouter un message initial si les données sont pré-remplies
  useEffect(() => {
    if (defaultType === "price_update" && defaultStoreId && defaultProductId) {
      setFormData(prev => ({ 
        ...prev, 
        comment: "Signalement automatique depuis la page du magasin - Prix manquant ou incorrect" 
      }));
    }
  }, [defaultType, defaultStoreId, defaultProductId]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stores and products for form options
  const { data: stores = [] } = useQuery<StoreType[]>({
    queryKey: ["/api/stores"],
  });

  const { data: products = [] } = useQuery<ProductType[]>({
    queryKey: ["/api/products"],
  });

  // Fetch products for selected store when store is selected for price/availability types
  const { data: storeProducts = [] } = useQuery<any[]>({
    queryKey: [`/api/stores/${formData.storeId}/products`],
    enabled: !!(formData.storeId && ["add_product_to_store", "price_update", "availability"].includes(formData.type)),
  });

  // Reset productId when storeId changes for "add_product_to_store" type
  useEffect(() => {
    if (formData.type === "add_product_to_store") {
      setFormData(prev => ({ ...prev, productId: "" }));
    }
  }, [formData.storeId, formData.type]);

  // Submit mutation
  const submitReportMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/reports", data),
    onSuccess: () => {
      toast({
        title: "Signalement envoyé",
        description: "Votre signalement a été transmis à l'équipe d'administration.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contributions"] });
      if (onSuccess) onSuccess();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le signalement. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  function getTabFromType(type: string): string {
    if (["new_store", "new_product", "add_product_to_store", "store_update"].includes(type)) {
      return "content";
    }
    if (["price_update", "availability"].includes(type)) {
      return "prices";
    }
    if (["bug_report", "feature_request", "support"].includes(type)) {
      return "support";
    }
    return "content";
  }

  const resetForm = () => {
    setFormData({
      type: "",
      storeId: "",
      productId: "",
      comment: "",
      priority: "normal",
      severity: "low",
      reportedPrice: "",
      reportedAvailability: true,
      data: {},
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.comment.trim()) {
      toast({
        title: "Champs requis",
        description: "Veuillez sélectionner un type et ajouter un commentaire.",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      storeId: formData.storeId ? parseInt(formData.storeId) : undefined,
      productId: formData.productId ? parseInt(formData.productId) : undefined,
      reportedPrice: formData.reportedPrice ? parseFloat(formData.reportedPrice) : undefined,
    };

    // Add structured data based on type
    switch (formData.type) {
      case "new_store":
        submitData.data = {
          suggestedName: formData.data.storeName || "",
          suggestedAddress: formData.data.storeAddress || "",
          suggestedBrand: formData.data.storeBrand || "",
        };
        break;
      case "new_product":
        submitData.data = {
          suggestedName: formData.data.productName || "",
          suggestedBrand: formData.data.productBrand || "",
          suggestedCategory: formData.data.productCategory || "",
        };
        break;
      case "store_update":
        submitData.data = {
          field: formData.data.updateField || "",
          currentValue: formData.data.currentValue || "",
          suggestedValue: formData.data.suggestedValue || "",
        };
        break;
      case "bug_report":
        submitData.data = {
          steps: formData.data.bugSteps || "",
          expected: formData.data.bugExpected || "",
          actual: formData.data.bugActual || "",
          browser: navigator.userAgent,
        };
        break;
      case "feature_request":
        submitData.data = {
          description: formData.data.featureDescription || "",
          useCase: formData.data.featureUseCase || "",
        };
        break;
    }

    submitReportMutation.mutate(submitData);
  };

  const handleDataChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Signalement détaillé
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="content" className="data-[state=active]:bg-gray-600">
                <Store className="h-4 w-4 mr-2" />
                Contenu
              </TabsTrigger>
              <TabsTrigger value="prices" className="data-[state=active]:bg-gray-600">
                <Euro className="h-4 w-4 mr-2" />
                Prix
              </TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:bg-gray-600">
                <HelpCircle className="h-4 w-4 mr-2" />
                Support
              </TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <div>
                <Label className="text-white">Type de signalement</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="new_store">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Nouveau magasin manquant
                      </div>
                    </SelectItem>
                    <SelectItem value="new_product">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Nouveau produit manquant
                      </div>
                    </SelectItem>
                    <SelectItem value="add_product_to_store">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Ajouter produit au catalogue
                      </div>
                    </SelectItem>
                    <SelectItem value="store_update">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Modifier infos magasin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* New Store Fields */}
              {formData.type === "new_store" && (
                <div className="space-y-3 p-4 bg-gray-900 rounded">
                  <div>
                    <Label className="text-white">Nom du magasin</Label>
                    <Input
                      value={formData.data.storeName || ""}
                      onChange={(e) => handleDataChange("storeName", e.target.value)}
                      placeholder="Ex: Delhaize Namur Centre"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Adresse complète</Label>
                    <Input
                      value={formData.data.storeAddress || ""}
                      onChange={(e) => handleDataChange("storeAddress", e.target.value)}
                      placeholder="Ex: Rue de la Paix 123, 5000 Namur"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Enseigne</Label>
                    <Select value={formData.data.storeBrand || ""} onValueChange={(value) => handleDataChange("storeBrand", value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Sélectionner l'enseigne" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="aldi">Aldi</SelectItem>
                        <SelectItem value="lidl">Lidl</SelectItem>
                        <SelectItem value="delhaize">Delhaize</SelectItem>
                        <SelectItem value="carrefour">Carrefour</SelectItem>
                        <SelectItem value="colruyt">Colruyt</SelectItem>
                        <SelectItem value="okay">Okay</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* New Product Fields */}
              {formData.type === "new_product" && (
                <div className="space-y-3 p-4 bg-gray-900 rounded">
                  <div>
                    <Label className="text-white">Nom du produit</Label>
                    <Input
                      value={formData.data.productName || ""}
                      onChange={(e) => handleDataChange("productName", e.target.value)}
                      placeholder="Ex: Nutella 400g"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Marque</Label>
                    <Input
                      value={formData.data.productBrand || ""}
                      onChange={(e) => handleDataChange("productBrand", e.target.value)}
                      placeholder="Ex: Ferrero"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Catégorie</Label>
                    <Input
                      value={formData.data.productCategory || ""}
                      onChange={(e) => handleDataChange("productCategory", e.target.value)}
                      placeholder="Ex: Pâtes à tartiner"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Add Product to Store */}
              {formData.type === "add_product_to_store" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-white">Magasin</Label>
                    <Select value={formData.storeId} onValueChange={(value) => setFormData(prev => ({ ...prev, storeId: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Sélectionner le magasin" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name} - {store.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Produit à ajouter</Label>
                    <Select value={formData.productId} onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Sélectionner le produit" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} - {product.brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Store Update */}
              {formData.type === "store_update" && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-white">Magasin à modifier</Label>
                    <Select value={formData.storeId} onValueChange={(value) => setFormData(prev => ({ ...prev, storeId: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Sélectionner le magasin" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name} - {store.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 p-4 bg-gray-900 rounded">
                    <div>
                      <Label className="text-white">Champ à modifier</Label>
                      <Select value={formData.data.updateField || ""} onValueChange={(value) => handleDataChange("updateField", value)}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Sélectionner le champ" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="address">Adresse</SelectItem>
                          <SelectItem value="phone">Téléphone</SelectItem>
                          <SelectItem value="hours">Heures d'ouverture</SelectItem>
                          <SelectItem value="name">Nom du magasin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white">Valeur actuelle (incorrecte)</Label>
                      <Input
                        value={formData.data.currentValue || ""}
                        onChange={(e) => handleDataChange("currentValue", e.target.value)}
                        placeholder="Ce qui est affiché actuellement"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Nouvelle valeur (correcte)</Label>
                      <Input
                        value={formData.data.suggestedValue || ""}
                        onChange={(e) => handleDataChange("suggestedValue", e.target.value)}
                        placeholder="Ce qui devrait être affiché"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Prices Tab */}
            <TabsContent value="prices" className="space-y-4">
              <div>
                <Label className="text-white">Type de signalement</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="price_update">
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4" />
                        Prix incorrect
                      </div>
                    </SelectItem>
                    <SelectItem value="availability">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Disponibilité incorrecte
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.type === "price_update" || formData.type === "availability") && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-white">Magasin</Label>
                    <Select value={formData.storeId} onValueChange={(value) => setFormData(prev => ({ ...prev, storeId: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Sélectionner le magasin" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name} - {store.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Produit</Label>
                    <Select value={formData.productId} onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder={
                          formData.storeId && formData.type === "add_product_to_store" 
                            ? "Sélectionner le produit à ajouter au magasin"
                            : formData.storeId && ["price_update", "availability"].includes(formData.type)
                            ? "Sélectionner le produit disponible dans ce magasin"
                            : "Sélectionner le produit"
                        } />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {formData.storeId && ["add_product_to_store", "price_update", "availability"].includes(formData.type) ? (
                          (() => {
                            if (formData.type === "add_product_to_store") {
                              // Pour "ajout produit au magasin", afficher seulement les produits QUI NE SONT PAS encore dans ce magasin
                              const storeProductIds = storeProducts.map(sp => sp.productId);
                              const availableProducts = products.filter(product => !storeProductIds.includes(product.id));
                              
                              return availableProducts.length > 0 ? (
                                availableProducts.map((product) => (
                                  <SelectItem key={product.id} value={product.id.toString()}>
                                    {product.name} - {product.brand}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-products-available" disabled>
                                  Tous les produits sont déjà dans ce magasin
                                </SelectItem>
                              );
                            } else {
                              // Pour "price_update" et "availability", afficher seulement les produits QUI SONT dans ce magasin
                              return storeProducts.length > 0 ? (
                                storeProducts
                                  .filter(sp => sp.productId && sp.product) // Filtrer les produits valides
                                  .map((storeProduct) => (
                                    <SelectItem key={storeProduct.productId} value={storeProduct.productId.toString()}>
                                      {storeProduct.product.name} - {storeProduct.product.brand}
                                    </SelectItem>
                                  ))
                              ) : (
                                <SelectItem value="no-products-available" disabled>
                                  Aucun produit disponible dans ce magasin
                                </SelectItem>
                              );
                            }
                          })()
                        ) : (
                          // Pour les autres types sans magasin sélectionné, afficher tous les produits
                          products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - {product.brand}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.type === "price_update" && (
                    <div>
                      <Label className="text-white">Prix correct (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.reportedPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, reportedPrice: e.target.value }))}
                        placeholder="Ex: 2.99"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  )}

                  {formData.type === "availability" && (
                    <div>
                      <Label className="text-white">Disponibilité</Label>
                      <Select 
                        value={formData.reportedAvailability.toString()} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, reportedAvailability: value === "true" }))}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="true">Disponible</SelectItem>
                          <SelectItem value="false">Non disponible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-4">
              <div>
                <Label className="text-white">Type de signalement</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="bug_report">
                      <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4" />
                        Signalement de bug
                      </div>
                    </SelectItem>
                    <SelectItem value="feature_request">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Demande de fonctionnalité
                      </div>
                    </SelectItem>
                    <SelectItem value="support">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Support technique
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === "bug_report" && (
                <div className="space-y-3 p-4 bg-gray-900 rounded">
                  <div>
                    <Label className="text-white">Sévérité</Label>
                    <Select value={formData.severity} onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Étapes pour reproduire</Label>
                    <Textarea
                      value={formData.data.bugSteps || ""}
                      onChange={(e) => handleDataChange("bugSteps", e.target.value)}
                      placeholder="1. Aller sur la page X&#10;2. Cliquer sur Y&#10;3. ..."
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-white">Résultat attendu</Label>
                    <Textarea
                      value={formData.data.bugExpected || ""}
                      onChange={(e) => handleDataChange("bugExpected", e.target.value)}
                      placeholder="Ce qui devrait se passer..."
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label className="text-white">Résultat observé</Label>
                    <Textarea
                      value={formData.data.bugActual || ""}
                      onChange={(e) => handleDataChange("bugActual", e.target.value)}
                      placeholder="Ce qui se passe vraiment..."
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {formData.type === "feature_request" && (
                <div className="space-y-3 p-4 bg-gray-900 rounded">
                  <div>
                    <Label className="text-white">Description de la fonctionnalité</Label>
                    <Textarea
                      value={formData.data.featureDescription || ""}
                      onChange={(e) => handleDataChange("featureDescription", e.target.value)}
                      placeholder="Décrivez la fonctionnalité souhaitée..."
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-white">Cas d'usage</Label>
                    <Textarea
                      value={formData.data.featureUseCase || ""}
                      onChange={(e) => handleDataChange("featureUseCase", e.target.value)}
                      placeholder="Comment cette fonctionnalité vous aiderait-elle ?"
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {["bug_report", "feature_request", "support"].includes(formData.type) && (
                <div>
                  <Label className="text-white">Priorité</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="normal">Normale</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Common fields */}
          <div>
            <Label className="text-white">Description détaillée *</Label>
            <Textarea
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Décrivez en détail votre signalement..."
              className="bg-gray-700 border-gray-600 text-white"
              rows={4}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={submitReportMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {submitReportMutation.isPending ? (
              "Envoi en cours..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer le signalement
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}