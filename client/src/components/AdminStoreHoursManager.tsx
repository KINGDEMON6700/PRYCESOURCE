import { useState } from "react";
import { Clock, Edit, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getStoreStatus, getStatusClasses } from "@/lib/storeUtils";
import type { Store } from "@shared/schema";

interface AdminStoreHoursManagerProps {
  store: Store;
  onUpdate?: () => void;
}

const daysOfWeek = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

export function AdminStoreHoursManager({ store, onUpdate }: AdminStoreHoursManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hours, setHours] = useState(store.openingHours || {});

  const updateStoreMutation = useMutation({
    mutationFn: async (data: { openingHours: Record<string, string> }) => {
      return apiRequest("PATCH", `/api/admin/stores/${store.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      setIsEditing(false);
      onUpdate?.();
      toast({
        title: "Horaires mis à jour",
        description: "Les horaires d'ouverture ont été modifiés avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les horaires.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateStoreMutation.mutate({ openingHours: hours });
  };

  const handleCancel = () => {
    setHours(store.openingHours || {});
    setIsEditing(false);
  };

  const handleHourChange = (day: string, value: string) => {
    setHours(prev => ({ ...prev, [day]: value }));
  };

  const status = getStoreStatus(store);
  const statusClasses = getStatusClasses(status);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horaires d'ouverture
          </div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${statusClasses}`}>
            {status}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isEditing ? (
          <div className="space-y-2">
            {Object.entries(daysOfWeek).map(([day, label]) => (
              <div key={day} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 w-20">{label}:</span>
                <span className="text-white font-mono">
                  {hours[day] || store.openingHours?.[day] || "Non défini"}
                </span>
              </div>
            ))}
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="w-full"
              >
                <Edit className="h-3 w-3 mr-1" />
                Modifier les horaires
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              {Object.entries(daysOfWeek).map(([day, label]) => (
                <div key={day} className="space-y-1">
                  <Label htmlFor={`hours-${day}`} className="text-white text-xs">
                    {label}
                  </Label>
                  <Input
                    id={`hours-${day}`}
                    value={hours[day] || ""}
                    onChange={(e) => handleHourChange(day, e.target.value)}
                    placeholder="08:00-20:00 ou Fermé"
                    className="bg-gray-700 border-gray-600 text-white text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 p-2 bg-gray-900 rounded">
              Format: HH:MM-HH:MM (ex: 08:00-20:00) ou "Fermé" pour les jours de fermeture
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateStoreMutation.isPending}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                <Check className="h-3 w-3 mr-1" />
                {updateStoreMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={updateStoreMutation.isPending}
                className="flex-1"
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