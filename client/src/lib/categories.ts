// Catégories de produits standardisées pour l'application Pryce
export const PRODUCT_CATEGORIES = {
  ALIMENTAIRE: {
    label: "Alimentaire",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    subcategories: [
      "Fruits et légumes",
      "Viandes et poissons", 
      "Produits laitiers",
      "Boulangerie et pâtisserie",
      "Epicerie salée",
      "Epicerie sucrée",
      "Surgelés",
      "Conserves"
    ]
  },
  BOISSONS: {
    label: "Boissons",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    subcategories: [
      "Eaux",
      "Sodas et jus",
      "Bières",
      "Vins et spiritueux",
      "Thé et café",
      "Boissons chaudes"
    ]
  },
  HYGIENE: {
    label: "Hygiène & Beauté",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    subcategories: [
      "Soins du corps",
      "Soins du visage",
      "Cheveux",
      "Hygiène dentaire",
      "Déodorants",
      "Cosmétiques"
    ]
  },
  ENTRETIEN: {
    label: "Entretien & Maison",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    subcategories: [
      "Produits d'entretien",
      "Lessive et assouplissant",
      "Vaisselle",
      "Papier et essuie-tout",
      "Sacs poubelle",
      "Bricolage"
    ]
  },
  BIO: {
    label: "Bio & Naturel",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    subcategories: [
      "Alimentation bio",
      "Cosmétiques bio",
      "Produits naturels",
      "Sans gluten",
      "Vegan"
    ]
  },
  BEBE: {
    label: "Bébé & Enfant",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    subcategories: [
      "Alimentation bébé",
      "Couches et soins",
      "Jouets",
      "Vêtements enfant"
    ]
  },
  ANIMALERIE: {
    label: "Animalerie",
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    subcategories: [
      "Alimentation chien",
      "Alimentation chat",
      "Accessoires animaux",
      "Litière"
    ]
  }
} as const;

export type CategoryKey = keyof typeof PRODUCT_CATEGORIES;

export function getCategoryInfo(category: string) {
  const key = category?.toUpperCase() as CategoryKey;
  return PRODUCT_CATEGORIES[key] || {
    label: category || "Autre",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    subcategories: []
  };
}

export function getAllCategories() {
  return Object.entries(PRODUCT_CATEGORIES).map(([key, value]) => ({
    key: key.toLowerCase(),
    ...value
  }));
}

// Suggestions automatiques basées sur le nom du produit
export function suggestCategory(productName: string): string {
  const name = productName.toLowerCase();
  
  // Alimentaire
  if (name.includes("pain") || name.includes("biscuit") || name.includes("gateau")) return "alimentaire";
  if (name.includes("lait") || name.includes("fromage") || name.includes("yaourt") || name.includes("beurre")) return "alimentaire";
  if (name.includes("viande") || name.includes("poisson") || name.includes("jambon") || name.includes("saumon")) return "alimentaire";
  if (name.includes("pomme") || name.includes("banane") || name.includes("tomate") || name.includes("carotte")) return "alimentaire";
  if (name.includes("riz") || name.includes("pates") || name.includes("farine") || name.includes("sucre")) return "alimentaire";
  
  // Boissons
  if (name.includes("eau") || name.includes("jus") || name.includes("soda") || name.includes("cola")) return "boissons";
  if (name.includes("vin") || name.includes("biere") || name.includes("alcool")) return "boissons";
  if (name.includes("café") || name.includes("the") || name.includes("tisane")) return "boissons";
  
  // Hygiène
  if (name.includes("shampooing") || name.includes("savon") || name.includes("gel") || name.includes("creme")) return "hygiene";
  if (name.includes("dentifrice") || name.includes("brosse") || name.includes("deodorant")) return "hygiene";
  
  // Entretien
  if (name.includes("lessive") || name.includes("produit") || name.includes("nettoyant") || name.includes("javel")) return "entretien";
  if (name.includes("papier") || name.includes("essuie") || name.includes("sac")) return "entretien";
  
  // Bio
  if (name.includes("bio") || name.includes("naturel") || name.includes("sans gluten") || name.includes("vegan")) return "bio";
  
  // Bébé
  if (name.includes("bebe") || name.includes("couche") || name.includes("lait infantile")) return "bebe";
  
  // Animalerie
  if (name.includes("chien") || name.includes("chat") || name.includes("animal") || name.includes("litiere")) return "animalerie";
  
  return "alimentaire"; // Par défaut
}