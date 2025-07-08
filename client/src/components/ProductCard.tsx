import { ShoppingCart, Star, Plus, Flag, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StoreCatalogList } from "@/components/StoreCatalogList";
import { getCategoryInfo } from "@/lib/categories";
import { useLocation } from "wouter";
import type { ProductWithPrice } from "@shared/schema";

interface ProductCardProps {
  product: ProductWithPrice;
  onClick?: () => void;
  showPriceContribution?: boolean;
}

export function ProductCard({ product, onClick, showPriceContribution = false }: ProductCardProps) {
  const [, setLocation] = useLocation();

  const handleContributeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const productData = encodeURIComponent(JSON.stringify({
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      category: product.category,
      unit: product.unit,
      barcode: product.barcode,
      type: 'price_update'
    }));
    setLocation(`/report?data=${productData}`);
  };

  const handlePriceIssue = (e: React.MouseEvent) => {
    e.stopPropagation();
    const productData = encodeURIComponent(JSON.stringify({
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      category: product.category,
      currentPrice: product.lowestPrice,
      type: 'price_issue'
    }));
    setLocation(`/report?data=${productData}`);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-2 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/20 border-gray-200 dark:border-gray-700 relative group"
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-5">
        <div className="w-full h-24 sm:h-28 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl mb-3 sm:mb-4 flex items-center justify-center overflow-hidden shadow-inner">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLDivElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`w-full h-full flex items-center justify-center ${product.imageUrl ? 'hidden' : 'flex'}`}>
            <ShoppingCart className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white flex-1 line-clamp-2 leading-tight">
              {product.name}
            </h3>
            {product.category && (
              <Badge 
                variant="secondary" 
                className={`text-xs ${getCategoryInfo(product.category).color} flex-shrink-0`}
              >
                {getCategoryInfo(product.category).label}
              </Badge>
            )}
          </div>
          {product.brand && (
            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium truncate">
              {product.brand}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="text-blue-600 dark:text-blue-400 font-bold text-base sm:text-lg">
            {product.lowestPrice > 0 ? `€${Number(product.lowestPrice).toFixed(2)}` : "Prix non renseigné"}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
              product.storeCount > 3 ? "bg-green-500" : 
              product.storeCount > 1 ? "bg-yellow-500" : "bg-red-500"
            }`}></div>
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
              {product.storeCount} magasin{product.storeCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        
        {product.averageRating > 0 && (
          <div className="flex items-center space-x-1 mt-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-2 w-2 sm:h-3 sm:w-3 ${
                    i < Math.floor(product.averageRating) ? "fill-current" : ""
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {Number(product.averageRating || 0).toFixed(1)}
            </span>
          </div>
        )}
        
        {/* Bouton Catalogue des magasins - visible uniquement sur la page d'accueil */}
        {showPriceContribution && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div onClick={(e) => e.stopPropagation()}>
              <StoreCatalogList product={product} />
            </div>
          </div>
        )}

        {/* Boutons de contribution rapide - visibles au hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleContributeClick}
            className="h-7 w-7 p-0 bg-orange-600/90 border-orange-500 hover:bg-orange-700 text-white"
            title="Signaler un prix"
          >
            <Flag className="h-3 w-3" />
          </Button>
          {product.lowestPrice > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handlePriceIssue}
              className="h-7 w-7 p-0 bg-yellow-600/90 border-yellow-500 hover:bg-yellow-700 text-white"
              title="Prix incorrect?"
            >
              <AlertCircle className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
