import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Package, Barcode } from "lucide-react";
import { ProductSearchService, type ProductSearchResult } from "@/services/productSearch";
import { useToast } from "@/hooks/use-toast";

interface ProductSearchProps {
  onProductSelect: (product: ProductSearchResult) => void;
  placeholder?: string;
}

/**
 * Composant de recherche de produits avec Open Food Facts API
 */
export function ProductSearch({ onProductSelect, placeholder = "Rechercher un produit..." }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [barcode, setBarcode] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<"name" | "barcode">("name");
  const { toast } = useToast();

  // Debounce pour la recherche par nom
  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const products = await ProductSearchService.searchProducts(searchQuery, 8);
      setResults(products);
    } catch (error) {
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher les produits",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Recherche par code-barres
  const searchByBarcode = useCallback(async (barcodeValue: string) => {
    if (!barcodeValue || barcodeValue.length < 8) {
      return;
    }

    setLoading(true);
    try {
      const product = await ProductSearchService.getProductByBarcode(barcodeValue);
      if (product) {
        setResults([product]);
      } else {
        setResults([]);
        toast({
          title: "Produit non trouvé",
          description: "Aucun produit trouvé avec ce code-barres",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher le produit",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Effect pour la recherche par nom avec debounce
  useEffect(() => {
    if (searchMode === "name" && query && query.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchProducts(query);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else if (searchMode === "name" && query.length < 2) {
      setResults([]);
    }
  }, [query, searchMode, searchProducts]);

  // Effect pour la recherche par code-barres
  useEffect(() => {
    if (searchMode === "barcode" && barcode) {
      searchByBarcode(barcode);
    } else if (searchMode === "barcode") {
      setResults([]);
    }
  }, [barcode, searchMode, searchByBarcode]);

  const handleProductSelect = (product: ProductSearchResult) => {
    onProductSelect(product);
    setQuery("");
    setBarcode("");
    setResults([]);
  };

  return (
    <div className="space-y-4">
      {/* Mode Switch */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={searchMode === "name" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setSearchMode("name");
            setBarcode("");
            setResults([]);
          }}
          className="flex-1"
        >
          <Package className="h-4 w-4 mr-2" />
          Par nom
        </Button>
        <Button
          type="button"
          variant={searchMode === "barcode" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setSearchMode("barcode");
            setQuery("");
            setResults([]);
          }}
          className="flex-1"
        >
          <Barcode className="h-4 w-4 mr-2" />
          Par code-barres
        </Button>
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <div className="relative">
          {searchMode === "name" ? (
            <>
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </>
          ) : (
            <>
              <Barcode className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Entrez le code-barres..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </>
          )}
          
          {loading && (
            <div className="absolute right-3 top-3">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Exemples de recherche */}
        {searchMode === "name" && !query && (
          <div className="text-xs text-gray-500 space-y-1">
            <p>Exemples de recherche :</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuery("lait")}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              >
                lait
              </button>
              <button
                type="button"
                onClick={() => setQuery("coca cola")}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              >
                coca cola
              </button>
              <button
                type="button"
                onClick={() => setQuery("nutella")}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              >
                nutella
              </button>
              <button
                type="button"
                onClick={() => setQuery("biscuits")}
                className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
              >
                biscuits
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <p className="text-sm text-gray-400">
            {results.length} produit{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
          </p>
          
          {results.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:bg-gray-700 transition-colors bg-gray-800 border-gray-700"
              onClick={() => handleProductSelect(product)}
            >
              <CardContent className="p-3">
                <div className="flex items-start space-x-3">
                  {/* Product Image */}
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-600 rounded-md flex items-center justify-center flex-shrink-0">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {product.name}
                        </h4>
                        {product.brand && (
                          <p className="text-sm text-gray-400 truncate">
                            {product.brand}
                          </p>
                        )}
                      </div>
                      
                      {/* Category Badge */}
                      {product.category && (
                        <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Additional Info */}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {product.unit && (
                        <span>{product.unit}</span>
                      )}
                      {product.barcode && (
                        <span>Code: {product.barcode}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && ((searchMode === "name" && query.length >= 2) || (searchMode === "barcode" && barcode.length >= 8)) && results.length === 0 && (
        <div className="text-center py-4 text-gray-400">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Aucun produit trouvé</p>
          <p className="text-xs mt-1">Essayez un autre terme de recherche</p>
        </div>
      )}
    </div>
  );
}