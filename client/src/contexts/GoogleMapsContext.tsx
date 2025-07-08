import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GoogleMapsContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  isKeyValid: boolean;
  clearApiKey: () => void;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

const STORAGE_KEY = 'google_maps_api_key';

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [apiKey, setApiKeyState] = useState<string>('');
  const [isKeyValid, setIsKeyValid] = useState<boolean>(false);

  // Charger la clé API depuis le localStorage au démarrage
  useEffect(() => {
    const savedApiKey = localStorage.getItem(STORAGE_KEY);
    // Si pas de clé sauvegardée, utiliser la clé fournie par l'utilisateur
    const apiKeyToUse = savedApiKey || "AIzaSyA1Ul7oCU78l1w4_RlJI6A5Gx7fb6_se5w";
    
    if (apiKeyToUse) {
      setApiKeyState(apiKeyToUse);
      // Sauvegarder la clé si ce n'était pas déjà fait
      if (!savedApiKey) {
        localStorage.setItem(STORAGE_KEY, apiKeyToUse);
      }
      // Valider le format de la clé
      const isValid = /^AIza[0-9A-Za-z_-]{35}$/.test(apiKeyToUse);
      setIsKeyValid(isValid);
    }
  }, []);

  // Fonction pour sauvegarder la clé API
  const setApiKey = (key: string) => {
    const trimmedKey = key.trim();
    setApiKeyState(trimmedKey);
    
    if (trimmedKey) {
      localStorage.setItem(STORAGE_KEY, trimmedKey);
      // Valider le format de la clé
      const isValid = /^AIza[0-9A-Za-z_-]{35}$/.test(trimmedKey);
      setIsKeyValid(isValid);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setIsKeyValid(false);
    }
  };

  // Fonction pour supprimer la clé API
  const clearApiKey = () => {
    setApiKeyState('');
    setIsKeyValid(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <GoogleMapsContext.Provider value={{
      apiKey,
      setApiKey,
      isKeyValid,
      clearApiKey
    }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
}