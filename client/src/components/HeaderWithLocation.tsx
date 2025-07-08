import { useState, useEffect } from "react";
import { MapPin, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface HeaderWithLocationProps {
  title: string;
  icon: React.ReactNode;
  showNotifications?: boolean;
  customAction?: React.ReactNode;
}

export function HeaderWithLocation({ 
  title, 
  icon, 
  showNotifications = true,
  customAction 
}: HeaderWithLocationProps) {
  const [location, setLocation] = useState<string>("Position actuelle");
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const { isScrolled, isScrollingDown, scrollProgress } = useScrollAnimation();

  // Obtenir la position et le nom de la ville
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        setIsLoadingLocation(true);
        
        // Demander la géolocalisation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              // Utiliser une API de géocodage inverse pour obtenir le nom de la ville
              try {
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`
                );
                const data = await response.json();
                
                if (data.city) {
                  setLocation(data.city);
                } else if (data.locality) {
                  setLocation(data.locality);
                } else if (data.principalSubdivision) {
                  setLocation(data.principalSubdivision);
                } else {
                  setLocation("Belgique");
                }
              } catch (geocodeError) {

                setLocation("Position actuelle");
              }
              
              setIsLoadingLocation(false);
            },
            (error) => {

              setLocation("Bruxelles"); // Fallback par défaut
              setIsLoadingLocation(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000 // Cache pendant 5 minutes
            }
          );
        } else {
          setLocation("Bruxelles");
          setIsLoadingLocation(false);
        }
      } catch (error) {

        setLocation("Bruxelles");
        setIsLoadingLocation(false);
      }
    };

    getCurrentLocation();
  }, []);

  // Calculer la taille dynamique basée sur le progress du scroll
  const dynamicScale = 1 - (scrollProgress * 0.3);
  const dynamicPadding = 16 - (scrollProgress * 8);

  return (
    <header 
      className={`bg-gradient-to-r from-pryce-blue to-blue-600 text-white sticky top-0 z-10 shadow-lg transition-all duration-300 ease-out ${
        isScrolled ? "backdrop-blur-md bg-opacity-95" : ""
      }`}
      style={{
        padding: `${dynamicPadding}px`,
        transform: isScrollingDown && isScrolled ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="transition-all duration-300 ease-out"
            style={{
              transform: `scale(${dynamicScale})`,
              opacity: 0.9 + (scrollProgress * 0.1)
            }}
          >
            {icon}
          </div>
          <div>
            <h1 
              className="font-bold transition-all duration-300 ease-out"
              style={{
                fontSize: `${1.5 - (scrollProgress * 0.3)}rem`,
                lineHeight: 1.2
              }}
            >
              {title}
            </h1>
            <div className="flex items-center space-x-1 text-blue-100 text-xs">
              <MapPin className="h-3 w-3" />
              <span>
                {isLoadingLocation ? "Localisation..." : location}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {showNotifications && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Notifications implementation placeholder
              }}
              className="text-white hover:bg-white/20 p-2"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
          )}
          {customAction}
        </div>
      </div>
    </header>
  );
}