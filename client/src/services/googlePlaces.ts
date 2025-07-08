import { apiRequest } from "@/lib/queryClient";
import { detectStoreCategory } from "@/lib/storeCategories";

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  phone?: string;
  openingHours?: {
    weekday_text: string[];
    open_now?: boolean;
    european_format?: {
      monday?: string;
      tuesday?: string;
      wednesday?: string;
      thursday?: string;
      friday?: string;
      saturday?: string;
      sunday?: string;
    };
  };
  rating?: number;
  website?: string;
  types: string[];
}

export interface PlaceSuggestion {
  placeId: string;
  name: string;
  address: string;
  types: string[];
}

/**
 * Service pour l'intégration Google Places API
 * Gère les suggestions de magasins et la récupération des détails
 */
export class GooglePlacesService {
  
  /**
   * Recherche des suggestions de magasins basées sur une requête
   */
  static async searchStoreSuggestions(query: string, location?: { lat: number; lng: number }): Promise<PlaceSuggestion[]> {
    try {
      // Première recherche standard
      let searchQuery = query;
      
      const params = new URLSearchParams({
        query: searchQuery,
        ...(location && { 
          latitude: location.lat.toString(), 
          longitude: location.lng.toString() 
        })
      });

      const response = await apiRequest("GET", `/api/places/search?${params}`);
      
      // Vérifier si la réponse est valide avant de la parser
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      let results = responseData.suggestions || [];

      // Si peu de résultats et que la recherche semble être pour une chaîne connue,
      // essayer une recherche élargie
      if (results.length < 3) {
        const brandSearches = await this.searchKnownBrands(query, location);
        results = [...results, ...brandSearches].filter((item, index, self) => 
          self.findIndex(i => i.placeId === item.placeId) === index
        );
      }

      // Tri par distance si géolocalisation disponible
      if (location && results.length > 0) {
        results.sort((a, b) => {
          // Extraire les coordonnées depuis l'adresse ou utiliser des coordonnées par défaut
          const aCoords = this.extractCoordinatesFromAddress(a.address);
          const bCoords = this.extractCoordinatesFromAddress(b.address);
          
          if (aCoords && bCoords) {
            const distanceA = this.calculateDistance(location.lat, location.lng, aCoords.lat, aCoords.lng);
            const distanceB = this.calculateDistance(location.lat, location.lng, bCoords.lat, bCoords.lng);
            return distanceA - distanceB;
          }
          return 0;
        });
      }

      return results;
    } catch (error) {
      console.error("Erreur lors de la recherche de suggestions:", error);
      return [];
    }
  }

