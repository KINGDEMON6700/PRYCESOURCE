import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Bell, Flag, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { PryceLogo } from "@/components/PryceLogo";

interface UnifiedHeaderProps {
  title?: string;
  subtitle?: React.ReactNode;
  showBackButton?: boolean;
  showLocation?: boolean;
  showNotifications?: boolean;
  showContribute?: boolean;
  showProfile?: boolean;
  onBack?: () => void;
  customAction?: React.ReactNode;
}

export function UnifiedHeader({
  title,
  subtitle,
  showBackButton = false,
  showLocation = false,
  showNotifications = false,
  showContribute = false,
  showProfile = false,
  onBack,
  customAction
}: UnifiedHeaderProps) {
  const [, navigate] = useLocation();
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
  const { isScrolled, scrollProgress } = useScrollAnimation();

  // Récupérer les notifications utilisateur
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: showNotifications,
    refetchInterval: 30000, // Refetch toutes les 30 secondes
  });

  const unreadNotifications = notifications.length;

  // Géolocalisation pour la localisation
  useEffect(() => {
    if (!showLocation) return;
    
    const getCurrentLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              try {
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`
                );
                const data = await response.json();
                
                setDetailedLocation({
                  city: data.city || data.locality || "Localisation inconnue",
                  country: data.countryName || "Belgique",
                  latitude,
                  longitude,
                  address: data.locality || "",
                  fullAddress: [data.locality, data.city, data.principalSubdivision].filter(Boolean).join(", "),
                  street: data.street || "",
                  postalCode: data.postcode || ""
                });
              } catch (error) {
                // Erreur géocodage, utilisation des valeurs par défaut
                setDetailedLocation({
                  city: "Bruxelles",
                  country: "Belgique", 
                  latitude: 50.8503,
                  longitude: 4.3517
                });
              }
            },
            (error) => {
              // Erreur géolocalisation, utilisation de Bruxelles par défaut
              setDetailedLocation({
                city: "Bruxelles",
                country: "Belgique",
                latitude: 50.8503,
                longitude: 4.3517
              });
            }
          );
        }
      } catch (error) {

      }
    };

    getCurrentLocation();
  }, [showLocation]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <header 
      className="fixed top-0 left-0 w-full bg-gradient-to-r from-pryce-blue to-blue-600 text-white z-50 transition-all duration-300 ease-out"
      style={{
        height: subtitle ? `${80 - (scrollProgress * 16)}px` : `${64 - (scrollProgress * 16)}px`,
        backgroundImage: isScrolled ? 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
      }}
    >
      <div className="flex flex-col h-full max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 flex-1">
          {/* Left side - Back button or Logo */}
          <div className="flex items-center space-x-3">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-white hover:bg-white/20 p-2"
                style={{
                  transform: `scale(${1 - (scrollProgress * 0.1)})`,
                  opacity: isScrolled ? 0.8 : 1
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : (
              <div 
                className="flex items-center space-x-2 transition-all duration-300"
                style={{
                  transform: `scale(${1 - (scrollProgress * 0.15)})`,
                  opacity: isScrolled ? 0.9 : 1
                }}
              >
                <div 
                  className="transition-all duration-300"
                  style={{
                    width: `${32 - (scrollProgress * 8)}px`,
                    height: `${32 - (scrollProgress * 8)}px`,
                  }}
                >
                  <PryceLogo className="w-full h-full" />
                </div>
                <span 
                  className="font-bold transition-all duration-300"
                  style={{
                    fontSize: `${18 - (scrollProgress * 2)}px`,
                    opacity: isScrolled ? 0.9 : 1
                  }}
                >
                  Pryce
                </span>
              </div>
            )}
            
            {/* Title if provided */}
            {title && !showBackButton && (
              <h1 
                className="font-semibold transition-all duration-300"
                style={{
                  fontSize: `${16 - (scrollProgress * 1)}px`,
                  opacity: isScrolled ? 0.8 : 1
                }}
              >
                {title}
              </h1>
            )}
          </div>

          {/* Center - Title for back button mode */}
          {title && showBackButton && (
            <h1 
              className="font-semibold transition-all duration-300 absolute left-1/2 transform -translate-x-1/2"
              style={{
                fontSize: `${18 - (scrollProgress * 2)}px`,
                opacity: isScrolled ? 0.8 : 1
              }}
            >
              {title}
            </h1>
          )}

          {/* Right side - Actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {showLocation && detailedLocation && (
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
                        {Number(detailedLocation.latitude || 0).toFixed(6)}, {Number(detailedLocation.longitude || 0).toFixed(6)}
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {showNotifications && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 transition-all duration-300 relative"
                    style={{
                      transform: `scale(${1 - (scrollProgress * 0.1)})`,
                      opacity: isScrolled ? 0.7 : 0.8
                    }}
                  >
                    <Bell 
                      className="transition-all duration-300"
                      style={{
                        width: `${18 - (scrollProgress * 2)}px`,
                        height: `${18 - (scrollProgress * 2)}px`,
                      }}
                    />
                    {unreadNotifications > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                      >
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <DropdownMenuItem disabled>
                      <div className="text-center text-gray-400 py-4">
                        Aucune notification
                      </div>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <div className="px-3 py-2 border-b">
                        <h3 className="font-medium text-white">Notifications</h3>
                        <p className="text-sm text-gray-400">{unreadNotifications} nouvelle{unreadNotifications > 1 ? 's' : ''}</p>
                      </div>
                      {notifications.slice(0, 5).map((notification: any) => (
                        <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 space-y-1">
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-xs px-2 py-1 rounded ${
                              notification.type === 'success' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-blue-600 text-white'
                            }`}>
                              {notification.title}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(notification.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed">
                            {notification.message}
                          </p>
                        </DropdownMenuItem>
                      ))}
                      {notifications.length > 5 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate("/profile")} className="text-center">
                            <span className="text-sm text-blue-400 hover:text-blue-300">
                              Voir toutes les notifications
                            </span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {customAction && (
              <div 
                className="transition-all duration-300"
                style={{
                  transform: `scale(${1 - (scrollProgress * 0.1)})`,
                  opacity: isScrolled ? 0.7 : 0.8
                }}
              >
                {customAction}
              </div>
            )}

            {showContribute && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/report")}
                className="text-white hover:bg-white/20 transition-all duration-300"
                style={{
                  transform: `scale(${1 - (scrollProgress * 0.1)})`,
                  opacity: isScrolled ? 0.7 : 0.8
                }}
              >
                <Flag 
                  className="transition-all duration-300"
                  style={{
                    width: `${18 - (scrollProgress * 2)}px`,
                    height: `${18 - (scrollProgress * 2)}px`,
                  }}
                />
              </Button>
            )}

            {showProfile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/profile")}
                className="text-white hover:bg-white/20 transition-all duration-300"
                style={{
                  transform: `scale(${1 - (scrollProgress * 0.1)})`,
                  opacity: isScrolled ? 0.7 : 0.8
                }}
              >
                <User 
                  className="transition-all duration-300"
                  style={{
                    width: `${18 - (scrollProgress * 2)}px`,
                    height: `${18 - (scrollProgress * 2)}px`,
                  }}
                />
              </Button>
            )}
          </div>
        </div>
        
        {/* Subtitle section */}
        {subtitle && (
          <div 
            className="px-2 sm:px-4 pb-2 transition-all duration-300"
            style={{
              opacity: isScrolled ? 0.6 : 0.8,
              transform: `scale(${1 - (scrollProgress * 0.1)})`
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </header>
  );
}