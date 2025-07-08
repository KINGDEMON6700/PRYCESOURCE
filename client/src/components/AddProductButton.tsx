import { useState } from "react";
import { Plus, Package, X, CheckCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductForm } from "@/components/forms/ProductForm";
import { ProductSearch } from "@/components/ProductSearch";
import { ProductSearchService, ProductSearchResult } from "@/services/productSearch";
import { InsertProduct } from "@/../../shared/schema";
import { useToast } from "@/hooks/use-toast";

interface AddProductButtonProps {
  onProductAdd: (product: InsertProduct) => void;
}

/**
 * Bouton pour ajouter un produit via recherche API ou saisie manuelle
 */
export function AddProductButton({ onProductAdd }: AddProductButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const { toast } = useToast();

  const handleSubmit = (productData: InsertProduct) => {
    onProductAdd(productData);
    setIsOpen(false);
    setSelectedProduct(null);
  };

  // Gérer la sélection d'un produit depuis la recherche
  const handleProductSelection = (product: ProductSearchResult) => {
    setSelectedProduct(product);
    toast({
      title: "Produit sélectionné",
      description: `${product.name} - Informations pré-remplies automatiquement`,
    });
  };

  // Pré-remplir le formulaire avec les données du produit sélectionné
  const getPrefilledProduct = (): InsertProduct | undefined => {
    if (!selectedProduct) return undefined;
    
    return ProductSearchService.convertToInsertProduct(selectedProduct);
  };

  // Réinitialiser la sélection
  const handleResetSelection = () => {
    setSelectedProduct(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Produit
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ajouter un nouveau produit
          </DialogTitle>
        </DialogHeader>
        
        <div className="w-full space-y-4">
          {/* Section de recherche */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Recherchez un produit existant ou créez-en un nouveau
              </p>
              {selectedProduct && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetSelection}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4 mr-1" />
                  Nouveau produit
                </Button>
              )}
            </div>
            
            <ProductSearch 
              onProductSelect={handleProductSelection}
              placeholder="Rechercher un produit (ex: Nutella, Coca-Cola, Pain de mie...)"
            />
            
            {selectedProduct && (
              <div className="border border-green-600 rounded-lg p-4 bg-green-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <h4 className="text-green-400 font-medium">Produit trouvé et sélectionné</h4>
                </div>
                <div className="flex items-start space-x-3">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-600 rounded-md flex items-center justify-center flex-shrink-0">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h5 className="text-white font-medium">{selectedProduct.name}</h5>
                    {selectedProduct.brand && (
                      <p className="text-sm text-gray-400">{selectedProduct.brand}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {selectedProduct.category && <span>{selectedProduct.category}</span>}
                      {selectedProduct.unit && <span>{selectedProduct.unit}</span>}
                      {selectedProduct.barcode && <span>Code: {selectedProduct.barcode}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Formulaire unifié */}
          <div className="space-y-4">
            <div className="border-t border-gray-600 pt-4">
              <p className="text-sm text-gray-400 mb-4">
                {selectedProduct 
                  ? "Vérifiez et modifiez les informations si nécessaire :" 
                  : "Remplissez les informations du produit :"}
              </p>
              
              <ProductForm 
                onSubmit={handleSubmit}
                defaultValues={getPrefilledProduct()}
                submitLabel={selectedProduct ? "Ajouter ce produit" : "Créer le produit"}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}