  /**
   * Recherche élargie pour les marques connues
   */
  private static async searchKnownBrands(query: string, location?: { lat: number; lng: number }): Promise<PlaceSuggestion[]> {
    const queryLower = query.toLowerCase();
    const expandedSearches: string[] = [];

    // Détecter les marques et ajouter des variantes de recherche
    if (queryLower.includes('delhaize')) {
      expandedSearches.push('Delhaize supermarket', 'AD Delhaize', 'Delhaize Shop', 'Delhaize City');
    }
    if (queryLower.includes('aldi')) {
      expandedSearches.push('Aldi supermarket', 'Aldi store', 'Aldi Shop & Go');
    }
    if (queryLower.includes('lidl')) {
      expandedSearches.push('Lidl supermarket', 'Lidl store');
    }
    if (queryLower.includes('carrefour')) {
      expandedSearches.push('Carrefour supermarket', 'Carrefour Market', 'Carrefour Express', 'Carrefour GB');
    }
    if (queryLower.includes('colruyt')) {
      expandedSearches.push('Colruyt supermarket', 'Colruyt Group');
    }
    if (queryLower.includes('okay')) {
      expandedSearches.push('OKay supermarket', 'Okay Compact');
    }
    if (queryLower.includes('proxy')) {
      expandedSearches.push('Proxy Delhaize', 'Proxy supermarket');
    }
    if (queryLower.includes('match')) {
      expandedSearches.push('Match supermarket', 'Smatch');
    }
    if (queryLower.includes('spar')) {
      expandedSearches.push('Spar supermarket', 'Eurospar');
    }
    
    // Fast-food et restaurants
    if (queryLower.includes('mcdo') || queryLower.includes('mcdonald')) {
      expandedSearches.push('McDonald\'s restaurant', 'McDonalds', 'McDrive');
    }
    if (queryLower.includes('burger') && queryLower.includes('king')) {
      expandedSearches.push('Burger King restaurant', 'Burger King Drive');
    }
    if (queryLower.includes('quick')) {
      expandedSearches.push('Quick restaurant', 'Quick Burger');
    }
    if (queryLower.includes('kfc')) {
      expandedSearches.push('KFC restaurant', 'Kentucky Fried Chicken');
    }
    if (queryLower.includes('subway')) {
      expandedSearches.push('Subway restaurant', 'Subway Sandwiches');
    }
    if (queryLower.includes('domino')) {
      expandedSearches.push('Domino\'s Pizza', 'Dominos Pizza');
    }
    if (queryLower.includes('pizza') && queryLower.includes('hut')) {
      expandedSearches.push('Pizza Hut restaurant');
    }
    
    // Boulangeries et cafés
    if (queryLower.includes('paul')) {
      expandedSearches.push('Paul bakery', 'Boulangerie Paul');
    }
    if (queryLower.includes('starbucks')) {
      expandedSearches.push('Starbucks Coffee', 'Starbucks cafe');
    }
    
    // Stations-service
    if (queryLower.includes('shell')) {
      expandedSearches.push('Shell station', 'Shell Express');
    }
    if (queryLower.includes('total')) {
      expandedSearches.push('Total station', 'TotalEnergies');
    }
    if (queryLower.includes('q8')) {
      expandedSearches.push('Q8 station', 'Q8 Easy');
    }
    if (queryLower.includes('bp')) {
      expandedSearches.push('BP station', 'BP Express');
    }
    if (queryLower.includes('esso')) {
      expandedSearches.push('Esso station', 'Esso Express');
    }

    // Exécuter les recherches élargies
    const allResults: PlaceSuggestion[] = [];
    for (const searchQuery of expandedSearches) {
      try {
        const params = new URLSearchParams({
          query: searchQuery,
          ...(location && { 
            latitude: location.lat.toString(), 
            longitude: location.lng.toString() 
          })
        });

        const response = await apiRequest("GET", `/api/places/search?${params}`);
        
        if (!response.ok) {
          continue; // Passer à la recherche suivante si cette requête échoue
        }
        
        const responseData = await response.json();
        if (responseData.suggestions) {
          allResults.push(...responseData.suggestions);
        }
      } catch (error) {
        // Continuer avec les autres recherches en cas d'erreur
      }
    }

    return allResults;
  }

  /**
   * Récupère les détails complets d'un magasin via son Place ID
   */
  static async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      const response = await apiRequest("GET", `/api/places/details?placeId=${placeId}`);
      
      // Vérifier si la réponse est valide et la parser correctement
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      const details = responseData.details;
      
      // Convertir les heures d'ouverture au format européen
      if (details && details.openingHours && details.openingHours.weekday_text) {
        const convertedHours = this.convertOpeningHoursToEuropeanFormat(details.openingHours.weekday_text);
        details.openingHours = {
          ...details.openingHours,
          weekday_text: details.openingHours.weekday_text,
          european_format: convertedHours
        };
      }
      
