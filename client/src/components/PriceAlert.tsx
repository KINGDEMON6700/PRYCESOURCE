import { Bell, Store, MapPin, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface StoreAlertProps {
  storeName: string;
  storeBrand: string;
  promotionCount: number;
  averageDiscount: number;
  distance?: number;
  isActive: boolean;
  alertTypes: string[];
  onToggle: () => void;
}

export function StoreAlert({
  storeName,
  storeBrand,
  promotionCount,
  averageDiscount,
  distance,
  isActive,
  alertTypes,
  onToggle
}: StoreAlertProps) {
  const storeBrandColors = {
    delhaize: "bg-red-500",
    aldi: "bg-blue-600",
    lidl: "bg-yellow-500",
    carrefour: "bg-blue-500",
  };

  const hasPromotions = promotionCount > 0;

  return (
    <Card className={`${hasPromotions ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`w-10 h-10 ${storeBrandColors[storeBrand as keyof typeof storeBrandColors] || 'bg-gray-500'} rounded-full flex items-center justify-center`}>
              <Store className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {storeName}
                </h3>
                {hasPromotions && (
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                    {promotionCount} promos
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1 text-sm">
                {averageDiscount > 0 && (
                  <div className="flex items-center space-x-2">
                    <Percent className="h-4 w-4 text-yellow-600" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Réduction moyenne: <span className="font-medium text-yellow-600">-{averageDiscount}%</span>
                    </span>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {alertTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                {distance && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{Number(distance || 0).toFixed(1)} km</span>
                  </div>
                )}
                <span>•</span>
                <span>{isActive ? "Notifications actives" : "Notifications désactivées"}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button
              variant={isActive ? "destructive" : "default"}
              size="sm"
              onClick={onToggle}
            >
              {isActive ? "Désactiver" : "Activer"}
            </Button>
            {hasPromotions && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Voir promos
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}