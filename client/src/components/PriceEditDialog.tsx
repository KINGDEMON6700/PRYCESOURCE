import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Edit, AlertCircle } from "lucide-react";

interface PriceEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    brand?: string;
    category?: string;
    image?: string;
  };
  store: {
    id: number;
    name: string;
    brand: string;
  };
  currentPrice?: number;
  isPromotion?: boolean;
}

export function PriceEditDialog({ 
  isOpen, 
  onClose, 
  product, 
  store, 
  currentPrice,
  isPromotion = false 
}: PriceEditDialogProps) {
  const [newPrice, setNewPrice] = useState(currentPrice?.toString() || "");
  const [isPromotionUpdate, setIsPromotionUpdate] = useState(isPromotion);
  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const editPriceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/contributions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stores/${store.id}/products`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}/stores`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${product.id}/comparison`] });
      setNewPrice("");
      setComment("");
      setReason("");
      setIsPromotionUpdate(false);
      onClose();
      toast({
        title: "Modification proposée",
        description: "Votre modification de prix a été envoyée aux administrateurs pour vérification.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la modification.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!newPrice || !reason) {
      toast({
        title: "Champs requis",
        description: "Veuillez renseigner le nouveau prix et la raison de la modification.",
        variant: "destructive",
      });
      return;
    }

    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue) || priceValue < 0) {
      toast({
        title: "Prix invalide",
        description: "Veuillez saisir un prix valide.",
        variant: "destructive",
      });
      return;
    }

    const contributionData = {
      type: "price_update",
      storeId: store.id,
      productId: product.id,
      reportedPrice: priceValue,
      data: {
        oldPrice: currentPrice,
        newPrice: priceValue,
        isPromotion: isPromotionUpdate,
        reason: reason,
        comment: comment || null,
      },
      comment: `Modification prix: ${currentPrice || 'N/A'}€ → ${priceValue}€. Raison: ${reason}${comment ? `. Commentaire: ${comment}` : ''}`,
      priority: "normal",
    };

    editPriceMutation.mutate(contributionData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifier le prix
          </DialogTitle>
          <DialogDescription>
            Proposer une correction de prix pour ce produit dans ce magasin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info produit */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center gap-3">
              {product.image && (
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = `https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=200&h=200&fit=crop&crop=center`;
                  }}
                />
              )}
              <div>
                <h4 className="font-medium">{product.name}</h4>
                {product.brand && (
                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline">{store.name}</Badge>
              {currentPrice && (
                <span className="text-sm text-muted-foreground">
                  Prix actuel: {currentPrice}€
                  {isPromotion && <Badge variant="destructive" className="ml-1 text-xs">PROMO</Badge>}
                </span>
              )}
            </div>
          </div>

          {/* Nouveau prix */}
          <div className="space-y-2">
            <Label htmlFor="newPrice">Nouveau prix (€) *</Label>
            <Input
              id="newPrice"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />
          </div>

          {/* Promotion */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="promotion"
              checked={isPromotionUpdate}
              onCheckedChange={(checked) => setIsPromotionUpdate(!!checked)}
            />
            <Label htmlFor="promotion" className="text-sm">
              Ce prix est en promotion
            </Label>
          </div>

          {/* Raison de la modification */}
          <div className="space-y-2">
            <Label htmlFor="reason">Raison de la modification *</Label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="">Sélectionner une raison</option>
              <option value="prix_obsolete">Prix obsolète/ancien</option>
              <option value="erreur_saisie">Erreur de saisie</option>
              <option value="promotion_finie">Promotion terminée</option>
              <option value="nouvelle_promotion">Nouvelle promotion</option>
              <option value="changement_prix">Changement de prix du magasin</option>
              <option value="autre">Autre raison</option>
            </select>
          </div>

          {/* Commentaire optionnel */}
          <div className="space-y-2">
            <Label htmlFor="comment">Commentaire (optionnel)</Label>
            <Textarea
              id="comment"
              placeholder="Détails supplémentaires sur cette modification..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          {/* Avertissement */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium">Vérification requise</p>
                <p>Votre modification sera vérifiée par notre équipe avant publication.</p>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex space-x-2">
            <Button
              onClick={handleSubmit}
              disabled={editPriceMutation.isPending || !newPrice || !reason}
              className="flex-1"
            >
              {editPriceMutation.isPending ? "Envoi..." : "Proposer la modification"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={editPriceMutation.isPending}
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}