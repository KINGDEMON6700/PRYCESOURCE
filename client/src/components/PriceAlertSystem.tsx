import { useState } from "react";
import { Bell, Plus, Trash2, Eye, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface PriceAlert {
  id: string;
  productName: string;
  storeName?: string;
  targetPrice: number;
  currentPrice: number;
  notificationMethod: "email" | "push" | "both";
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

interface CreatePriceAlertProps {
  productId?: number;
  productName?: string;
  storeId?: number;
  storeName?: string;
  currentPrice?: number;
}

/**
 * Système d'alertes de prix pour notifier les utilisateurs
 * des baisses de prix sur leurs produits favoris
 */
export function PriceAlertSystem() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  // Exemple d'alertes pour démonstration
  const exampleAlerts: PriceAlert[] = [
    {
      id: "1",
      productName: "Lait Bio 1L",
      storeName: "Delhaize Bruxelles",
      targetPrice: 1.50,
      currentPrice: 1.79,
      notificationMethod: "email",
      isActive: true,
      createdAt: new Date(2025, 0, 1),
    },
    {
      id: "2",
      productName: "Pain complet",
      targetPrice: 2.00,
      currentPrice: 2.45,
      notificationMethod: "both",
      isActive: true,
      createdAt: new Date(2025, 0, 5),
      lastTriggered: new Date(2025, 0, 10),
    }
  ];

  const handleCreateAlert = async (alertData: CreatePriceAlertProps & { 
    targetPrice: number; 
    notificationMethod: "email" | "push" | "both" 
  }) => {
    try {
      // API call to create price alert
      // await apiRequest("POST", "/api/price-alerts", alertData);
      
      toast({
        title: "Alerte créée",
        description: "Vous serez notifié quand le prix baissera.",
      });
      
      setShowCreateDialog(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'alerte de prix.",
        variant: "destructive"
      });
    }
  };

  const handleToggleAlert = async (alertId: string) => {
    try {
      // API call to toggle price alert
      toast({
        title: "Alerte mise à jour",
        description: "Le statut de l'alerte a été modifié.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'alerte.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      // API call to delete price alert
      toast({
        title: "Alerte supprimée",
        description: "L'alerte de prix a été supprimée.",
      });
    } catch (error) {
      toast({
        title: "Erreur", 
        description: "Impossible de supprimer l'alerte.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton de création */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Alertes de prix
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Soyez notifié des baisses de prix sur vos produits favoris
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle alerte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <CreatePriceAlertDialog 
              onSubmit={handleCreateAlert}
              onClose={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des alertes */}
      <div className="space-y-4">
        {exampleAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune alerte active
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Créez votre première alerte pour être notifié des baisses de prix
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                Créer une alerte
              </Button>
            </CardContent>
          </Card>
        ) : (
          exampleAlerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {alert.productName}
                      </h3>
                      <Badge 
                        variant={alert.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {alert.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {alert.notificationMethod}
                      </Badge>
                    </div>
                    
                    {alert.storeName && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {alert.storeName}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Prix cible: </span>
                        <span className="font-semibold text-green-600">
                          €{Number(alert.targetPrice || 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Prix actuel: </span>
                        <span className="font-semibold">
                          €{Number(alert.currentPrice || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    {alert.lastTriggered && (
                      <p className="text-xs text-gray-500 mt-2">
                        Dernière notification: {alert.lastTriggered.toLocaleDateString('fr-BE')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={alert.isActive}
                      onCheckedChange={() => handleToggleAlert(alert.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function CreatePriceAlertDialog({ 
  onSubmit, 
  onClose,
  initialData 
}: {
  onSubmit: (data: any) => void;
  onClose: () => void;
  initialData?: CreatePriceAlertProps;
}) {
  const [targetPrice, setTargetPrice] = useState("");
  const [notificationMethod, setNotificationMethod] = useState<"email" | "push" | "both">("email");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice) return;

    onSubmit({
      ...initialData,
      targetPrice: parseFloat(targetPrice),
      notificationMethod
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Créer une alerte de prix</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="targetPrice">Prix cible (€)</Label>
          <Input
            id="targetPrice"
            type="number"
            step="0.01"
            placeholder="ex: 2.50"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="notification">Méthode de notification</Label>
          <Select value={notificationMethod} onValueChange={setNotificationMethod as any}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email seulement</SelectItem>
              <SelectItem value="push">Notification push</SelectItem>
              <SelectItem value="both">Email + Push</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button type="submit" className="flex-1">
          Créer l'alerte
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </form>
  );
}