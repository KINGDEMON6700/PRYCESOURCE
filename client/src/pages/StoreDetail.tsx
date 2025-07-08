import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Star, MapPin, Phone, Clock, Navigation, ShoppingCart, ArrowRight, 
  ExternalLink, Share2, Heart, ChevronRight, Globe, Info,
  Calendar, Users, TrendingUp, Award, Building2, AlertCircle, Flag
} from "lucide-react";
import { StandardHeader } from "@/components/StandardHeader";
import { StoreReviewSystem } from "@/components/StoreReviewSystem";
import { getStoreStatus } from "@/lib/storeUtils";
import type { Store, ProductWithPrice } from "@shared/schema";

interface ProductWithStorePrice extends ProductWithPrice {
  storePrice: number | null;
  isAvailable: boolean;
  isPromotion: boolean;
}

interface StoreWithProducts extends Store {
  averageRating: number;
  ratingCount: number;
  distance?: number;
  products?: ProductWithStorePrice[];
}

// Images de marques des magasins
const getStoreBrandImage = (brand?: string) => {
  if (!brand || typeof brand !== 'string') return "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=300&fit=crop";
  
  const brandImages = {
    aldi: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/ALDI_logo.svg/800px-ALDI_logo.svg.png",
    lidl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Lidl-Logo.svg/800px-Lidl-Logo.svg.png",
    delhaize: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Delhaize_logo.svg/800px-Delhaize_logo.svg.png",
    carrefour: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/800px-Carrefour_logo.svg.png",
    okay: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=300&fit=crop",
  };
  
  return brandImages[brand.toLowerCase() as keyof typeof brandImages] || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=300&fit=crop";
};

// Couleurs de marques
const getBrandColor = (brand?: string) => {
  if (!brand || typeof brand !== 'string') return "bg-blue-600";
  
  const brandColors = {
    aldi: "bg-blue-600",
    lidl: "bg-red-600", 
    delhaize: "bg-green-600",
    carrefour: "bg-blue-500",
    okay: "bg-orange-600",
  };
  
  return brandColors[brand.toLowerCase() as keyof typeof brandColors] || "bg-blue-600";
};

