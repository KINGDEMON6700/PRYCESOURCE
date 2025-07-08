import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart, Star, MapPin, ThumbsUp, ThumbsDown, AlertTriangle, Edit, Navigation, Flag, Plus } from "lucide-react";
import { StandardHeader } from "@/components/StandardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { useToast } from "@/hooks/use-toast";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PriceEditDialog } from "@/components/PriceEditDialog";

import { apiRequest } from "@/lib/queryClient";
import { getCategoryInfo } from "@/lib/categories";

import type { Store, Product, StoreProduct } from "@shared/schema";

interface StoreProductWithDetails extends StoreProduct {
  product: Product;
  price?: number | null;
  hasPrice?: boolean;
  isPromotion?: boolean;
  priceVotes?: {
    correct: number;
    incorrect: number;
    outdated: number;
  };
  userVote?: string | null;
}

export function StoreProducts() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addPriceDialogProduct, setAddPriceDialogProduct] = useState<StoreProductWithDetails | null>(null);
  const [editPriceDialogProduct, setEditPriceDialogProduct] = useState<StoreProductWithDetails | null>(null);
  const [voteDialogProduct, setVoteDialogProduct] = useState<StoreProductWithDetails | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [newPriceComment, setNewPriceComment] = useState("");
  const [isPromotion, setIsPromotion] = useState(false);

  // Récupérer les détails du magasin
  const { data: store } = useQuery<Store>({
    queryKey: [`/api/stores/${id}`],
    enabled: !!id,
  });

  // Récupérer les produits du magasin
  const { data: storeProducts = [], isLoading } = useQuery<StoreProductWithDetails[]>({
    queryKey: [`/api/stores/${id}/products`],
    enabled: !!id,
  });





  // Mutation pour ajouter un prix
  const addPriceMutation = useMutation({
    mutationFn: async (priceData: any) => {
      return await apiRequest("POST", "/api/contributions", priceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stores/${id}/products`] });
      setAddPriceDialogProduct(null);
      setNewPrice("");
      setNewPriceComment("");
      setIsPromotion(false);
      toast({
        title: "Prix ajouté",
        description: "Votre contribution de prix a été enregistrée et sera vérifiée par notre équipe.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le prix.",
        variant: "destructive",
      });
    },
  });

  // Fonction pour naviguer vers le signalement avec données pré-remplies
  const handleReport = (storeProduct: any) => {


    
    const reportData = {
      type: "price_update", // Toujours price_update, que le prix existe ou non
      storeId: store?.id,
      productId: storeProduct.product?.id || storeProduct.productId,
      storeName: store?.name,
      productName: storeProduct.product?.name,
      currentPrice: storeProduct.price || "non_renseigne"
    };
    

    
    const queryParams = new URLSearchParams();
    Object.entries(reportData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    const reportUrl = `/report?${queryParams.toString()}`;

    
    navigate(reportUrl);
  };

  // Fonction pour signaler un produit manquant
  const handleMissingProduct = () => {
    const reportData = {
      type: "add_product_to_store",
      storeId: store?.id,
      storeName: store?.name,
      comment: `Demande d'ajout de produit dans le magasin ${store?.name}`
    };
    
    const queryParams = new URLSearchParams();
    Object.entries(reportData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    
    navigate(`/report?${queryParams.toString()}`);
  };

  // Fonction pour ouvrir les applications GPS
  const handleOpenGPS = () => {
    if (!store) return;
    
    const address = `${store.address}, ${store.city}`;
    const coordinates = `${store.latitude},${store.longitude}`;
    
    // Détecter si on est sur mobile ou desktop
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Sur mobile, essayer d'ouvrir les apps natives
      const apps = [
        { name: 'Waze', url: `https://waze.com/ul?ll=${coordinates}&navigate=yes&zoom=17` },
        { name: 'Google Maps', url: `https://maps.google.com/?q=${coordinates}&navigate=yes` },
        { name: 'Plans (iOS)', url: `maps://maps.google.com/?q=${coordinates}` }
      ];
      
      // Essayer d'ouvrir Waze en premier, puis Google Maps en fallback
      const wazeUrl = apps[0].url;
      const googleMapsUrl = apps[1].url;
      
      // Tentative d'ouverture de Waze
      const wazeWindow = window.open(wazeUrl, '_blank');
      
      // Si Waze ne s'ouvre pas après 2 secondes, ouvrir Google Maps
      setTimeout(() => {
        if (wazeWindow) {
          wazeWindow.close();
        }
        window.open(googleMapsUrl, '_blank');
      }, 2000);
    } else {
      // Sur desktop, ouvrir Google Maps dans un nouvel onglet
      window.open(`https://maps.google.com/?q=${coordinates}`, '_blank');
    }
    
    toast({
      title: "Navigation lancée",
      description: `Ouverture de l'itinéraire vers ${store.name}`,
    });
  };

  const handleAddPrice = () => {
    if (!addPriceDialogProduct || !id || !newPrice) return;
    
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un prix valide.",
        variant: "destructive",
      });
      return;
    }

    const priceData = {
      type: "price",
      productId: addPriceDialogProduct.productId,
      storeId: parseInt(id),
      data: {
        price: price,
        isAvailable: true,
        isPromotion: isPromotion,
        productName: addPriceDialogProduct.product?.name,
        storeName: store?.name,
        comment: newPriceComment,
      },
    };

    addPriceMutation.mutate(priceData);
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chargement...
            </h1>
          </div>
        </div>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <StandardHeader 
        title={store?.name || "Produits du magasin"}
        showBackButton={true}
      />

      {/* Products List */}
      <div className="pt-20 px-2 sm:px-4 lg:px-6 max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              Catalogue des produits
            </h2>
            <Button
              onClick={handleMissingProduct}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 border-blue-600 dark:border-blue-400 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:hidden">Produit manquant?</span>
              <span className="hidden sm:inline">Un produit manquant?</span>
            </Button>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {storeProducts.length} produit{storeProducts.length > 1 ? 's' : ''} référencé{storeProducts.length > 1 ? 's' : ''}
          </p>
        </div>

        {storeProducts.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CardContent className="p-12 text-center">
              <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Aucun produit référencé
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Soyez le premier à ajouter des produits à ce magasin en utilisant le bouton "Un produit manquant?" ci-dessus.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Les produits peuvent également être ajoutés via le panel d'administration.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {storeProducts.map((storeProduct) => (
              <Card 
                key={storeProduct.id} 
                className="hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/20 border-gray-200 dark:border-gray-700"
                onClick={() => navigate(`/product/${storeProduct.product?.id || storeProduct.productId}`)}
              >
                <CardContent className="p-3 sm:p-4 lg:p-5">
                  <div className="flex flex-col gap-3">
                    {/* Image du produit */}
                    <div className="w-full aspect-square max-w-[120px] sm:max-w-[140px] mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl overflow-hidden relative shadow-inner">
                      {(storeProduct.product?.imageUrl || storeProduct.product?.image) ? (
                        <img 
                          src={storeProduct.product?.imageUrl || storeProduct.product?.image} 
                          alt={storeProduct.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.parentNode?.querySelector('.fallback-icon') as HTMLDivElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className={`fallback-icon absolute inset-0 w-full h-full flex items-center justify-center ${(storeProduct.product?.imageUrl || storeProduct.product?.image) ? 'hidden' : 'flex'}`}>
                        <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                    </div>

                    {/* Informations du produit */}
                    <div className="space-y-2 sm:space-y-3 text-center">
                      {/* Nom et catégorie */}
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-tight">
                          <span className="block overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {storeProduct.product?.name || 'Produit sans nom'}
                          </span>
                        </h3>
                        {storeProduct.product?.category && (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getCategoryInfo(storeProduct.product.category).color}`}
                          >
                            {getCategoryInfo(storeProduct.product.category).label}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Marque et unité */}
                      <div className="space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {storeProduct.product?.brand && (
                          <div className="text-blue-600 dark:text-blue-400 font-medium truncate">
                            {storeProduct.product.brand}
                          </div>
                        )}
                        {storeProduct.product?.unit && (
                          <div className="font-medium truncate">
                            {storeProduct.product.unit}
                          </div>
                        )}
                      </div>
                      
                      {/* Prix */}
                      <div className="space-y-1">
                        {storeProduct.hasPrice && storeProduct.price ? (
                          <div className="space-y-1">
                            <div className={`font-bold text-lg sm:text-xl ${storeProduct.isPromotion ? 'text-red-600' : 'text-blue-600'}`}>
                              €{Number(storeProduct.price).toFixed(2)}
                            </div>
                            {storeProduct.isPromotion && (
                              <Badge variant="destructive" className="text-xs">PROMO</Badge>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Prix non renseigné
                          </div>
                        )}
                      </div>
                      
                      {/* Statut et dernière vérification */}
                      <div className="space-y-2">
                        <Badge 
                          variant={storeProduct.isAvailable ? "default" : "destructive"}
                          className="text-xs font-medium"
                        >
                          {storeProduct.isAvailable ? "En stock" : "Rupture"}
                        </Badge>
                        {storeProduct.lastChecked && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Vérifié le {new Date(storeProduct.lastChecked).toLocaleDateString('fr-BE')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de vote sur les prix */}
      <Dialog open={!!voteDialogProduct} onOpenChange={(open) => !open && setVoteDialogProduct(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Évaluer le prix</DialogTitle>
          </DialogHeader>
          
          {voteDialogProduct && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <h4 className="font-medium">{voteDialogProduct.product?.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{store?.name}</p>
                <p className="text-lg font-bold text-blue-600">
                  €{Number(voteDialogProduct.price).toFixed(2)}
                </p>
              </div>

              <div className="space-y-3">
                <Label>Ce prix vous semble-t-il correct ?</Label>
                
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    onClick={() => handlePriceVote("correct")}
                    disabled={priceVoteMutation.isPending}
                    className="justify-start"
                    variant="outline"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2 text-green-600" />
                    Oui, le prix est correct
                  </Button>
                  
                  <Button
                    onClick={() => handlePriceVote("incorrect")}
                    disabled={priceVoteMutation.isPending}
                    className="justify-start"
                    variant="outline"
                  >
                    <ThumbsDown className="h-4 w-4 mr-2 text-red-600" />
                    Non, le prix est incorrect
                  </Button>
                  
                  <Button
                    onClick={() => handlePriceVote("outdated")}
                    disabled={priceVoteMutation.isPending}
                    className="justify-start"
                    variant="outline"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                    Le prix est obsolète
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggestedPrice">
                  Prix suggéré (optionnel)
                </Label>
                <Input
                  id="suggestedPrice"
                  type="number"
                  step="0.01"
                  placeholder="ex: 2.99"
                  value={suggestedPrice}
                  onChange={(e) => setSuggestedPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment">
                  Commentaire (optionnel)
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Précisions sur votre évaluation..."
                  value={voteComment}
                  onChange={(e) => setVoteComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog pour ajouter un prix */}
      <Dialog open={!!addPriceDialogProduct} onOpenChange={() => setAddPriceDialogProduct(null)}>
        <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un prix</DialogTitle>
          </DialogHeader>
          
          {addPriceDialogProduct && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <h4 className="font-medium">{addPriceDialogProduct.product?.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{store?.name}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPrice">
                  Prix (€) *
                </Label>
                <Input
                  id="newPrice"
                  type="number"
                  step="0.01"
                  placeholder="ex: 2.99"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPromo"
                  checked={isPromotion}
                  onChange={(e) => setIsPromotion(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="isPromo">
                  Ce produit est en promotion
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPriceComment">
                  Commentaire (optionnel)
                </Label>
                <Textarea
                  id="newPriceComment"
                  placeholder="Précisions sur le prix..."
                  value={newPriceComment}
                  onChange={(e) => setNewPriceComment(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleAddPrice}
                  disabled={addPriceMutation.isPending || !newPrice}
                  className="flex-1"
                >
                  {addPriceMutation.isPending ? "Ajout..." : "Ajouter le prix"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAddPriceDialogProduct(null)}
                  disabled={addPriceMutation.isPending}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Price Edit Dialog */}
      {editPriceDialogProduct && store && (
        <PriceEditDialog
          isOpen={!!editPriceDialogProduct}
          onClose={() => setEditPriceDialogProduct(null)}
          product={{
            id: editPriceDialogProduct.productId,
            name: editPriceDialogProduct.product?.name || '',
            brand: editPriceDialogProduct.product?.brand,
            category: editPriceDialogProduct.product?.category,
            image: editPriceDialogProduct.product?.imageUrl || editPriceDialogProduct.product?.image
          }}
          store={{
            id: store.id,
            name: store.name,
            brand: store.brand
          }}
          currentPrice={editPriceDialogProduct.price ? Number(editPriceDialogProduct.price) : undefined}
          isPromotion={editPriceDialogProduct.isPromotion}
        />
      )}



      <BottomNavigation />
    </div>
  );
}

export default StoreProducts;