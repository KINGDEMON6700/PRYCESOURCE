import { Button } from "@/components/ui/button";
import { Plus, User } from "lucide-react";
import { useLocation } from "wouter";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface PageHeaderProps {
  title: string;
  icon: React.ReactNode;
  showProfileButton?: boolean;
  customAction?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  icon, 
  showProfileButton = false,
  customAction 
}: PageHeaderProps) {
  const [, navigate] = useLocation();
  const { isScrolled, isScrollingDown, scrollProgress } = useScrollAnimation();

  // Calculer la taille dynamique basée sur le progress du scroll
  const dynamicScale = 1 - (scrollProgress * 0.3); // Réduction de 30% max
  const dynamicPadding = 16 - (scrollProgress * 8); // Padding de 16px à 8px
  const dynamicIconSize = 24 - (scrollProgress * 4); // Icône de 24px à 20px

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
          <h1 
            className="font-bold transition-all duration-300 ease-out"
            style={{
              fontSize: `${1.25 - (scrollProgress * 0.25)}rem`, // De 1.25rem à 1rem
              transform: `scale(${dynamicScale})`,
              transformOrigin: 'left center'
            }}
          >
            {title}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {showProfileButton && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 transition-all duration-300"
              onClick={() => navigate('/profile')}
              style={{
                transform: `scale(${dynamicScale})`,
                opacity: 0.9 + (scrollProgress * 0.1)
              }}
            >
              <User className="h-4 w-4" />
            </Button>
          )}
          
          <div 
            className="transition-all duration-300"
            style={{
              transform: `scale(${dynamicScale})`,
              opacity: 0.9 + (scrollProgress * 0.1)
            }}
          >
            {customAction}
          </div>
        </div>
      </div>
    </header>
  );
}