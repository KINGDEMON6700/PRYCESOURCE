import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Award, MapPin, Calendar } from "lucide-react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PriceTrend } from "@/components/PriceTrend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface PriceInsight {
  id: number;
  productName: string;
  currentPrice: number;
  previousPrice: number;
  store: string;
  trend: "up" | "down" | "stable";
  percentage: number;
  recommendation: string;
}

interface WeeklyStats {
  totalSavings: number;
  bestDeal: string;
  priceDrops: number;
  avgDiscount: number;
}

export default function Insights() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch insights data
  const { data: insights = [], isLoading: insightsLoading } = useQuery<PriceInsight[]>({
    queryKey: ["/api/insights/price-trends"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });

  // Sample insights for demonstration
  const sampleInsights: PriceInsight[] = [
    {
      id: 1,
      productName: "Pain de mie complet",
      currentPrice: 2.65,
      previousPrice: 2.89,
      store: "Aldi Schaerbeek",
      trend: "down",
      percentage: 8.3,
      recommendation: "Excellent moment pour acheter ! Le prix a baissé de 24 centimes cette semaine."
    },
    {
      id: 2,
      productName: "Lait demi-écrémé",
      currentPrice: 1.25,
      previousPrice: 1.15,
      store: "Delhaize Bruxelles",
      trend: "up",
      percentage: 8.7,
      recommendation: "Prix en hausse. Considérez Lidl où le prix reste stable à €1.18."
    },
    {
      id: 3,
      productName: "Yaourt nature",
      currentPrice: 2.99,
      previousPrice: 3.25,
      store: "Carrefour Woluwe",
      trend: "down",
      percentage: 8.0,
      recommendation: "Bonne affaire ! -26 centimes par rapport au mois dernier."
    },
    {
      id: 4,
      productName: "Bananes bio",
      currentPrice: 2.49,
      previousPrice: 2.49,
      store: "Bio Planet",
      trend: "stable",
      percentage: 0,
      recommendation: "Prix stable depuis 3 semaines. Qualité constante."
    },
  ];

  const sampleStats: WeeklyStats = {
    totalSavings: 12.45,
    bestDeal: "Pain de mie chez Aldi (-24¢)",
    priceDrops: 3,
    avgDiscount: 15.2
  };

  const displayInsights = insights.length > 0 ? insights : sampleInsights;
  const weeklyStats = sampleStats;

  return (
    <div className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto bg-white dark:bg-gray-900 min-h-screen relative px-2 sm:px-4">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Insights</h1>
          </div>
          

        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 bg-gray-50 dark:bg-gray-800 min-h-screen">
        {/* Weekly Summary */}
        <section className="p-4">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>Résumé de la semaine</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">
                    €{weeklyStats.totalSavings.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    Économies potentielles
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-600">
                    {weeklyStats.priceDrops}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    Baisses de prix détectées
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Meilleure affaire
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {weeklyStats.bestDeal}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Price Trends */}
        <section className="px-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tendances prix
            </h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
              7 derniers jours
            </Badge>
          </div>
          
          <div className="space-y-3">
            {insightsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              displayInsights.map((insight) => (
                <PriceTrend
                  key={insight.id}
                  productName={insight.productName}
                  currentPrice={insight.currentPrice}
                  previousPrice={insight.previousPrice}
                  store={insight.store}
                  trend={insight.trend}
                  percentage={insight.percentage}
                  recommendation={insight.recommendation}
                />
              ))
            )}
          </div>
        </section>

        {/* Market Analysis */}
        <section className="px-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Analyse du marché
          </h2>
          
          <div className="space-y-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      Tendance générale : Baisse
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Les prix des produits laitiers ont baissé de 5.2% cette semaine dans la région de Bruxelles.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      Magasins recommandés
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Aldi et Lidl offrent les meilleurs prix cette semaine sur vos produits favoris.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}