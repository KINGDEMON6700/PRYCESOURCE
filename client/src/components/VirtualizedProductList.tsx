import { memo, useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { ProductCard } from "./ProductCard";
import { useDebounce } from "@/hooks/usePerformanceOptimization";
import type { ProductWithPrice } from "@shared/schema";

interface VirtualizedProductListProps {
  products: ProductWithPrice[];
  onProductClick: (product: ProductWithPrice) => void;
  showPriceContribution?: boolean;
  itemsPerRow?: number;
  itemHeight?: number;
}

const MemoizedProductCard = memo(ProductCard);

const ProductRow = memo(({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: React.CSSProperties; 
  data: {
    products: ProductWithPrice[];
    onProductClick: (product: ProductWithPrice) => void;
    showPriceContribution: boolean;
    itemsPerRow: number;
  };
}) => {
  const { products, onProductClick, showPriceContribution, itemsPerRow } = data;
  
  const rowProducts = useMemo(() => {
    const startIndex = index * itemsPerRow;
    return products.slice(startIndex, startIndex + itemsPerRow);
  }, [products, index, itemsPerRow]);

  return (
    <div style={style} className="flex gap-4 p-2">
      {rowProducts.map((product) => (
        <div key={product.id} className="flex-1 min-w-0">
          <MemoizedProductCard
            product={product}
            onClick={() => onProductClick(product)}
            showPriceContribution={showPriceContribution}
          />
        </div>
      ))}
    </div>
  );
});

ProductRow.displayName = "ProductRow";

export const VirtualizedProductList = memo(({
  products,
  onProductClick,
  showPriceContribution = false,
  itemsPerRow = 2,
  itemHeight = 280
}: VirtualizedProductListProps) => {
  const debouncedOnProductClick = useDebounce(onProductClick, 100);
  
  const rowCount = Math.ceil(products.length / itemsPerRow);
  
  const itemData = useMemo(() => ({
    products,
    onProductClick: debouncedOnProductClick,
    showPriceContribution,
    itemsPerRow
  }), [products, debouncedOnProductClick, showPriceContribution, itemsPerRow]);

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Aucun produit trouvé</p>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full">
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            width={width}
            itemCount={rowCount}
            itemSize={itemHeight}
            itemData={itemData}
            overscanCount={2}
          >
            {ProductRow}
          </List>
        )}
      </AutoSizer>
    </div>
  );
});

VirtualizedProductList.displayName = "VirtualizedProductList";