      return details || null;
    } catch (error) {
      console.error("Erreur lors de la récupération des détails:", error);
      return null;
    }
  }

  /**
   * Recherche des magasins d'une chaîne spécifique dans une zone
   */
  static async searchStoresByBrand(
    brand: string, 
    location: { lat: number; lng: number }, 
    radius: number = 5000
  ): Promise<PlaceSuggestion[]> {
    const brandQueries = {
      aldi: "Aldi supermarket",
      lidl: "Lidl supermarket", 
      delhaize: "Delhaize supermarket",
      carrefour: "Carrefour supermarket",
      okay: "Okay supermarket"
    };

    const query = brandQueries[brand.toLowerCase() as keyof typeof brandQueries] || `${brand} supermarket`;
    
    try {
      const params = new URLSearchParams({
        query,
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
        radius: radius.toString()
      });

      const response = await apiRequest("GET", `/api/places/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      return responseData.suggestions || [];
    } catch (error) {
      console.error(`Erreur lors de la recherche ${brand}:`, error);
      return [];
    }
  }

  /**
   * Calcule la distance entre deux points géographiques
   */
  static calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(value: number): number {
    return value * Math.PI / 180;
  }

  /**
   * Extrait les coordonnées approximatives d'une adresse (méthode simplifiée)
   */
  private static extractCoordinatesFromAddress(address: string): { lat: number; lng: number } | null {
    // Pour l'instant, retourner null car nous recevons déjà les coordonnées via l'API
    // Cette méthode pourrait être améliorée avec un service de géocodage
    return null;
  }

  /**
   * Convertit les heures d'ouverture Google Places au format européen
   */
  private static convertOpeningHoursToEuropeanFormat(weekdayText: string[]): {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  } {
    const dayMapping = {
      'Monday': 'monday',
      'Tuesday': 'tuesday', 
      'Wednesday': 'wednesday',
      'Thursday': 'thursday',
      'Friday': 'friday',
      'Saturday': 'saturday',
      'Sunday': 'sunday'
    };

    const result: any = {};

    weekdayText.forEach(dayText => {
      // Parse format: "Monday: 8:00 AM – 8:00 PM"
      const match = dayText.match(/^(\w+):\s*(.+)$/);
      if (!match) return;

      const [, dayName, hoursText] = match;
      const dayKey = dayMapping[dayName as keyof typeof dayMapping];
      if (!dayKey) return;

      // Gérer les cas fermés
      if (hoursText.toLowerCase().includes('closed') || hoursText.toLowerCase().includes('fermé')) {
        result[dayKey] = 'Fermé';
        return;
      }

      // Convertir format AM/PM vers 24h
      const timeMatch = hoursText.match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM)\s*[–\-]\s*(\d{1,2}):?(\d{0,2})\s*(AM|PM)/i);
      if (timeMatch) {
        const [, startHour, startMin = '00', startPeriod, endHour, endMin = '00', endPeriod] = timeMatch;
        
        // Convertir vers format 24h
        let start24h = parseInt(startHour);
        let end24h = parseInt(endHour);
        
        if (startPeriod.toLowerCase() === 'pm' && start24h !== 12) start24h += 12;
        if (startPeriod.toLowerCase() === 'am' && start24h === 12) start24h = 0;
        if (endPeriod.toLowerCase() === 'pm' && end24h !== 12) end24h += 12;
        if (endPeriod.toLowerCase() === 'am' && end24h === 12) end24h = 0;

        const startFormatted = `${start24h.toString().padStart(2, '0')}:${startMin.padStart(2, '0')}`;
        const endFormatted = `${end24h.toString().padStart(2, '0')}:${endMin.padStart(2, '0')}`;
        
        result[dayKey] = `${startFormatted}-${endFormatted}`;
      } else {
        // Fallback: garder le texte original si parsing échoue
        result[dayKey] = hoursText;
      }
    });

    return result;
  }

  /**
   * Détecte automatiquement la marque d'un magasin basé sur son nom
   */
  static detectStoreBrand(placeName: string): string {
    const name = placeName.toLowerCase();
    
    // Supermarchés
    if (name.includes('aldi')) return 'aldi';
    if (name.includes('lidl')) return 'lidl'; 
    if (name.includes('delhaize')) return 'delhaize';
    if (name.includes('carrefour')) return 'carrefour';
    if (name.includes('okay')) return 'okay';
    if (name.includes('colruyt')) return 'colruyt';
    if (name.includes('intermarché')) return 'intermarche';
    if (name.includes('proxy')) return 'proxy';
    if (name.includes('spar')) return 'spar';
    
    // Fast-foods
    if (name.includes('mcdonald') || name.includes('mcdo')) return 'mcdonalds';
    if (name.includes('quick')) return 'quick';
    if (name.includes('burger king')) return 'burgerking';
    if (name.includes('kfc')) return 'kfc';
    if (name.includes('subway')) return 'subway';
    if (name.includes('pizza hut')) return 'pizzahut';
    if (name.includes('domino')) return 'dominos';
    
    // Boulangeries/Cafés
    if (name.includes('paul')) return 'paul';
    if (name.includes('délifrance') || name.includes('delifrance')) return 'delifrance';
    if (name.includes('starbucks')) return 'starbucks';
    
    // Stations service
    if (name.includes('shell')) return 'shell';
    if (name.includes('total')) return 'total';
    if (name.includes('q8')) return 'q8';
    if (name.includes('bp')) return 'bp';
    if (name.includes('esso')) return 'esso';
    
    // Vêtements
    if (name.includes('h&m')) return 'hm';
    if (name.includes('zara')) return 'zara';
    if (name.includes('c&a')) return 'ca';
    if (name.includes('primark')) return 'primark';
    if (name.includes('uniqlo')) return 'uniqlo';
    
    // Pharmacies
    if (name.includes('pharmacie') || name.includes('pharmacy')) return 'pharmacie';
    
    return 'autre';
  }
}