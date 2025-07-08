import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGoogleMaps } from "@/contexts/GoogleMapsContext";
import { Eye, EyeOff, Key, CheckCircle, XCircle, AlertCircle, Copy } from "lucide-react";

export function GoogleMapsSettings() {
  const { apiKey: contextApiKey, setApiKey: setContextApiKey, isKeyValid } = useGoogleMaps();
  const [localApiKey, setLocalApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"unknown" | "valid" | "invalid" | "missing">("unknown");
  const { toast } = useToast();

  // Synchroniser avec le contexte
  useEffect(() => {
    setLocalApiKey(contextApiKey);
    if (contextApiKey) {
      setKeyStatus(isKeyValid ? "valid" : "invalid");
    } else {
      setKeyStatus("missing");
    }
  }, [contextApiKey, isKeyValid]);

  // Fonction pour vérifier la validité de la clé API
  const verifyApiKey = async (key: string) => {
    if (!key.trim()) {
      setKeyStatus("missing");
      return false;
    }

    setIsVerifying(true);
    try {
      // Validation simple du format de la clé API Google
      const isValidFormat = /^AIza[0-9A-Za-z_-]{35}$/.test(key.trim());
      
      if (isValidFormat) {
        setKeyStatus("valid");
        toast({
          title: "Format valide",
          description: "Le format de la clé API semble correct",
          variant: "default"
        });
        return true;
      } else {
        setKeyStatus("invalid");
        toast({
          title: "Format invalide",
          description: "Le format de la clé API Google Maps n'est pas correct",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {

      setKeyStatus("invalid");
      toast({
        title: "Erreur de validation",
        description: "Impossible de valider la clé API",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  // Fonction pour sauvegarder la clé API
  const saveApiKey = async () => {
    if (!localApiKey.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une clé API valide",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Validation du format avant sauvegarde
      const isValidFormat = /^AIza[0-9A-Za-z_-]{35}$/.test(localApiKey.trim());
      
      if (!isValidFormat) {
        toast({
          title: "Format invalide",
          description: "Le format de la clé API Google Maps n'est pas correct",
          variant: "destructive"
        });
        return;
      }

      // Sauvegarder via le contexte (dans localStorage)
      setContextApiKey(localApiKey);
      setKeyStatus("valid");
      
      toast({
        title: "Configuration sauvegardée",
        description: "La clé API Google Maps a été configurée avec succès",
        variant: "default"
      });

      // Informer l'utilisateur que les changements sont immédiatement disponibles
      setTimeout(() => {
        toast({
          title: "Configuration active",
          description: "La clé API est maintenant disponible pour Google Maps",
          variant: "default"
        });
      }, 1000);

    } catch (error) {

      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour copier la clé dans le presse-papiers
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copié",
        description: "Clé API copiée dans le presse-papiers",
        variant: "default"
      });
    } catch (error) {

    }
  };

  // Fonction pour masquer partiellement la clé API
  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 8) + "•".repeat(key.length - 12) + key.substring(key.length - 4);
  };



  const getStatusIcon = () => {
    switch (keyStatus) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "invalid":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "missing":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Key className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (keyStatus) {
      case "valid":
        return "Clé API valide";
      case "invalid":
        return "Clé API invalide";
      case "missing":
        return "Clé API manquante";
      default:
        return "Statut inconnu";
    }
  };

  const getStatusColor = () => {
    switch (keyStatus) {
      case "valid":
        return "bg-green-600";
      case "invalid":
        return "bg-red-600";
      case "missing":
        return "bg-yellow-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Statut actuel */}
      <Card className="bg-gray-700 border-gray-600">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="text-white font-medium">Statut de la configuration</p>
                <p className="text-gray-400 text-sm">{getStatusText()}</p>
              </div>
            </div>
            <Badge className={`${getStatusColor()} text-white`}>
              {keyStatus === "valid" ? "Configuré" : "À configurer"}
            </Badge>
          </div>

          {contextApiKey && (
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-300 font-mono text-sm">
                    {showApiKey ? contextApiKey : maskApiKey(contextApiKey)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-gray-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(contextApiKey)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration de nouvelle clé */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="google-maps-api-key" className="text-white">
            Clé API Google Maps
          </Label>
          <p className="text-gray-400 text-sm mt-1">
            Obtenez votre clé API sur{" "}
            <a 
              href="https://console.cloud.google.com/apis/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Google Cloud Console
            </a>
          </p>
        </div>

        <div className="relative">
          <Input
            id="google-maps-api-key"
            type={showApiKey ? "text" : "password"}
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="Entrez votre clé API Google Maps"
            className="bg-gray-700 border-gray-600 text-white pr-12"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => verifyApiKey(localApiKey)}
            disabled={!localApiKey.trim() || isVerifying}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {isVerifying ? "Vérification..." : "Vérifier la clé"}
          </Button>

          <Button
            onClick={saveApiKey}
            disabled={!localApiKey.trim() || isLoading || keyStatus === "invalid"}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-900/20 border-blue-600/30">
        <CardContent className="p-4">
          <h4 className="text-blue-400 font-semibold mb-3">Instructions de configuration</h4>
          <div className="space-y-2 text-blue-200 text-sm">
            <p>1. Rendez-vous sur la <strong>Google Cloud Console</strong></p>
            <p>2. Créez un nouveau projet ou sélectionnez un projet existant</p>
            <p>3. Activez l'API <strong>Maps JavaScript API</strong></p>
            <p>4. Créez une clé API dans la section <strong>Identifiants</strong></p>
            <p>5. Configurez les restrictions (optionnel mais recommandé)</p>
            <p>6. Copiez et collez la clé dans le champ ci-dessus</p>
          </div>
        </CardContent>
      </Card>

      {/* Note sur la sécurité */}
      <Card className="bg-yellow-900/20 border-yellow-600/30">
        <CardContent className="p-4">
          <h4 className="text-yellow-400 font-semibold mb-2">⚠️ Note de sécurité</h4>
          <p className="text-yellow-200 text-sm">
            Dans un environnement de production, la clé API devrait être stockée de manière sécurisée 
            côté serveur. Cette interface est fournie à des fins de démonstration et de développement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}