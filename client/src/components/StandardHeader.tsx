import { ArrowLeft, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";

interface StandardHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function StandardHeader({
  title = "Pryce",
  showBackButton = false,
  onBack
}: StandardHeaderProps) {
  const [, navigate] = useLocation();
  const { isScrolled, scrollProgress } = useScrollAnimation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out"
      style={{
        background: `linear-gradient(135deg, rgba(59, 130, 246, ${0.95 + (scrollProgress * 0.05)}) 0%, rgba(147, 51, 234, ${0.9 + (scrollProgress * 0.1)}) 100%)`,
        backdropFilter: `blur(${8 + (scrollProgress * 4)}px)`,
        borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.1)' : 'none',
        height: `${80 - (scrollProgress * 16)}px`
      }}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between max-w-6xl">
        <div className="flex items-center space-x-2">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-white/20 transition-all duration-300 mr-2"
              style={{
                transform: `scale(${1 - (scrollProgress * 0.1)})`,
                opacity: 0.9 + (scrollProgress * 0.1)
              }}
            >
              <ArrowLeft 
                className="transition-all duration-300"
                style={{
                  width: `${16 - (scrollProgress * 2)}px`,
                  height: `${16 - (scrollProgress * 2)}px`,
                }}
              />
            </Button>
          )}
          <h1 
            className="font-bold text-blue-200 transition-all duration-300 ease-out text-[16px]"
            style={{
              fontSize: `${1.5 - (scrollProgress * 0.3)}rem`,
              transform: `scale(${1 - (scrollProgress * 0.15)})`,
              transformOrigin: 'left center',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            {title}
          </h1>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
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
  );
}