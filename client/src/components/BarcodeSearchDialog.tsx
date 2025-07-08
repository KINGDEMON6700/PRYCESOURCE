import { useState } from "react";
import { QrCode, Search, Package } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BarcodeScanner } from "./BarcodeScanner";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { ProductWithPrice } from "@shared/schema";

interface BarcodeSearchDialogProps {
  trigger?: React.ReactNode;
}

export function BarcodeSearchDialog({ trigger }: BarcodeSearchDialogProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [searchBarcode, setSearchBarcode] = useState("");

  // Search product by barcode
  const { data: product, isLoading, error } = useQuery<ProductWithPrice>({
    queryKey: ["/api/barcode/search", { barcode: searchBarcode }],
    enabled: !!searchBarcode,
    retry: 1,
  });

  const handleBarcodeDetected = (barcode: string) => {
    setSearchBarcode(barcode);
    setIsScannerOpen(false);
    toast({
      title: "Code-barres détecté",
      description: `Recherche du produit: ${barcode}`,
    });
  };

  const handleManualSearch = () => {
    if (manualBarcode.trim()) {
      setSearchBarcode(manualBarcode.trim());
      setManualBarcode("");
    }
  };

  const handleProductSelect = (product: ProductWithPrice) => {
    navigate(`/product/${product.id}`);
    setIsOpen(false);
    setSearchBarcode("");
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <QrCode className="h-4 w-4" />
      Scanner
    </Button>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] bg-gray-800 border-gray-700" aria-describedby="barcode-search-description">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Recherche par code-barres
            </DialogTitle>
          </DialogHeader>
          <div id="barcode-search-description" className="sr-only">
            Scannez ou saisissez un code-barres pour rechercher des produits dans la base de données.
          </div>

          <div className="space-y-4">
            {/* Scanner Button */}
            <Button
              onClick={() => setIsScannerOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Ouvrir le scanner de caméra
            </Button>

            {/* Manual Input */}
            <div className="space-y-2">
              <p className="text-gray-400 text-sm">Ou saisissez le code-barres manuellement:</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: 3017620422003"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleManualSearch()}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  onClick={handleManualSearch}
                  disabled={!manualBarcode.trim()}
                  variant="outline"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchBarcode && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Recherche pour:</span>
                  <code className="bg-gray-700 px-2 py-1 rounded text-blue-400">
                    {searchBarcode}
                  </code>
                </div>

                {isLoading && (
                  <Card className="bg-gray-700 border-gray-600">
                    <CardContent className="p-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                      <p className="text-gray-400 text-sm">Recherche en cours...</p>
                    </CardContent>
                  </Card>
                )}

                {error && (
                  <Card className="bg-red-900/20 border-red-700">
                    <CardContent className="p-4 text-center">
                      <Package className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="text-red-400 font-medium">Produit non trouvé</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Aucun produit ne correspond à ce code-barres dans notre base de données.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {product && (
                  <Card 
                    className="bg-gray-700 border-gray-600 cursor-pointer hover:bg-gray-600 transition-colors"
                    onClick={() => handleProductSelect(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{product.name}</h4>
                          {product.brand && (
                            <p className="text-gray-400 text-sm">{product.brand}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {product.lowestPrice > 0 && (
                              <span className="text-blue-400 font-semibold">
                                À partir de {product.lowestPrice.toFixed(2)}€
                              </span>
                            )}
                            {product.storeCount > 0 && (
                              <span className="text-gray-500 text-xs">
                                • {product.storeCount} magasin{product.storeCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-gray-700">
              <p className="text-gray-500 text-xs text-center">
                Scannez ou saisissez un code-barres pour trouver des produits instantanément
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onBarcodeDetected={handleBarcodeDetected}
      />
    </>
  );
}