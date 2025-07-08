import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PriceTrendProps {
  productName: string;
  currentPrice: number;
  previousPrice: number;
  store: string;
  trend: "up" | "down" | "stable";
  percentage: number;
  recommendation?: string;
}

export function PriceTrend({
  productName,
  currentPrice,
  previousPrice,
  store,
  trend,
  percentage,
  recommendation
}: PriceTrendProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "down":
        return "text-green-600 bg-green-50 dark:bg-green-900/20";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-900/20";
    }
  };

  const getTrendText = () => {
    switch (trend) {
      case "up":
        return `+${Number(percentage || 0).toFixed(1)}%`;
      case "down":
        return `-${Number(percentage || 0).toFixed(1)}%`;
      default:
        return "Stable";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                {productName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chez {store}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {getTrendIcon()}
              <Badge variant="secondary" className={getTrendColor()}>
                {getTrendText()}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Prix actuel</span>
              <div className="font-semibold text-lg">€{Number(currentPrice || 0).toFixed(2)}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Prix précédent</span>
              <div className="font-semibold text-lg text-gray-600 dark:text-gray-300">
                €{Number(previousPrice || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {recommendation && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">💡</span>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {recommendation}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}