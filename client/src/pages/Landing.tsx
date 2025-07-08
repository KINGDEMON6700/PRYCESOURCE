import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Search, Users, DollarSign } from "lucide-react";
import { PryceLogo } from "@/components/PryceLogo";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-4">
            <PryceLogo size={80} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Pryce</h1>
          <p className="text-blue-100 text-lg">
            Comparateur de prix pour les magasins belges
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <MapPin className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Magasins proches</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <Search className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Recherche facile</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Prix en temps réel</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Communauté</p>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-6">
            <p className="text-white text-center">
              Découvrez les meilleurs prix dans les magasins belges près de chez vous.
              Comparez Delhaize, Aldi, Lidl, Carrefour et bien d'autres.
            </p>
          </CardContent>
        </Card>

        {/* Login Button */}
        <Button 
          className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 text-lg"
          onClick={() => window.location.href = '/api/login'}
        >
          Se connecter pour commencer
        </Button>

        <p className="text-center text-blue-100 text-sm">
          Gratuit • Sécurisé • Communautaire
        </p>
      </div>
    </div>
  );
}
