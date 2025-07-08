import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Camera, AlertTriangle, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

const contributionSchema = z.object({
  productName: z.string().min(1, "Nom du produit requis"),
  storeName: z.string().min(1, "Nom du magasin requis"),
  storeAddress: z.string().min(1, "Adresse du magasin requise"),
  type: z.enum(["price", "availability", "both"]),
  reportedPrice: z.string().optional(),
  reportedAvailability: z.boolean().optional(),
  comment: z.string().optional(),
});

type ContributionForm = z.infer<typeof contributionSchema>;

export default function Contribute() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const form = useForm<ContributionForm>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      type: "price",
      reportedAvailability: true,
    },
  });

  // Get user's location
  useState(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {

          toast({
            title: "Localisation non disponible",
            description: "La géolocalisation est requise pour contribuer.",
            variant: "destructive",
          });
        }
      );
    }
  });

  const contributionMutation = useMutation({
    mutationFn: async (data: ContributionForm) => {
      const contributionData = {
        productName: data.productName,
        storeName: data.storeName,
        storeAddress: data.storeAddress,
        type: data.type,
        reportedPrice: data.reportedPrice ? parseFloat(data.reportedPrice) : undefined,
        reportedAvailability: data.reportedAvailability,
        comment: data.comment,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      };

      return await apiRequest("POST", "/api/contributions/simple", contributionData);
    },
    onSuccess: () => {
      toast({
        title: "Contribution envoyée",
        description: "Merci pour votre contribution ! Elle sera vérifiée par notre équipe.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contributions"] });
      form.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la contribution. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContributionForm) => {
    if (!userLocation) {
      toast({
        title: "Localisation requise",
        description: "Veuillez autoriser l'accès à votre position pour contribuer.",
        variant: "destructive",
      });
      return;
    }

    contributionMutation.mutate(data);
  };

  return (
    <div className="max-w-sm mx-auto bg-white dark:bg-gray-900 min-h-screen relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Contribuer
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 bg-white dark:bg-gray-900">
        <div className="p-4">
          {/* Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Aidez la communauté</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Signalez les prix et la disponibilité des produits pour aider les autres utilisateurs
                à trouver les meilleures offres près de chez eux.
              </p>
            </CardContent>
          </Card>

          {/* Location Status */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <MapPin className={`h-5 w-5 ${userLocation ? "text-green-500" : "text-red-500"}`} />
                <div>
                  <p className="text-sm font-medium">
                    {userLocation ? "Position détectée" : "Position non détectée"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {userLocation
                      ? "Votre position sera utilisée pour valider la contribution"
                      : "La géolocalisation est requise pour contribuer"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contribution Form */}
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle contribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de contribution</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez le type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="price">Prix uniquement</SelectItem>
                            <SelectItem value="availability">Disponibilité uniquement</SelectItem>
                            <SelectItem value="both">Prix et disponibilité</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du magasin</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Delhaize Mons, Aldi La Louvière..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom du produit</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Pain de mie complet, Lait demi-écrémé 1L..." 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse du magasin</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Rue de la Station 15, 7000 Mons" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(form.watch("type") === "price" || form.watch("type") === "both") && (
                    <FormField
                      control={form.control}
                      name="reportedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prix (€)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="2.50"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {(form.watch("type") === "availability" || form.watch("type") === "both") && (
                    <FormField
                      control={form.control}
                      name="reportedAvailability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disponibilité</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value === "true")} 
                            defaultValue={field.value ? "true" : "false"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez la disponibilité" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="true">En stock</SelectItem>
                              <SelectItem value="false">Rupture de stock</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commentaire (optionnel)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ajoutez des détails sur votre observation..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={contributionMutation.isPending || !userLocation}
                  >
                    {contributionMutation.isPending ? "Envoi en cours..." : "Envoyer la contribution"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Camera className="h-8 w-8 text-pryce-blue mx-auto mb-2" />
                <p className="text-sm font-medium">Signaler un prix</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Avec photo
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-medium">Rupture de stock</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Signalement rapide
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
