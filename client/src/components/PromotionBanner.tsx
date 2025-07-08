import { X, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface PromotionBannerProps {
  title: string;
  description: string;
  discount: number;
  store: string;
  validUntil: string;
  onClose?: () => void;
}

export function PromotionBanner({
  title,
  description,
  discount,
  store,
  validUntil,
  onClose
}: PromotionBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 mb-3 sm:mb-4">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                  {title}
                </h3>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100 text-xs">
                  -{discount}%
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1 sm:mb-2">
                {description}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>Chez {store}</span>
                <span>•</span>
                <span>Valide jusqu'au {validUntil}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}