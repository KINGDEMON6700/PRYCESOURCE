import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Store, MapPin, Euro } from "lucide-react";
import type { Store as StoreType, Product } from "@shared/schema";

interface StoreCatalogListProps {
  product: Product;
}

// Calcul de distance haversine
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en kilomètres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function StoreCatalogList({ product }: StoreCatalogListProps) {
  const [, navigate] = useLocation();
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);

  const { data: stores = [] } = useQuery<StoreType[]>({
    queryKey: ["/api/stores"],
  });

  // Charger les relations store_products pour ce produit
  const { data: storeProducts = [] } = useQuery({
    queryKey: [`/api/products/${product.id}/stores`],
  });

  // Charger les prix réels du produit pour chaque magasin
  const { data: priceComparison } = useQuery({
    queryKey: [`/api/products/${product.id}/comparison`],
  });

  // Géolocalisation de l'utilisateur
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {

        }
      );
    }
  }, [userLocation]);

  // Logique de tri intelligent: ne montrer que les magasins qui ont le produit
  const smartStores = useMemo(() => {
    if (!stores.length) return [];

    // Filtrer d'abord pour ne garder que les magasins qui ont le produit
    const storesWithProduct = stores.filter(store => {
      // Vérifier si le magasin a le produit dans store_products
      const hasStoreProduct = storeProducts.some((sp: any) => sp.storeId === store.id);
      return hasStoreProduct;
    });

    // Enrichir avec les données de prix et distance
    const storesWithData = storesWithProduct.map(store => {
      let distance = undefined;
      let lowestPrice = undefined;
      let hasPrice = false;

      // Calculer la distance si géolocalisation disponible
      if (userLocation && store.latitude && store.longitude) {
        distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          Number(store.latitude),
          Number(store.longitude)
        );
      }

      // Trouver le prix pour ce magasin dans la comparaison
      if (priceComparison?.prices) {
        const storePrice = priceComparison.prices.find((p: any) => p.store.id === store.id);
        if (storePrice && storePrice.price > 0) {
          lowestPrice = storePrice.price;
          hasPrice = true;
        }
      }

      return {
        ...store,
        distance,
        lowestPrice,
        hasPrice
      };
    });

    // Trier par distance puis par prix
    storesWithData.sort((a, b) => {
      if (a.distance && b.distance) {
        return a.distance - b.distance;
      }
      if (a.lowestPrice && b.lowestPrice) {
        return a.lowestPrice - b.lowestPrice;
      }
      return 0;
    });

    // Retourner tous les magasins qui ont le produit (pas de limite arbitraire)
    return storesWithData;
  }, [stores, userLocation, storeProducts, priceComparison]);

  return (
    <>
    <div className="w-full space-y-2">
      {/* Grid des magasins */}
      <div className="grid gap-2">
        {smartStores.map((store, index) => {
          const storeWithData = store as StoreType & { distance?: number; lowestPrice?: number; hasPrice?: boolean };
          return (
            <div
              key={store.id}
              className="relative bg-gradient-to-r from-gray-800 to-gray-700 rounded-md border border-gray-600 hover:border-blue-500 cursor-pointer transition-all duration-200 hover:shadow-md p-3 overflow-hidden"
              onClick={() => {
                navigate(`/stores/${store.id}/products`);
              }}
            >
              {/* Badge de position */}
              <div className="absolute -top-0.5 -left-0.5 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {index + 1}
              </div>

              {/* En-tête : nom, brand et boutons en une ligne */}
              <div className="flex items-center justify-between mb-2 pt-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Store className="h-3 w-3 text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm truncate">{store.name}</h4>
                  </div>
                </div>
              </div>

              {/* Informations prix et distance compactes */}
              <div className="flex items-center gap-2">
                {storeWithData.hasPrice && storeWithData.lowestPrice && storeWithData.lowestPrice < 999 ? (
                  <div className="flex items-center gap-1 bg-green-600/20 px-2 py-1 rounded-full">
                    <Euro className="w-2.5 h-2.5 text-green-400" />
                    <span className="text-green-400 font-bold text-xs">
                      {storeWithData.lowestPrice.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-gray-600/20 px-2 py-1 rounded-full">
                    <Euro className="w-2.5 h-2.5 text-gray-400" />
                    <span className="text-gray-400 text-xs">Prix ?</span>
                  </div>
                )}
                
                {storeWithData.distance && storeWithData.distance < 999 && (
                  <div className="flex items-center gap-1 bg-blue-600/20 px-2 py-1 rounded-full">
                    <MapPin className="w-2.5 h-2.5 text-blue-400" />
                    <span className="text-blue-400 font-medium text-xs">
                      {Number(storeWithData.distance || 0).toFixed(1)}km
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {smartStores.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Aucun magasin disponible</p>
        </div>
      )}
    </div>
    </>
  );
}