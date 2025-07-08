import { 
  ShoppingCart, 
  DollarSign, 
  Store, 
  ChefHat, 
  Utensils, 
  Croissant, 
  Coffee, 
  Fuel, 
  Pill, 
  Building 
} from "lucide-react";

// Catégories de magasins standardisées pour l'application Pryce
export const STORE_CATEGORIES = {
  SUPERMARCHE: {
    label: "Supermarché",
    icon: ShoppingCart,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    brands: ["delhaize", "carrefour", "colruyt", "cora", "match", "smatch"]
  },
  DISCOUNT: {
    label: "Discount",
    icon: DollarSign,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    brands: ["aldi", "lidl", "netto"]
  },
  PROXIMITE: {
    label: "Proximité",
    icon: Store,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    brands: ["proxy", "ad delhaize", "shop&go", "okay compact", "spar", "night&day"]
  },
  FAST_FOOD: {
    label: "Fast-Food",
    icon: ChefHat,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    brands: ["mcdonald", "burger king", "quick", "kfc", "subway", "domino"]
  },
  RESTAURANT: {
    label: "Restaurant",
    icon: Utensils,
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    brands: ["restaurant", "brasserie", "pizzeria", "taverne"]
  },
  BOULANGERIE: {
    label: "Boulangerie",
    icon: Croissant,
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    brands: ["paul", "boulangerie", "patisserie"]
  },
  CAFE: {
    label: "Café",
    icon: Coffee,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    brands: ["starbucks", "cafe", "coffee"]
  },
  STATION_SERVICE: {
    label: "Station-service",
    icon: Fuel,
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    brands: ["shell", "total", "q8", "bp", "esso", "texaco"]
  },
  PHARMACIE: {
    label: "Pharmacie",
    icon: Pill,
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    brands: ["pharmacie", "apotheek"]
  },
  AUTRE: {
    label: "Autre",
    icon: Building,
    color: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
    brands: []
  }
} as const;

export type StoreCategoryKey = keyof typeof STORE_CATEGORIES;

export function detectStoreCategory(storeName: string, storeTypes?: string[]): StoreCategoryKey {
  const name = storeName.toLowerCase();
  const types = storeTypes?.join(" ").toLowerCase() || "";
  const searchText = `${name} ${types}`;

  // Fast-Food
  if (searchText.includes("mcdonald") || searchText.includes("burger king") || 
      searchText.includes("quick") || searchText.includes("kfc") || 
      searchText.includes("subway") || searchText.includes("domino")) {
    return "FAST_FOOD";
  }

  // Discount
  if (name.includes("aldi") || name.includes("lidl") || name.includes("netto")) {
    return "DISCOUNT";
  }

  // Proximité
  if (name.includes("proxy") || name.includes("shop&go") || name.includes("shop & go") ||
      name.includes("okay compact") || name.includes("spar") || name.includes("night&day") ||
      name.includes("ad delhaize")) {
    return "PROXIMITE";
  }

  // Supermarché
  if (name.includes("delhaize") || name.includes("carrefour") || name.includes("colruyt") ||
      name.includes("cora") || name.includes("match") || name.includes("smatch") ||
      searchText.includes("supermarket") || searchText.includes("grocery")) {
    return "SUPERMARCHE";
  }

  // Boulangerie
  if (name.includes("paul") || name.includes("boulangerie") || name.includes("patisserie") ||
      searchText.includes("bakery")) {
    return "BOULANGERIE";
  }

  // Café
  if (name.includes("starbucks") || name.includes("cafe") || name.includes("coffee") ||
      searchText.includes("cafe")) {
    return "CAFE";
  }

  // Restaurant
  if (name.includes("restaurant") || name.includes("brasserie") || name.includes("pizzeria") ||
      name.includes("taverne") || searchText.includes("restaurant")) {
    return "RESTAURANT";
  }

  // Station-service
  if (name.includes("shell") || name.includes("total") || name.includes("q8") ||
      name.includes("bp") || name.includes("esso") || name.includes("texaco") ||
      searchText.includes("gas_station")) {
    return "STATION_SERVICE";
  }

  // Pharmacie
  if (name.includes("pharmacie") || name.includes("apotheek") || searchText.includes("pharmacy")) {
    return "PHARMACIE";
  }

  return "AUTRE";
}

export function getCategoryInfo(category: StoreCategoryKey) {
  return STORE_CATEGORIES[category];
}

export function getAllStoreCategories() {
  return Object.entries(STORE_CATEGORIES).map(([key, value]) => ({
    key: key as StoreCategoryKey,
    ...value
  }));
}

// Filtrage intelligent par catégorie et localisation
export function filterStoresByQuery(stores: any[], query: string, userLocation?: { lat: number; lng: number }) {
  if (!query) return stores;

  const queryLower = query.toLowerCase();
  let filteredStores = stores;

  // Détecter si c'est une recherche de marque ou de lieu
  const knownBrands = ['aldi', 'lidl', 'delhaize', 'carrefour', 'colruyt', 'okay', 'proxy', 'match', 'intermarché', 'spar'];
  const isBrandSearch = knownBrands.some(brand => queryLower.includes(brand));
  const isLocationSearch = /^[A-Za-zÀ-ÿ\-\s]{2,}$/.test(query.trim()) && !isBrandSearch;

  if (isBrandSearch) {
    // Recherche de marque : filtrer par nom de marque et trier par distance
    filteredStores = stores.filter(store => {
      const storeName = store.name.toLowerCase();
      const storeBrand = store.brand?.toLowerCase() || "";
      const storeCategory = detectStoreCategory(store.name, store.types);
      const categoryInfo = getCategoryInfo(storeCategory);
      
      return storeName.includes(queryLower) ||
             storeBrand.includes(queryLower) ||
             categoryInfo.brands.some(brand => brand.includes(queryLower) || queryLower.includes(brand));
    });
  } else if (isLocationSearch) {
    // Recherche de lieu : filtrer par ville/adresse
    filteredStores = stores.filter(store => {
      const storeAddress = store.address?.toLowerCase() || "";
      const storeCity = store.city?.toLowerCase() || "";
      return storeAddress.includes(queryLower) || storeCity.includes(queryLower);
    });
  } else {
    // Recherche générale
    filteredStores = stores.filter(store => {
      const searchText = `${store.name} ${store.address} ${store.city} ${store.brand}`.toLowerCase();
      return searchText.includes(queryLower);
    });
  }

  // Tri par distance si géolocalisation disponible
  if (userLocation && filteredStores.length > 0) {
    filteredStores.sort((a, b) => {
      const distanceA = calculateDistance(
        userLocation.lat, userLocation.lng,
        parseFloat(a.latitude), parseFloat(a.longitude)
      );
      const distanceB = calculateDistance(
        userLocation.lat, userLocation.lng,
        parseFloat(b.latitude), parseFloat(b.longitude)
      );
      return distanceA - distanceB;
    });
  }

  return filteredStores;
}

// Calcul de distance (copié depuis GooglePlacesService)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}