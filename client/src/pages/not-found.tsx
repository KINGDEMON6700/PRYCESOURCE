import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { PryceLogo } from "@/components/PryceLogo";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 max-w-sm mx-auto w-full">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <PryceLogo className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold text-white">Page introuvable</h1>
          <p className="text-gray-300 text-sm">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-6xl font-bold text-blue-500 mb-2">404</div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate("/")} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Home className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
            
            <Button 
              onClick={() => window.history.back()} 
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Page précédente
            </Button>
            
            <Button 
              onClick={() => navigate("/map")} 
              variant="ghost"
              className="w-full text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Voir la carte des magasins
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 mt-6">
            Besoin d'aide ? Utilisez la navigation en bas de page.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