export default function StoreDetail() {
  const [match, params] = useRoute("/stores/:id");
  const storeId = params?.id;
  const [, setLocation] = useLocation();

  const { data: store, isLoading, error } = useQuery<StoreWithProducts>({
    queryKey: [`/api/stores/${storeId}`],
    enabled: !!storeId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Error handling only
  if (error && process.env.NODE_ENV === 'development') {
    console.error("Store query error:", error);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <StandardHeader title="Chargement..." showBackButton={true} />
        <main className="pt-16 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-gray-800 rounded-lg"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-800 rounded-lg"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <StandardHeader title="Erreur" showBackButton={true} />
        <main className="pt-16 p-6">
          <Card className="bg-red-900/20 border-red-800">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Magasin introuvable</h2>
              <p className="text-gray-300 mb-4">Ce magasin n'existe pas ou a été supprimé.</p>
              <Button onClick={() => setLocation("/")} className="bg-blue-600 hover:bg-blue-700">
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const storeStatus = getStoreStatus(store.openingHours);
  const brandImage = getStoreBrandImage(store.brand);
  const brandColor = getBrandColor(store.brand);

  const handleNavigateToProducts = () => {
    setLocation(`/stores/${store.id}/products`);
  };

  const handleOpenGPS = () => {
    const address = `${store.address}, ${store.postalCode} ${store.city}`;
    const encodedAddress = encodeURIComponent(address);
    
    // Détection mobile vs desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Essayer d'ouvrir Waze d'abord, puis fallback vers Google Maps
      const wazeUrl = `waze://?q=${encodedAddress}`;
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      
      // Tentative d'ouverture de Waze
      window.location.href = wazeUrl;
      
      // Fallback vers Google Maps après 2 secondes
      setTimeout(() => {
        window.open(googleMapsUrl, '_blank');
      }, 2000);
    } else {
      // Desktop: ouvrir Google Maps dans un nouvel onglet
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: store.name,
        text: `Découvrez ${store.name} sur Pryce`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleContribute = () => {
    // Naviguer vers la page de contribution avec les informations du magasin pré-remplies
    const storeData = encodeURIComponent(JSON.stringify({
      storeId: store.id,
      storeName: store.name,
      brand: store.brand,
      address: store.address,
      city: store.city,
      postalCode: store.postalCode,
      type: 'store_info_correction'
    }));
    setLocation(`/report?data=${storeData}`);
  };

  const formatOpeningHours = (openingHours: any) => {
    if (!openingHours || typeof openingHours !== 'object') return [];
    
    const dayLabels: Record<string, string> = {
      monday: "Lundi",
      tuesday: "Mardi", 
      wednesday: "Mercredi",
      thursday: "Jeudi",
      friday: "Vendredi",
      saturday: "Samedi",
      sunday: "Dimanche"
    };

    // Ordre des jours de la semaine
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return dayOrder
      .filter(day => openingHours[day] !== undefined)
      .map(day => ({
        day: dayLabels[day] || day,
        hours: openingHours[day] as string
      }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <StandardHeader 
        title={store.name}
        showBackButton={true}
      />

      <main className="pb-6 pt-16">
        {/* Hero Section avec image du magasin */}
        <div className="relative">
          <div className="h-64 overflow-hidden">
            <img 
              src={brandImage}
              alt={store.name}
              className="w-full h-full object-contain object-center bg-gray-900"
              style={{ backgroundColor: '#1f2937' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/20 to-transparent"></div>
          </div>
          
          {/* Overlay avec informations principales */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-3">{store.name}</h1>
                
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <Badge className="bg-blue-600 text-white px-3 py-1">
                    Supermarché
                  </Badge>
                  
                  {storeStatus.isOpen !== null && (
                    <Badge 
                      variant={storeStatus.isOpen ? "default" : "secondary"}
                      className={`${storeStatus.isOpen ? 'bg-green-600' : 'bg-red-600'} text-white px-3 py-1`}
                    >
                      {storeStatus.message}
                    </Badge>
                  )}
                  
                  {store.distance && (
                    <Badge variant="outline" className="border-white/30 text-white px-3 py-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {store.distance.toFixed(1)} km
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-4 text-white/90">
                  <div className="flex items-center space-x-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-semibold">{Number(store.averageRating || 0).toFixed(1)}</span>
                    <span className="text-white/70">({store.ratingCount || 0} avis)</span>
                  </div>
                  
                  {store.products && store.products.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <ShoppingCart className="w-4 h-4" />
                      <span>{store.products.length} produits</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2 ml-4">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleShare}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 space-y-6 mt-6">
          {/* Actions rapides */}
          <div className="grid grid-cols-3 gap-3">
            <Button 
              onClick={handleNavigateToProducts}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-14"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Produits
            </Button>
            
            <Button 
              onClick={handleOpenGPS}
              variant="outline"
              className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white h-14"
            >
              <Navigation className="w-5 h-5 mr-2" />
              GPS
            </Button>

            <Button 
              onClick={handleContribute}
              variant="outline"
              className="border-orange-600 text-orange-400 hover:bg-orange-600 hover:text-white h-14"
            >
              <Flag className="w-5 h-5 mr-2" />
              Contribuer
            </Button>
          </div>

          {/* Informations détaillées */}
          <div className="grid grid-cols-1 gap-4">
            {/* Adresse complète */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-600/20 p-3 rounded-lg">
                      <MapPin className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">Adresse</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {store.address}<br />
                        {store.postalCode} {store.city}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            {store.phone && (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-600/20 p-3 rounded-lg">
                        <Phone className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Téléphone</h3>
                        <p className="text-gray-300 text-sm">{store.phone}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => window.open(`tel:${store.phone}`, '_self')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Appeler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Horaires d'ouverture */}
            {store.openingHours && (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-5">
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-600/20 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-4">Horaires d'ouverture</h3>
                      <div className="space-y-2">
                        {formatOpeningHours(store.openingHours).map(({ day, hours }) => (
                          <div key={day} className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm">{day}</span>
                            <span className="text-gray-400 text-sm font-mono">{hours}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Statistiques du magasin */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-5">
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-600/20 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-4">Statistiques</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {store.products?.length || 0}
                        </div>
                        <div className="text-gray-400 text-xs">Produits</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-500 mb-1">
                          {Number(store.averageRating || 0).toFixed(1)}
                        </div>
                        <div className="text-gray-400 text-xs">Note moyenne</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Aperçu des produits populaires */}
          {store.products && store.products.length > 0 && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Produits populaires</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleNavigateToProducts}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Tout voir
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {store.products.slice(0, 4).map((product) => (
                    <div 
                      key={product.id} 
                      className="bg-gray-800/50 rounded-xl p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
                      onClick={() => setLocation(`/product/${product.id}`)}
                    >
                      <div className="aspect-square bg-gray-700 rounded-lg mb-3 overflow-hidden">
                        <img 
                          src={product.image || "/api/placeholder/120/120"} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/api/placeholder/120/120";
                          }}
                        />
                      </div>
                      <h4 className="text-white text-sm font-medium truncate mb-1">{product.name}</h4>
                      <p className="text-gray-400 text-xs truncate mb-2">{product.brand}</p>
                      {product.storePrice ? (
                        <div className="flex items-center justify-between">
                          <span className="text-green-400 text-sm font-semibold">{product.storePrice}€</span>
                          {product.isPromotion && (
                            <Badge className="bg-red-600 text-white text-xs px-2 py-0.5">
                              PROMO
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-xs">Prix non disponible</p>
                      )}
                    </div>
                  ))}
                </div>
                
                {store.products.length > 4 && (
                  <Button 
                    onClick={handleNavigateToProducts}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                  >
                    Voir tous les produits ({store.products.length})
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Système d'avis */}
          <StoreReviewSystem 
            storeId={store.id} 
            storeName={store.name}
          />
        </div>
      </main>
    </div>
  );
}