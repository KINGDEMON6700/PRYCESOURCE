import { Star, MapPin, Clock, Phone, AlertCircle, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { StoreWithRating, StoreCategory } from "@shared/schema";
import { getStoreStatus } from "@/lib/storeUtils";
import { safeRating, safeDistance } from "@/lib/safeNumber";

interface StoreCardProps {
  store: StoreWithRating;
  onClick?: () => void;
}

export function StoreCard({ store, onClick }: StoreCardProps) {
  const [, setLocation] = useLocation();
  
  // Récupérer les catégories pour afficher les informations correctes
  const { data: categories = [] } = useQuery<StoreCategory[]>({
    queryKey: ["/api/store-categories"],
    queryFn: () => fetch("/api/store-categories").then(res => res.json()),
  });
  
  // Trouver la catégorie du magasin
  const storeCategory = categories.find(cat => cat.id === store.categoryId);
  
  // Calcul du statut en temps réel
  const storeStatus = getStoreStatus(store.openingHours);
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setLocation(`/stores/${store.id}`);
    }
  };

  const handleCallStore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (store.phone) {
      window.open(`tel:${store.phone}`, '_self');
    }
  };

  const handleGPS = (e: React.MouseEvent) => {
    e.stopPropagation();
    const address = encodeURIComponent(`${store.address}, ${store.city}`);
    
    // Détecter si c'est mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Sur mobile, essayer d'ouvrir dans l'ordre de préférence
      const urls = [
        `waze://ul?q=${address}`,
        `comgooglemaps://?q=${address}`,
        `maps://maps.apple.com/?q=${address}`,
        `https://www.google.com/maps/search/?api=1&query=${address}`
      ];
      
      // Essayer d'ouvrir Waze d'abord
      const wazeWindow = window.open(urls[0], '_blank');
      
      // Si Waze ne s'ouvre pas, fallback vers Google Maps
      setTimeout(() => {
        if (wazeWindow) {
          wazeWindow.close();
        }
        window.open(urls[3], '_blank');
      }, 1000);
    } else {
      // Sur desktop, ouvrir directement Google Maps
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  const handleViewCatalog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocation(`/stores/${store.id}/products`);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 w-full relative group"
      onClick={handleClick}
    >
      <CardContent className="p-3 sm:p-4 lg:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            {/* Store Logo/Category */}
            <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 ${storeCategory?.color || "bg-gray-500"} rounded-xl flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0`}>
              <span className="text-white font-bold text-base sm:text-lg lg:text-xl">
                {store.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            
            {/* Store Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base lg:text-lg truncate">
                  {store.name}
                </h3>
                {storeCategory && (
                  <Badge variant="outline" className={`${storeCategory.color} text-xs px-2 py-0.5 flex items-center gap-1 flex-shrink-0`}>
                    <span className="text-xs">{storeCategory.label}</span>
                  </Badge>
                )}
              </div>
              
              {/* Status and Opening Hours */}
              <div className="flex flex-col gap-1 mt-1 sm:mt-2">
                {/* Status */}
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${
                    storeStatus.status === 'open' ? 'bg-green-500' : 
                    storeStatus.status === 'closed' ? 'bg-red-500' : 'bg-orange-500'
                  }`}></div>
                  <span className={`text-xs sm:text-sm font-bold ${
                    storeStatus.status === 'open' ? 'text-green-600 dark:text-green-400' : 
                    storeStatus.status === 'closed' ? 'text-red-600 dark:text-red-400' : 
                    'text-orange-600 dark:text-orange-400'
                  }`}>
                    {storeStatus.status === 'open' ? 'OUVERT' : 
                     storeStatus.status === 'closed' ? 'FERMÉ' : 'FERMÉ'}
                  </span>
                </div>
                
                {/* Opening Hours */}
                {storeStatus.todayHours && (
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      {storeStatus.todayHours}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Rating */}
              <div className="flex items-center mt-1">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-yellow-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  {store.averageRating && store.averageRating > 0 ? `${safeRating(store.averageRating)} (${store.ratingCount || 0})` : "Pas d'avis"}
                </span>
              </div>
              
              {/* Distance */}
              {store.distance && store.distance > 0 && (
                <div className="flex items-center mt-1">
                  <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {safeDistance(store.distance)} km
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {/* Catalog Button */}
            <button
              onClick={handleViewCatalog}
              className="p-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
              title="Voir le catalogue des produits"
            >
              <Eye className="h-4 w-4" />
            </button>
            
            {/* Phone Button */}
            {store.phone && (
              <button
                onClick={handleCallStore}
                className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                title="Appeler le magasin"
              >
                <Phone className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}