import { MapPin, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PriceComparison } from "@shared/schema";
import { safeDistance, safePrice } from "@/lib/safeNumber";

interface PriceComparisonProps {
  comparison: PriceComparison;
}

const storeBrandColors = {
  delhaize: "bg-red-500",
  aldi: "bg-blue-600",
  lidl: "bg-yellow-500",
  carrefour: "bg-blue-500",
};

export function PriceComparison({ comparison }: PriceComparisonProps) {
  const sortedPrices = [...comparison.prices].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedPrices[0]?.price || 0;
  const highestPrice = sortedPrices[sortedPrices.length - 1]?.price || 0;
  const maxSavings = highestPrice - lowestPrice;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <span className="text-2xl">🛒</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {comparison.product.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {comparison.product.brand} {comparison.product.unit && `- ${comparison.product.unit}`}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {sortedPrices.map((priceData, index) => {
            const isLowest = index === 0;
            const brandColor = storeBrandColors[priceData.store.brand as keyof typeof storeBrandColors] || "bg-gray-500";
            
            return (
              <div
                key={`${priceData.store.id}-${comparison.product.id}`}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isLowest 
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
                    : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${brandColor} rounded-lg flex items-center justify-center text-white font-bold text-xs`}>
                    {priceData.store.brand.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {priceData.store.name}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="h-3 w-3 mr-1" />
                      {priceData.distance ? `${safeDistance(priceData.distance)} km` : priceData.store.city}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-semibold ${isLowest ? "text-green-600" : "text-gray-900 dark:text-white"}`}>
                    €{safePrice(priceData.price)}
                  </div>
                  {priceData.isPromotion && (
                    <Badge variant="secondary" className="text-xs">
                      Promotion
                    </Badge>
                  )}
                  <div className="flex items-center space-x-1 mt-1">
                    {priceData.isAvailable ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {priceData.isAvailable ? "En stock" : "Rupture"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {maxSavings > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Économie maximale
              </span>
              <span className="font-medium text-green-600">
                €{safePrice(maxSavings)} chez {sortedPrices[0]?.store.name}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
