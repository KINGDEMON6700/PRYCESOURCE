import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PriceEditDialog } from "@/components/PriceEditDialog";
import { OpenFoodFactsInfo } from "@/components/OpenFoodFactsInfo";
import { ArrowLeft, MapPin, Clock, Star, Store, Navigation, CheckCircle, XCircle, BarChart3, Edit, Flag, Eye } from "lucide-react";
import { StandardHeader } from "@/components/StandardHeader";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Product, PriceComparison as PriceComparisonType, Price } from "@shared/schema";
import { useState, useEffect } from "react";
import { safePrice, safeDistance } from "@/lib/safeNumber";

export default function ProductDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productId = params.id ? parseInt(params.id) : null;
  
  // User location for nearby stores
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Price edit dialog state
  const [editPriceStore, setEditPriceStore] = useState<{
    store: any;
    currentPrice: number;
    isPromotion: boolean;
  } | null>(null);

  // Get user's location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {

        }
      );
    }
  }, []);

  // Get product details
  const { data: product, isLoading: productLoading } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  // Get price comparison with location-based sorting
  const { data: comparison, isLoading: comparisonLoading } = useQuery<PriceComparisonType>({
    queryKey: [`/api/products/${productId}/comparison`, userLocation?.latitude, userLocation?.longitude],
    enabled: !!productId,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userLocation?.latitude) params.append('latitude', userLocation.latitude.toString());
      if (userLocation?.longitude) params.append('longitude', userLocation.longitude.toString());
      
      const response = await fetch(`/api/products/${productId}/comparison?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch price comparison');
      }
      return response.json();
    },
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Get price history for chart
  const { data: priceHistory = [], isLoading: historyLoading } = useQuery<Price[]>({
    queryKey: [`/api/products/${productId}/prices`],
    enabled: !!productId,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        return false;
      }
      return failureCount < 3;
    },
  });

  if (productLoading || comparisonLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Produit non trouvé
          </h1>
          <Button onClick={() => setLocation("/")}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  const getImageUrl = (product: Product) => {
    // D'abord essayer imageUrl, puis image comme fallback
    if (product?.imageUrl && product.imageUrl.trim() !== '') {
      return product.imageUrl;
    }
    if (product?.image && product.image.trim() !== '') {
      return product.image;
    }
    // Fallback vers une image basée sur la catégorie
    const categoryImages: { [key: string]: string } = {
      'alimentaire': 'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=400&h=300&fit=crop',
      'boissons': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
      'hygiene': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=300&fit=crop',
      'menage': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      'default': 'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=400&h=300&fit=crop'
    };
    return categoryImages[product?.category?.toLowerCase() || 'default'] || categoryImages.default;
  };

  const lowestPrice = comparison?.prices && comparison.prices.length > 0 ? 
    comparison.prices.reduce((min, price) => 
      price.price < min ? price.price : min, 
      comparison.prices[0].price
    ) : 0;

  const highestPrice = comparison?.prices && comparison.prices.length > 0 ? 
    comparison.prices.reduce((max, price) => 
      price.price > max ? price.price : max, 
      comparison.prices[0].price
    ) : 0;

  const savings = highestPrice - lowestPrice;
  const savingsPercentage = highestPrice ? Math.round((savings / highestPrice) * 100) : 0;

  // Prepare chart data from price history
  const chartData = priceHistory
    .slice(-30) // Last 30 price points
    .map(price => ({
      date: new Date(price.lastUpdated || price.createdAt || Date.now()).toLocaleDateString('fr-BE', { 
        month: 'short', 
        day: 'numeric' 
      }),
      price: typeof price.price === 'string' ? parseFloat(price.price) : price.price,
      store: price.storeId,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());





  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <StandardHeader 
        title={product?.name || "Chargement..."}
        showBackButton={true}
      />

      <div className="pt-16 p-2 sm:p-4 space-y-4 sm:space-y-6 max-w-sm mx-auto w-full">
        {/* Card avec informations du produit */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start space-x-3 sm:space-x-4">
              {/* Image du produit */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
                <img
                  src={getImageUrl(product)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1506617420156-8e4536971650?w=400&h=300&fit=crop&crop=center&auto=format";
                  }}
                />
              </div>
              
              {/* Informations produit */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {product.name}
                </h2>
                
                <div className="flex items-center space-x-1 sm:space-x-2 mb-2 sm:mb-3 flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    {product.brand || "Marque inconnue"}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {product.category}
                  </Badge>
                  {product.unit && (
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {product.unit}
                    </span>
                  )}
                </div>

                {product.description && (
                  <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                    {product.description}
                  </p>
                )}
                
                {/* Prix résumé */}
                {comparison && comparison.prices && comparison.prices.length > 0 && (
                  <div className="mt-2 sm:mt-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 sm:p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                        À partir de
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                        €{safePrice(lowestPrice)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Disponible dans {comparison.prices.length} magasin{comparison.prices.length > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Résumé des économies */}
        {comparison && comparison.prices && comparison.prices.length > 0 && savings > 0 && (
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 sm:p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm sm:text-base font-medium text-green-800 dark:text-green-300">
                    Économies possibles
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  €{savings.toFixed(2)} ({savingsPercentage}%)
                </div>
                <div className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                  En choisissant le magasin le moins cher
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price History Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Évolution des prix</span>
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {chartData.length} points de données
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs fill-gray-600 dark:fill-gray-400"
                    />
                    <YAxis 
                      className="text-xs fill-gray-600 dark:fill-gray-400"
                      tickFormatter={(value) => `€${value.toFixed(2)}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`€${value.toFixed(2)}`, 'Prix']}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informations OpenFoodFacts */}
        {product && (
          <OpenFoodFactsInfo 
            product={{
              id: product.id,
              name: product.name,
              barcode: product.barcode,
              brand: product.brand
            }}
          />
        )}

        {/* Où trouver ce produit - Section principale */}
        {comparison && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Store className="h-5 w-5 text-blue-600" />
                  <span>Où trouver ce produit</span>
                </CardTitle>
                {userLocation && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Navigation className="h-3 w-3" />
                    <span>Triés par proximité et prix</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {comparison.prices && comparison.prices.length > 0 ? (
                comparison.prices.slice(0, 5).map((priceData, index) => (
                  <div
                    key={priceData.store.id}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {priceData.store.name}
                          </span>

                          {index === 0 && (
                            <Badge className="bg-green-600 text-white text-xs">
                              Meilleur prix
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {priceData.store.address}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              €{priceData.price.toFixed(2)}
                            </span>
                            
                            {priceData.distance && (
                              <div className="flex items-center text-xs text-gray-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                {priceData.distance.toFixed(1)} km
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setLocation(`/stores/${priceData.store.id}/products`);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Voir catalogue
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center mt-2 space-x-4">
                          {priceData.isPromotion && (
                            <Badge variant="destructive" className="text-xs">
                              Promotion
                            </Badge>
                          )}
                          
                          {priceData.isAvailable ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-green-600 font-medium">Disponible</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-red-600 font-medium">Indisponible</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun magasin ne vend actuellement ce produit</p>
                  <p className="text-sm mt-1">Contribuez en signalant sa disponibilité !</p>
                </div>
              )}
              
              {!userLocation && (
                <div className="text-center py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>Activez la géolocalisation pour voir les magasins les plus proches</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setLocation("/map")}
          >
            <MapPin className="h-4 w-4 mr-2" />
            Voir sur la carte
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setLocation("/report")}
          >
            <Flag className="h-4 w-4 mr-2" />
            Contribuer
          </Button>
        </div>
      </div>

      {/* Price Edit Dialog */}
      {editPriceStore && product && (
        <PriceEditDialog
          isOpen={!!editPriceStore}
          onClose={() => setEditPriceStore(null)}
          product={{
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            image: product.imageUrl
          }}
          store={{
            id: editPriceStore.store.id,
            name: editPriceStore.store.name,
            brand: editPriceStore.store.brand
          }}
          currentPrice={editPriceStore.currentPrice}
          isPromotion={editPriceStore.isPromotion}
        />
      )}

      <BottomNavigation />
    </div>
  );
}