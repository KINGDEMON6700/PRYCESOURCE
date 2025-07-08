// Service pour l'intégration de l'API OpenFoodFacts
export interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  categories?: string;
  ingredients_text?: string;
  ingredients_text_fr?: string;
  nutrition_grade_fr?: string;
  nutriscore_grade?: string;
  ecoscore_grade?: string;
  image_url?: string;
  image_front_url?: string;
  image_nutrition_url?: string;
  nutriments?: {
    energy_100g?: number;
    fat_100g?: number;
    saturated_fat_100g?: number;
    carbohydrates_100g?: number;
    sugars_100g?: number;
    proteins_100g?: number;
    salt_100g?: number;
    fiber_100g?: number;
  };
  allergens?: string;
  additives_tags?: string[];
  labels?: string;
  packaging?: string;
  quantity?: string;
  serving_size?: string;
  nova_group?: number;
  countries?: string;
  manufacturing_places?: string;
  origins?: string;
  stores?: string;
  purchase_places?: string;
  code?: string;
  _id?: string;
}

export interface OpenFoodFactsResponse {
  status: number;
  status_verbose: string;
  product?: OpenFoodFactsProduct;
}

/**
 * Recherche un produit sur OpenFoodFacts par code-barres
 */
export async function searchProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
  try {
    const response = await fetch(`https://fr.openfoodfacts.org/api/v0/product/${barcode}.json`);
    
    if (!response.ok) {
      return null;
    }

    const data: OpenFoodFactsResponse = await response.json();
    
    if (data.status === 1 && data.product) {
      return data.product;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Recherche des produits sur OpenFoodFacts par nom
 */
export async function searchProductsByName(name: string, limit: number = 10): Promise<OpenFoodFactsProduct[]> {
  try {
    const response = await fetch(`https://fr.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&json=1&page_size=${limit}&sort_by=popularity`);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (data.products && Array.isArray(data.products)) {
      return data.products;
    }
    
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Obtient les informations nutritionnelles formatées
 */
export function formatNutritionInfo(product: OpenFoodFactsProduct): {
  energy?: string;
  fat?: string;
  saturatedFat?: string;
  carbs?: string;
  sugars?: string;
  protein?: string;
  salt?: string;
  fiber?: string;
} {
  const nutriments = product.nutriments || {};
  
  return {
    energy: nutriments.energy_100g ? `${Math.round(nutriments.energy_100g)} kJ` : undefined,
    fat: nutriments.fat_100g ? `${nutriments.fat_100g.toFixed(1)}g` : undefined,
    saturatedFat: nutriments.saturated_fat_100g ? `${nutriments.saturated_fat_100g.toFixed(1)}g` : undefined,
    carbs: nutriments.carbohydrates_100g ? `${nutriments.carbohydrates_100g.toFixed(1)}g` : undefined,
    sugars: nutriments.sugars_100g ? `${nutriments.sugars_100g.toFixed(1)}g` : undefined,
    protein: nutriments.proteins_100g ? `${nutriments.proteins_100g.toFixed(1)}g` : undefined,
    salt: nutriments.salt_100g ? `${nutriments.salt_100g.toFixed(1)}g` : undefined,
    fiber: nutriments.fiber_100g ? `${nutriments.fiber_100g.toFixed(1)}g` : undefined,
  };
}

/**
 * Obtient le grade Nutri-Score avec couleur
 */
export function getNutriScoreInfo(grade?: string): {
  grade: string;
  color: string;
  description: string;
} {
  if (!grade) {
    return {
      grade: "?",
      color: "gray",
      description: "Non évalué"
    };
  }

  const gradeUpper = grade.toUpperCase();
  
  switch (gradeUpper) {
    case "A":
      return {
        grade: "A",
        color: "green",
        description: "Très bonne qualité nutritionnelle"
      };
    case "B":
      return {
        grade: "B",
        color: "lime",
        description: "Bonne qualité nutritionnelle"
      };
    case "C":
      return {
        grade: "C",
        color: "yellow",
        description: "Qualité nutritionnelle moyenne"
      };
    case "D":
      return {
        grade: "D",
        color: "orange",
        description: "Qualité nutritionnelle faible"
      };
    case "E":
      return {
        grade: "E",
        color: "red",
        description: "Qualité nutritionnelle très faible"
      };
    default:
      return {
        grade: "?",
        color: "gray",
        description: "Non évalué"
      };
  }
}

/**
 * Obtient l'Eco-Score avec couleur
 */
export function getEcoScoreInfo(grade?: string): {
  grade: string;
  color: string;
  description: string;
} {
  if (!grade) {
    return {
      grade: "?",
      color: "gray",
      description: "Impact environnemental non évalué"
    };
  }

  const gradeUpper = grade.toUpperCase();
  
  switch (gradeUpper) {
    case "A":
      return {
        grade: "A",
        color: "green",
        description: "Très faible impact environnemental"
      };
    case "B":
      return {
        grade: "B",
        color: "lime",
        description: "Faible impact environnemental"
      };
    case "C":
      return {
        grade: "C",
        color: "yellow",
        description: "Impact environnemental modéré"
      };
    case "D":
      return {
        grade: "D",
        color: "orange",
        description: "Impact environnemental élevé"
      };
    case "E":
      return {
        grade: "E",
        color: "red",
        description: "Impact environnemental très élevé"
      };
    default:
      return {
        grade: "?",
        color: "gray",
        description: "Impact environnemental non évalué"
      };
  }
}

/**
 * Obtient les informations NOVA (transformation des aliments)
 */
export function getNovaInfo(novaGroup?: number): {
  group: string;
  color: string;
  description: string;
} {
  if (!novaGroup) {
    return {
      group: "?",
      color: "gray",
      description: "Niveau de transformation non évalué"
    };
  }

  switch (novaGroup) {
    case 1:
      return {
        group: "1",
        color: "green",
        description: "Aliments non transformés ou transformés minimalement"
      };
    case 2:
      return {
        group: "2",
        color: "lime",
        description: "Ingrédients culinaires transformés"
      };
    case 3:
      return {
        group: "3",
        color: "yellow",
        description: "Aliments transformés"
      };
    case 4:
      return {
        group: "4",
        color: "red",
        description: "Aliments ultra-transformés"
      };
    default:
      return {
        group: "?",
        color: "gray",
        description: "Niveau de transformation non évalué"
      };
  }
}