import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { UnifiedHeader } from "@/components/UnifiedHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import MapViewGoogle from "@/components/MapViewGoogle";
import { useLocation } from "wouter";
import { useOptimizedQuery } from "@/hooks/useOptimizedQuery";
import type { StoreWithRating } from "@shared/schema";

export default function Map() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-900 text-white max-w-sm mx-auto w-full">
      <UnifiedHeader 
        title="Carte des magasins"
        showBackButton={true}
        onBack={() => navigate("/")}
        showLocation={true}
        showNotifications={true}
        showContribute={true}
        showProfile={true}
      />
      
      <div className="p-2 sm:p-4 pt-20">
        <MapViewGoogle />
      </div>

      <BottomNavigation />
    </div>
  );
}