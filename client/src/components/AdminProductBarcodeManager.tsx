import { useState } from "react";
import { QrCode, Search, Plus, Edit, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarcodeScanner } from "./BarcodeScanner";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

interface AdminProductBarcodeManagerProps {
  product: Product;
  onUpdate?: () => void;
}

export function AdminProductBarcodeManager({ product, onUpdate }: AdminProductBarcodeManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState(product.barcode || "");

  const updateProductMutation = useMutation({
    mutationFn: async (data: { barcode: string }) => {
      return apiRequest("PATCH", `/api/admin/products/${product.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsEditing(false);
      onUpdate?.();
      toast({
        title: "Code-barres mis à jour",
        description: "Le code-barres du produit a été modifié avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le code-barres.",
        variant: "destructive",
      });
    },
  });

  const handleBarcodeDetected = (barcode: string) => {
    setBarcodeValue(barcode);
    setIsScannerOpen(false);
    toast({
      title: "Code-barres détecté",
      description: `Code-barres: ${barcode}`,
    });
  };

  const handleSave = () => {
    updateProductMutation.mutate({ barcode: barcodeValue });
  };

  const handleCancel = () => {
    setBarcodeValue(product.barcode || "");
    setIsEditing(false);
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          Code-barres
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isEditing ? (
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {product.barcode ? (
                <div className="text-white font-mono text-sm bg-gray-700 rounded p-2">
                  {product.barcode}
                </div>
              ) : (
                <div className="text-gray-500 text-sm italic">Aucun code-barres</div>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="ml-2"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="barcode-input" className="text-white text-xs">
                Code-barres
              </Label>
              <div className="flex gap-2">
                <Input
                  id="barcode-input"
                  value={barcodeValue}
                  onChange={(e) => setBarcodeValue(e.target.value)}
                  placeholder="Ex: 1234567890123"
                  className="bg-gray-700 border-gray-600 text-white text-sm"
                />
                <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                    >
                      <QrCode className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent 
                    className="max-w-md bg-gray-800 border-gray-700"
                    aria-describedby="scanner-description"
                  >
                    <DialogHeader>
                      <DialogTitle className="text-white">Scanner le code-barres</DialogTitle>
                    </DialogHeader>
                    <div id="scanner-description" className="sr-only">
                      Utilisez la caméra pour scanner le code-barres du produit.
                    </div>
                    <BarcodeScanner
                      isOpen={isScannerOpen}
                      onClose={() => setIsScannerOpen(false)}
                      onBarcodeDetected={handleBarcodeDetected}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateProductMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-3 w-3 mr-1" />
                {updateProductMutation.isPending ? "..." : "Sauver"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={updateProductMutation.isPending}
              >
                <X className="h-3 w-3 mr-1" />
                Annuler
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}