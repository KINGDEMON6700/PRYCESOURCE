import { memo, useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { StoreCard } from "./StoreCard";
import { useDebounce } from "@/hooks/usePerformanceOptimization";
import type { StoreWithRating } from "@shared/schema";

interface VirtualizedStoreListProps {
  stores: StoreWithRating[];
  onStoreClick: (store: StoreWithRating) => void;
  itemHeight?: number;
}

const MemoizedStoreCard = memo(StoreCard);

const StoreRow = memo(({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: React.CSSProperties; 
  data: {
    stores: StoreWithRating[];
    onStoreClick: (store: StoreWithRating) => void;
  };
}) => {
  const { stores, onStoreClick } = data;
  const store = stores[index];

  if (!store) return null;

  return (
    <div style={style} className="p-2">
      <MemoizedStoreCard
        store={store}
        onClick={() => onStoreClick(store)}
      />
    </div>
  );
});

StoreRow.displayName = "StoreRow";

export const VirtualizedStoreList = memo(({
  stores,
  onStoreClick,
  itemHeight = 140
}: VirtualizedStoreListProps) => {
  const debouncedOnStoreClick = useDebounce(onStoreClick, 100);
  
  const itemData = useMemo(() => ({
    stores,
    onStoreClick: debouncedOnStoreClick
  }), [stores, debouncedOnStoreClick]);

  if (stores.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Aucun magasin trouvé</p>
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
            itemCount={stores.length}
            itemSize={itemHeight}
            itemData={itemData}
            overscanCount={3}
          >
            {StoreRow}
          </List>
        )}
      </AutoSizer>
    </div>
  );
});

VirtualizedStoreList.displayName = "VirtualizedStoreList";