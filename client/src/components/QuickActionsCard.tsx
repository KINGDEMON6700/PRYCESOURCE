import { MapPin, Flag, ShoppingBag, QrCode, ShoppingCart, Search, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarcodeSearchDialog } from "@/components/BarcodeSearchDialog";
import { useLocation } from "wouter";

export function QuickActionsCard() {
  const [, navigate] = useLocation();

  const quickActions = [
    {
      icon: Search,
      label: "Rechercher",
      description: "Produits & magasins",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      action: () => navigate("/search")
    },
    {
      icon: QrCode,
      label: "Scanner",
      description: "Code-barres",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      isSpecial: true
    },
    {
      icon: ShoppingCart,
      label: "Mes listes",
      description: "Listes de courses",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      action: () => navigate("/shopping-list")
    },
    {
      icon: MapPin,
      label: "Carte",
      description: "Magasins proches",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      action: () => navigate("/map")
    },
    {
      icon: Flag,
      label: "Contribuer",
      description: "Signaler prix",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      action: () => navigate("/report")
    },
    {
      icon: ShoppingBag,
      label: "Alertes",
      description: "Prix favoris",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      action: () => navigate("/alerts")
    },
    {
      icon: BarChart3,
      label: "Analyses",
      description: "Tendances prix",
      color: "text-pink-400",
      bgColor: "bg-pink-500/10",
      action: () => navigate("/insights")
    },
    {
      icon: TrendingUp,
      label: "Populaires",
      description: "Produits tendance",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      action: () => navigate("/products")
    }
  ];

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            action.isSpecial ? (
              <BarcodeSearchDialog
                key={index}
                trigger={
                  <Button
                    variant="ghost"
                    className={`h-auto p-3 flex flex-col items-center justify-center gap-2 ${action.bgColor} hover:bg-opacity-20 border border-gray-600/50 w-full`}
                  >
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                    <div className="text-center">
                      <div className="text-white text-sm font-medium">{action.label}</div>
                      <div className="text-gray-400 text-xs">{action.description}</div>
                    </div>
                  </Button>
                }
              />
            ) : (
              <Button
                key={index}
                variant="ghost"
                onClick={action.action}
                className={`h-auto p-3 flex flex-col items-center justify-center gap-2 ${action.bgColor} hover:bg-opacity-20 border border-gray-600/50 transition-all hover:scale-105`}
              >
                <action.icon className={`h-6 w-6 ${action.color}`} />
                <div className="text-center">
                  <div className="text-white text-sm font-medium">{action.label}</div>
                  <div className="text-gray-400 text-xs">{action.description}</div>
                </div>
              </Button>
            )
          ))}
        </div>
        
        {/* Quick stats */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-blue-400 font-semibold text-lg">200+</div>
              <div className="text-gray-500 text-xs">Produits</div>
            </div>
            <div>
              <div className="text-green-400 font-semibold text-lg">50+</div>
              <div className="text-gray-500 text-xs">Magasins</div>
            </div>
            <div>
              <div className="text-yellow-400 font-semibold text-lg">1000+</div>
              <div className="text-gray-500 text-xs">Prix comparés</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}