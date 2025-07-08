import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { BottomNavigation } from "@/components/BottomNavigation";
import { StandardHeader } from "@/components/StandardHeader";
import { EnhancedReportForm } from "@/components/EnhancedReportForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MessageSquare, Lightbulb, CheckCircle } from "lucide-react";

export default function Report() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);

  // Récupérer les paramètres URL pour pré-remplir le formulaire
  const urlParams = new URLSearchParams(window.location.search);
  const dataParam = urlParams.get('data');
  let prefilledData = {};
  
  if (dataParam) {
    try {
      prefilledData = JSON.parse(decodeURIComponent(dataParam));
    } catch (error) {
      console.error('Error parsing prefilled data:', error);
    }
  }
  
  // Fallback pour les anciens paramètres URL
  if (!dataParam) {
    prefilledData = {
      type: urlParams.get('type') || '',
      storeId: urlParams.get('storeId') || '',
      productId: urlParams.get('productId') || '',
      storeName: urlParams.get('storeName') || '',
      productName: urlParams.get('productName') || '',
      currentPrice: urlParams.get('currentPrice') || ''
    };
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Connexion requise</h2>
            <p className="text-gray-300 mb-4">
              Vous devez être connecté pour envoyer un signalement.
            </p>
            <button 
              onClick={() => window.location.href = "/api/login"}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Se connecter
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-900">
        <StandardHeader 
          title="Signalement envoyé"
          showBackButton={true}
        />
        <div className="max-w-2xl mx-auto p-4 pt-20 pb-24">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Signalement reçu !</h2>
              <p className="text-gray-300 mb-6">
                Votre signalement a été transmis à notre équipe d'administration. 
                Nous l'examinerons dans les plus brefs délais.
              </p>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowSuccess(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded w-full"
                >
                  Envoyer un autre signalement
                </button>
                <button 
                  onClick={() => navigate("/")}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded w-full"
                >
                  Retour à l'accueil
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <StandardHeader 
        title="Signalements et Support"
        showBackButton={true}
      />
      
      <div className="max-w-4xl mx-auto p-4 pt-20 pb-24">
        {/* Introduction */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Centre de signalement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-3 p-3 bg-gray-900 rounded">
                <AlertTriangle className="h-8 w-8 text-yellow-400 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-white">Contribuer</h3>
                  <p>Prix incorrect, magasin manquant, bug de l'app</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-900 rounded">
                <Lightbulb className="h-8 w-8 text-blue-400 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-white">Proposer une amélioration</h3>
                  <p>Nouvelles fonctionnalités, suggestions</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-900 rounded">
                <MessageSquare className="h-8 w-8 text-green-400 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-white">Support technique</h3>
                  <p>Aide, questions, problèmes d'utilisation</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Report Form */}
        <EnhancedReportForm 
          onSuccess={() => setShowSuccess(true)} 
          defaultType={prefilledData.type}
          defaultStoreId={prefilledData.storeId ? parseInt(prefilledData.storeId) : undefined}
          defaultProductId={prefilledData.productId ? parseInt(prefilledData.productId) : undefined}
          prefilledData={prefilledData}
        />

        {/* Informations pré-remplies */}
        {(prefilledData.storeName || prefilledData.productName) && (
          <Card className="bg-blue-900/20 border-blue-600">
            <CardHeader>
              <CardTitle className="text-blue-200 text-sm">Signalement pré-rempli</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-100">
              {prefilledData.productName && (
                <div><strong>Produit :</strong> {prefilledData.productName}</div>
              )}
              {prefilledData.storeName && (
                <div><strong>Magasin :</strong> {prefilledData.storeName}</div>
              )}
              {prefilledData.currentPrice && (
                <div><strong>Prix actuel :</strong> {prefilledData.currentPrice}€</div>
              )}
              <div className="text-xs text-blue-200 mt-2">
                Les champs ont été automatiquement remplis. Vous pouvez les modifier si nécessaire.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help section */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">Conseils pour un bon signalement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Soyez précis :</strong> Plus votre description est détaillée, plus vite nous pourrons vous aider.
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Ajoutez le contexte :</strong> Mentionnez le magasin, le produit ou la page concernée.
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Sélectionnez la bonne priorité :</strong> Urgent uniquement pour les problèmes bloquants.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}