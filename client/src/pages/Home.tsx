import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Home as HomeIcon, MapPin, AlertTriangle, Flag, Store, Package, Settings, Bell, ChevronDown, ShoppingCart, QrCode, Shield, User, History } from "lucide-react";

import { PryceLogo } from "@/components/PryceLogo";
import { LoadingState } from "@/components/LoadingSpinner";
import { StoreCard } from "@/components/StoreCard";
import { ProductCard } from "@/components/ProductCard";
import { QuickActionsCard } from "@/components/QuickActionsCard";
import { PromotionBanner } from "@/components/PromotionBanner";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";

import { HeaderWithLocation } from "@/components/HeaderWithLocation";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useToast } from "@/hooks/use-toast";
import { DevRoleToggle } from "@/components/DevRoleToggle";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import type { StoreWithRating, ProductWithPrice } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentCity, setCurrentCity] = useState<string>("Localisation...");
  const [detailedLocation, setDetailedLocation] = useState<{
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    address?: string;
    fullAddress?: string;
    street?: string;
    postalCode?: string;
  } | null>(null);

  // Géolocalisation pour obtenir le nom de la ville
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              setLocation({ latitude, longitude });
              
              // Obtenir le nom de la ville via géocodage inverse
              try {
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`
                );
                const data = await response.json();
                
                let city = "Belgique";
                if (data.city) {
                  city = data.city;
                } else if (data.locality) {
                  city = data.locality;
                }
                
                setCurrentCity(city);
                setDetailedLocation({
                  city,
                  country: data.countryName || "Belgique",
                  latitude,
                  longitude,
                  address: `${data.locality || city}, ${data.principalSubdivision || ""} ${data.countryName || "Belgique"}`.trim(),
                  fullAddress: `${data.streetName ? data.streetName + ', ' : ''}${data.locality || city}, ${data.postalCode || ''} ${data.countryName || "Belgique"}`.trim(),
                  street: data.streetName || data.street || undefined,
                  postalCode: data.postalCode || undefined
                });
              } catch (geocodeError) {

                setCurrentCity("Position actuelle");
                setDetailedLocation({
                  city: "Position actuelle",
                  country: "Belgique",
                  latitude,
                  longitude,
                  address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                  fullAddress: `Coordonnées GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                  street: undefined,
                  postalCode: undefined
                });
              }
            },
            (error) => {

              setCurrentCity("Bruxelles"); // Fallback
            }
          );
        } else {
          setCurrentCity("Bruxelles");
        }
      } catch (error) {

        setCurrentCity("Bruxelles");
      }
    };

    getCurrentLocation();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const { isScrolled, isScrollingDown, scrollProgress } = useScrollAnimation();

  // Vérifier si l'utilisateur est admin
  // const isAdmin = user && ["44762987"].includes(user.id);

  // Fetch stores (nearby if location available, otherwise all stores)
  const { data: stores, isLoading: storesLoading } = useQuery<StoreWithRating[]>({
    queryKey: location 
      ? [`/api/stores/nearby?latitude=${location.latitude}&longitude=${location.longitude}`] 
      : ["/api/stores"],
    enabled: true, // Always enabled
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
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

  // Fetch popular products
  const { data: popularProducts, isLoading: productsLoading } = useQuery<ProductWithPrice[]>({
    queryKey: ["/api/products/popular", { limit: 8 }],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
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

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-gray-900 min-h-screen relative">
      {/* Advanced Header with Scroll Animation */}
      <header 
        className={`sticky top-0 z-50 bg-gradient-to-r from-pryce-blue to-blue-600 text-white shadow-lg transition-all duration-300 ease-out ${
          isScrolled ? "backdrop-blur-md bg-opacity-95" : ""
        }`}
        style={{
          padding: `${16 - (scrollProgress * 8)}px`,
          transform: isScrollingDown && isScrolled ? 'translateY(-3px)' : 'translateY(0)',
          boxShadow: isScrolled ? '0 8px 32px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <div className="flex items-center justify-between px-2 sm:px-4">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 flex items-center justify-center">
              <PryceLogo className="w-full h-full" />
            </div>
            <h1 
              className="font-bold text-blue-200 transition-all duration-300 ease-out text-[16px]"
              style={{
                fontSize: `${1.5 - (scrollProgress * 0.3)}rem`,
                transform: `scale(${1 - (scrollProgress * 0.15)})`,
                transformOrigin: 'left center',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              Pryce
            </h1>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  className="flex items-center space-x-1 text-sm text-white/80 transition-all duration-300 ease-out hover:bg-white/20 pl-[13px] pr-[13px]"
                  style={{
                    transform: `scale(${1 - (scrollProgress * 0.1)})`,
                    opacity: isScrolled ? 0.7 : 0.8
                  }}
                >
                  <MapPin 
                    className="transition-all duration-300"
                    style={{
                      width: `${16 - (scrollProgress * 2)}px`,
                      height: `${16 - (scrollProgress * 2)}px`,
                    }}
                  />
                  <ChevronDown 
                    className="transition-all duration-300"
                    style={{
                      width: `${12 - (scrollProgress * 1)}px`,
                      height: `${12 - (scrollProgress * 1)}px`,
                    }}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                {detailedLocation ? (
                  <>
                    <DropdownMenuItem disabled>
                      <div className="flex flex-col space-y-1 w-full">
                        <div className="font-medium text-white">{detailedLocation.city}</div>
                        {detailedLocation.street && (
                          <div className="text-sm text-gray-400">{detailedLocation.street}</div>
                        )}
                        <div className="text-sm text-gray-400">
                          {detailedLocation.fullAddress || detailedLocation.address}
                        </div>
                        {detailedLocation.postalCode && (
                          <div className="text-sm text-gray-400">Code postal: {detailedLocation.postalCode}</div>
                        )}
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <div className="flex flex-col space-y-1 w-full">
                        <div className="text-sm text-gray-500">Coordonnées GPS</div>
                        <div className="text-xs font-mono text-gray-400">
                          {detailedLocation.latitude.toFixed(6)}, {detailedLocation.longitude.toFixed(6)}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem disabled>
                    <div className="text-sm text-gray-500">Localisation en cours...</div>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/report")}
              className="text-white hover:bg-white/20 transition-all duration-300"
              style={{
                transform: `scale(${1 - (scrollProgress * 0.15)})`,
                opacity: 0.9 + (scrollProgress * 0.1),
                padding: `${8 - (scrollProgress * 2)}px`
              }}
              title="Contribuer"
            >
              <Flag 
                className="transition-all duration-300"
                style={{
                  width: `${16 - (scrollProgress * 2)}px`,
                  height: `${16 - (scrollProgress * 2)}px`,
                }}
              />
            </Button>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="pb-20 bg-white dark:bg-gray-900">
        {/* Promotion Banner */}
        <div className="p-2 sm:p-4">
          <PromotionBanner
            title="Offre spéciale sur les produits laitiers"
            description="Profitez de -20% sur tous les yaourts et laits"
            discount={20}
            store="Delhaize"
            validUntil="31/07/2025"
          />
        </div>

        


        {/* Nearest Stores */}
        <section className="px-3 sm:px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Magasins les moins chers
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/stores")}
              className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
            >
              Voir tout
            </Button>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            {storesLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse shadow-lg">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl"></div>
                      <div className="flex-1 space-y-2 sm:space-y-3">
                        <div className="h-4 sm:h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4"></div>
                        <div className="h-3 sm:h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : stores?.length ? (
              stores.slice(0, 3).map((store) => (
                <StoreCard key={store.id} store={store} />
              ))
            ) : (
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-dashed border-2">
                <CardContent className="p-4 sm:p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg font-medium">
                    Aucun magasin trouvé dans votre région
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-xs sm:text-sm mt-2">
                    Activez la géolocalisation pour voir les magasins près de vous
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="px-3 sm:px-4 lg:px-6 py-4">
          <QuickActionsCard />
        </section>

        {/* Popular Products */}
        <section className="px-3 sm:px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Produits populaires
            </h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate("/products")}
              className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
            >
              Voir tout
            </Button>
          </div>
          
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {productsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-2 sm:p-3">
                    <div className="w-full h-20 sm:h-24 bg-gray-200 rounded-lg mb-2 sm:mb-3"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-1 sm:mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))
            ) : popularProducts?.length ? (
              popularProducts.slice(0, 4).map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onClick={() => navigate(`/product/${product.id}`)}
                  showPriceContribution={true}
                />
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8 col-span-2">
                Aucun produit populaire disponible
              </p>
            )}
          </div>
        </section>

        {/* Developer Zone */}
        <section className="px-3 sm:px-4 lg:px-6 py-4">
          <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Zone de test développeur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {isAdmin ? <Shield className="h-5 w-5 text-green-400" /> : <User className="h-5 w-5 text-gray-400" />}
                    <span className="text-white font-medium">Statut actuel:</span>
                    <Badge variant={isAdmin ? "default" : "secondary"} className={isAdmin ? "bg-green-600 text-white" : "bg-gray-600 text-white"}>
                      {isAdmin ? "Administrateur" : "Contributeur"}
                    </Badge>
                  </div>
                </div>
                <DevRoleToggle />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Utilisez ce bouton pour tester les fonctionnalités d'administration sans avoir à modifier le code.
              </p>
            </CardContent>
          </Card>
        </section>


      </main>
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
