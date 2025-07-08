import type { InsertProduct } from "@shared/schema";

export interface ProductSearchResult {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  unit?: string;
  barcode?: string;
  imageUrl?: string;
  description?: string;
}

/**
 * Service de recherche de produits utilisant l'API Open Food Facts
 * API gratuite avec une base de données énorme de produits alimentaires
 */
export class ProductSearchService {
  private static readonly BASE_URL = "https://world.openfoodfacts.org/api/v2";
  private static readonly SEARCH_URL = "https://fr.openfoodfacts.org/cgi/search.pl";

  /**
   * Rechercher des produits par nom en utilisant l'API française
   * Retourne EXACTEMENT les mêmes résultats que sur le site OpenFoodFacts
   */
  static async searchProducts(query: string, limit: number = 10): Promise<ProductSearchResult[]> {
    try {
      // Nettoyage de la requête
      const cleanQuery = query.trim();
      if (!cleanQuery || cleanQuery.length < 2) {
        return [];
      }

      // URL EXACTE utilisée par le site OpenFoodFacts
      const searchUrl = `${this.SEARCH_URL}?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=${limit}&sort_by=unique_scans_n`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.products || !Array.isArray(data.products)) {
        return [];
      }

      // Traitement EXACT des résultats comme sur le site OpenFoodFacts
      const products = data.products
        .filter(product => product.code && product.code.length >= 8) // Produits avec code-barres valide
        .filter(product => product.product_name || product.generic_name) // Produits avec nom
        .map((product: any) => {
          // Nom exact du produit comme sur le site
          const productName = product.product_name || product.generic_name || "Produit sans nom";
          
          // Marque EXACTE comme sur le site
          const brand = product.brands?.split(',')[0]?.trim() || undefined;
          
          // Quantité EXACTE si disponible
          const quantity = product.quantity || "";
          
          // Nom complet avec quantité comme sur le site OpenFoodFacts
          let displayName = productName;
          if (brand && !productName.toLowerCase().includes(brand.toLowerCase())) {
            displayName = `${productName} – ${brand}`;
          }
          if (quantity) {
            displayName = `${displayName} – ${quantity}`;
          }
          
          return {
            id: product.code,
            name: displayName,
            brand: brand,
            category: this.getCategoryFromOpenFoodFacts(product.categories),
            unit: quantity || "unité",
            barcode: product.code,
            imageUrl: product.image_url,
            description: product.generic_name || productName
          };
        })
        .slice(0, limit); // Respect de la limite demandée

      return products;
    } catch (error) {
      return [];
    }
  }



  /**
   * Obtenir les détails d'un produit par code-barres
   * Format identique au site OpenFoodFacts
   */
  static async getProductByBarcode(barcode: string): Promise<ProductSearchResult | null> {
    try {
      const response = await fetch(`${this.BASE_URL}/product/${barcode}.json`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (!data.product) {
        return null;
      }

      const product = data.product;
      
      // Nom exact du produit comme sur le site
      const productName = product.product_name || product.generic_name || "Produit sans nom";
      
      // Marque EXACTE comme sur le site
      const brand = product.brands?.split(',')[0]?.trim() || undefined;
      
      // Quantité EXACTE si disponible
      const quantity = product.quantity || "";
      
      // Nom complet avec quantité comme sur le site OpenFoodFacts
      let displayName = productName;
      if (brand && !productName.toLowerCase().includes(brand.toLowerCase())) {
        displayName = `${productName} – ${brand}`;
      }
      if (quantity) {
        displayName = `${displayName} – ${quantity}`;
      }
      
      return {
        id: product.code || barcode,
        name: displayName,
        brand: brand,
        category: this.getCategoryFromOpenFoodFacts(product.categories),
        unit: quantity || "unité",
        barcode: product.code,
        imageUrl: product.image_url,
        description: product.generic_name || productName
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Convertir les catégories Open Food Facts en catégories Pryce avec précision maximale
   */
  private static getCategoryFromOpenFoodFacts(categories?: string): string {
    if (!categories) return "alimentaire";

    const categoryLower = categories.toLowerCase();
    
    // BOISSONS - Priorité absolue car très spécifique
    if (categoryLower.includes('beverage') || categoryLower.includes('drink') || 
        categoryLower.includes('boisson') || categoryLower.includes('water') ||
        categoryLower.includes('eau') || categoryLower.includes('juice') ||
        categoryLower.includes('jus') || categoryLower.includes('soda') ||
        categoryLower.includes('coffee') || categoryLower.includes('café') ||
        categoryLower.includes('tea') || categoryLower.includes('thé') ||
        categoryLower.includes('beer') || categoryLower.includes('bière') ||
        categoryLower.includes('wine') || categoryLower.includes('vin') ||
        categoryLower.includes('soft-drink') || categoryLower.includes('energy-drink') ||
        categoryLower.includes('carbonated') || categoryLower.includes('gazeux') ||
        categoryLower.includes('sparkling') || categoryLower.includes('pétillant') ||
        categoryLower.includes('milk-drink') || categoryLower.includes('lait de') ||
        categoryLower.includes('plant-milk') || categoryLower.includes('smoothie') ||
        categoryLower.includes('alcoholic') || categoryLower.includes('alcoolisé')) {
      return "boissons";
    }
    
    // BISCUITS ET GATEAUX - Très spécifique
    if (categoryLower.includes('biscuit') || categoryLower.includes('cookie') ||
        categoryLower.includes('cake') || categoryLower.includes('gâteau') ||
        categoryLower.includes('wafer') || categoryLower.includes('gaufrette') ||
        categoryLower.includes('cracker') || categoryLower.includes('digestive') ||
        categoryLower.includes('shortbread') || categoryLower.includes('sablé') ||
        categoryLower.includes('madeleine') || categoryLower.includes('financier') ||
        categoryLower.includes('petit-beurre') || categoryLower.includes('speculoos') ||
        categoryLower.includes('brownie') || categoryLower.includes('muffin') ||
        categoryLower.includes('cupcake') || categoryLower.includes('tart') ||
        categoryLower.includes('tarte') || categoryLower.includes('pastry') ||
        categoryLower.includes('pâtisserie') || categoryLower.includes('bakery-product')) {
      return "biscuits";
    }
    
    // CHOCOLAT ET CONFISERIES - Très spécifique
    if (categoryLower.includes('chocolate') || categoryLower.includes('chocolat') ||
        categoryLower.includes('candy') || categoryLower.includes('bonbon') ||
        categoryLower.includes('sweet') || categoryLower.includes('sucré') ||
        categoryLower.includes('confection') || categoryLower.includes('confiserie') ||
        categoryLower.includes('gum') || categoryLower.includes('chewing') ||
        categoryLower.includes('lollipop') || categoryLower.includes('sucette') ||
        categoryLower.includes('caramel') || categoryLower.includes('nougat') ||
        categoryLower.includes('praline') || categoryLower.includes('truffle') ||
        categoryLower.includes('fudge') || categoryLower.includes('marshmallow') ||
        categoryLower.includes('licorice') || categoryLower.includes('réglisse')) {
      return "chocolat";
    }
    
    // PATES A TARTINER - Très spécifique
    if (categoryLower.includes('spread') || categoryLower.includes('pâte à tartiner') ||
        categoryLower.includes('hazelnut') || categoryLower.includes('noisette') ||
        categoryLower.includes('cocoa') || categoryLower.includes('cacao') ||
        categoryLower.includes('nutella') || categoryLower.includes('sweet spread') ||
        categoryLower.includes('nut-spread') || categoryLower.includes('chocolate-spread')) {
      return "pates-a-tartiner";
    }
    
    // SNACKS SALES - Très spécifique
    if (categoryLower.includes('chips') || categoryLower.includes('crisps') ||
        categoryLower.includes('snack') || categoryLower.includes('aperitif') ||
        categoryLower.includes('apéritif') || categoryLower.includes('nuts') ||
        categoryLower.includes('noix') || categoryLower.includes('peanut') ||
        categoryLower.includes('cacahuète') || categoryLower.includes('pretzel') ||
        categoryLower.includes('popcorn') || categoryLower.includes('crouton') ||
        categoryLower.includes('olive') || categoryLower.includes('dried-fruit') ||
        categoryLower.includes('fruit-sec') || categoryLower.includes('trail-mix')) {
      return "snacks";
    }
    
    // CEREALES ET PETIT DEJEUNER - Très spécifique
    if (categoryLower.includes('cereal') || categoryLower.includes('céréale') ||
        categoryLower.includes('breakfast') || categoryLower.includes('petit-déjeuner') ||
        categoryLower.includes('muesli') || categoryLower.includes('granola') ||
        categoryLower.includes('cornflakes') || categoryLower.includes('oat') ||
        categoryLower.includes('avoine') || categoryLower.includes('porridge') ||
        categoryLower.includes('wheat') || categoryLower.includes('blé') ||
        categoryLower.includes('rice-cereal') || categoryLower.includes('breakfast-cereal')) {
      return "cereales";
    }
    
    // PRODUITS LAITIERS - Très spécifique
    if (categoryLower.includes('dairy') || categoryLower.includes('lait') || 
        categoryLower.includes('fromage') || categoryLower.includes('cheese') ||
        categoryLower.includes('yaourt') || categoryLower.includes('yogurt') ||
        categoryLower.includes('yoghurt') || categoryLower.includes('butter') ||
        categoryLower.includes('beurre') || categoryLower.includes('cream') ||
        categoryLower.includes('crème') || categoryLower.includes('milk') ||
        categoryLower.includes('cottage') || categoryLower.includes('ricotta') ||
        categoryLower.includes('mozzarella') || categoryLower.includes('camembert') ||
        categoryLower.includes('goat') || categoryLower.includes('chèvre')) {
      return "produits-laitiers";
    }
    
    // VIANDES ET POISSONS - Très spécifique
    if (categoryLower.includes('meat') || categoryLower.includes('viande') || 
        categoryLower.includes('beef') || categoryLower.includes('bœuf') ||
        categoryLower.includes('pork') || categoryLower.includes('porc') ||
        categoryLower.includes('chicken') || categoryLower.includes('poulet') ||
        categoryLower.includes('fish') || categoryLower.includes('poisson') ||
        categoryLower.includes('salmon') || categoryLower.includes('saumon') ||
        categoryLower.includes('tuna') || categoryLower.includes('thon') ||
        categoryLower.includes('ham') || categoryLower.includes('jambon') ||
        categoryLower.includes('sausage') || categoryLower.includes('saucisse') ||
        categoryLower.includes('seafood') || categoryLower.includes('fruits-de-mer')) {
      return "viandes-poissons";
    }
    
    // FRUITS ET LEGUMES - Très spécifique
    if (categoryLower.includes('fruit') || categoryLower.includes('vegetable') || 
        categoryLower.includes('légume') || categoryLower.includes('apple') ||
        categoryLower.includes('pomme') || categoryLower.includes('banana') ||
        categoryLower.includes('banane') || categoryLower.includes('orange') ||
        categoryLower.includes('tomato') || categoryLower.includes('tomate') ||
        categoryLower.includes('carrot') || categoryLower.includes('carotte') ||
        categoryLower.includes('potato') || categoryLower.includes('pomme-de-terre') ||
        categoryLower.includes('salad') || categoryLower.includes('salade') ||
        categoryLower.includes('fresh-fruit') || categoryLower.includes('fresh-vegetable')) {
      return "fruits-legumes";
    }
    
    // PAIN ET VIENNOISERIES - Très spécifique
    if (categoryLower.includes('bread') || categoryLower.includes('pain') ||
        categoryLower.includes('bakery') || categoryLower.includes('boulangerie') ||
        categoryLower.includes('croissant') || categoryLower.includes('brioche') ||
        categoryLower.includes('baguette') || categoryLower.includes('toast') ||
        categoryLower.includes('sandwich') || categoryLower.includes('wrap') ||
        categoryLower.includes('bagel') || categoryLower.includes('muffin') ||
        categoryLower.includes('viennoiserie') || categoryLower.includes('pastry')) {
      return "pain-viennoiserie";
    }
    
    // SURGELES - Très spécifique
    if (categoryLower.includes('frozen') || categoryLower.includes('surgelé') ||
        categoryLower.includes('ice') || categoryLower.includes('glace') ||
        categoryLower.includes('frozen-food') || categoryLower.includes('frozen-meal') ||
        categoryLower.includes('ice-cream') || categoryLower.includes('frozen-vegetable') ||
        categoryLower.includes('frozen-fruit') || categoryLower.includes('frozen-fish')) {
      return "surgeles";
    }
    
    // HYGIENE ET BEAUTE - Très spécifique
    if (categoryLower.includes('hygiene') || categoryLower.includes('beauty') ||
        categoryLower.includes('cosmetic') || categoryLower.includes('shampoo') ||
        categoryLower.includes('soap') || categoryLower.includes('savon') ||
        categoryLower.includes('gel') || categoryLower.includes('cream') ||
        categoryLower.includes('crème') || categoryLower.includes('lotion') ||
        categoryLower.includes('toothpaste') || categoryLower.includes('dentifrice') ||
        categoryLower.includes('deodorant') || categoryLower.includes('parfum') ||
        categoryLower.includes('skincare') || categoryLower.includes('haircare')) {
      return "hygiene-beaute";
    }
    
    // ENTRETIEN - Très spécifique
    if (categoryLower.includes('cleaning') || categoryLower.includes('household') ||
        categoryLower.includes('detergent') || categoryLower.includes('lessive') ||
        categoryLower.includes('paper') || categoryLower.includes('papier') ||
        categoryLower.includes('tissue') || categoryLower.includes('essuie') ||
        categoryLower.includes('bag') || categoryLower.includes('sac') ||
        categoryLower.includes('nettoyant') || categoryLower.includes('javel') ||
        categoryLower.includes('dishwasher') || categoryLower.includes('lave-vaisselle')) {
      return "entretien";
    }
    
    // BEBE - Très spécifique
    if (categoryLower.includes('baby') || categoryLower.includes('bébé') ||
        categoryLower.includes('infant') || categoryLower.includes('child') ||
        categoryLower.includes('enfant') || categoryLower.includes('diaper') ||
        categoryLower.includes('couche') || categoryLower.includes('baby-food') ||
        categoryLower.includes('lait-infantile') || categoryLower.includes('formula')) {
      return "bebe";
    }
    
    // ANIMALERIE - Très spécifique
    if (categoryLower.includes('pet') || categoryLower.includes('animal') ||
        categoryLower.includes('dog') || categoryLower.includes('cat') ||
        categoryLower.includes('chien') || categoryLower.includes('chat') ||
        categoryLower.includes('litter') || categoryLower.includes('litière') ||
        categoryLower.includes('pet-food') || categoryLower.includes('dog-food') ||
        categoryLower.includes('cat-food')) {
      return "animalerie";
    }
    
    // ALIMENTAIRE - Fallback pour tous les autres produits alimentaires
    if (categoryLower.includes('food') || categoryLower.includes('aliment') ||
        categoryLower.includes('grocery') || categoryLower.includes('epicerie') ||
        categoryLower.includes('edible') || categoryLower.includes('comestible') ||
        categoryLower.includes('meal') || categoryLower.includes('repas') ||
        categoryLower.includes('ingredient') || categoryLower.includes('ingrédient')) {
      return "alimentaire";
    }

    return "alimentaire";
  }



  /**
   * Convertir un résultat de recherche en InsertProduct
   */
  static convertToInsertProduct(searchResult: ProductSearchResult): InsertProduct {
    // Détection intelligente de catégorie en combinant nom et catégories Open Food Facts
    let detectedCategory = searchResult.category || "Épicerie";
    
    // Si la catégorie détectée est générique, essayer d'affiner par le nom
    if (detectedCategory === "Épicerie" || detectedCategory === "Autres") {
      detectedCategory = this.getCategoryFromProductName(searchResult.name);
    }
    
    // Assurer que la catégorie est toujours valide
    if (!detectedCategory || detectedCategory === "Épicerie" || detectedCategory === "Autres") {
      // Dernière tentative avec la description
      if (searchResult.description) {
        detectedCategory = this.getCategoryFromProductName(searchResult.description);
      }
    }
    
    return {
      name: searchResult.name,
      brand: searchResult.brand || null,
      category: detectedCategory || "Épicerie",
      unit: searchResult.unit || "unité",
      barcode: searchResult.barcode || null,
      imageUrl: searchResult.imageUrl || null,
      description: searchResult.description || null
    };
  }

  /**
   * Déterminer la catégorie d'un produit par son nom (détection intelligente ultra-précise)
   */
  private static getCategoryFromProductName(productName: string): string {
    const nameLower = productName.toLowerCase();
    
    // BOISSONS - Priorité absolue
    if (nameLower.includes('coca') || nameLower.includes('pepsi') ||
        nameLower.includes('fanta') || nameLower.includes('sprite') ||
        nameLower.includes('eau') || nameLower.includes('jus') ||
        nameLower.includes('limonade') || nameLower.includes('bière') ||
        nameLower.includes('café') || nameLower.includes('thé') ||
        nameLower.includes('soda') || nameLower.includes('juice') ||
        nameLower.includes('boisson') || nameLower.includes('drink') ||
        nameLower.includes('smoothie') || nameLower.includes('lait de') ||
        nameLower.includes('energy') || nameLower.includes('énergisante') ||
        nameLower.includes('wine') || nameLower.includes('vin') ||
        nameLower.includes('champagne') || nameLower.includes('alcool')) {
      return "boissons";
    }
    
    // BISCUITS - Très spécifique
    if (nameLower.includes('biscuit') || nameLower.includes('cookie') ||
        nameLower.includes('gâteau') || nameLower.includes('cake') ||
        nameLower.includes('madeleine') || nameLower.includes('petit-beurre') ||
        nameLower.includes('speculoos') || nameLower.includes('digestive') ||
        nameLower.includes('wafer') || nameLower.includes('gaufrette') ||
        nameLower.includes('sablé') || nameLower.includes('crackers') ||
        nameLower.includes('tarte') || nameLower.includes('brownie') ||
        nameLower.includes('muffin') || nameLower.includes('cupcake')) {
      return "biscuits";
    }
    
    // PATES A TARTINER - Priorité pour Nutella et similaires
    if (nameLower.includes('nutella') || nameLower.includes('pâte à tartiner') ||
        nameLower.includes('tartiner') || nameLower.includes('spread') ||
        nameLower.includes('ferrero') || nameLower.includes('noisette') ||
        nameLower.includes('cacao') && nameLower.includes('tartiner')) {
      return "pates-a-tartiner";
    }
    
    // CHOCOLAT ET CONFISERIES
    if (nameLower.includes('chocolat') || nameLower.includes('chocolate') ||
        nameLower.includes('kinder') || nameLower.includes('mars') ||
        nameLower.includes('snickers') || nameLower.includes('twix') ||
        nameLower.includes('bonbon') || nameLower.includes('candy') ||
        nameLower.includes('caramel') || nameLower.includes('nougat') ||
        nameLower.includes('praline') || nameLower.includes('truffe') ||
        nameLower.includes('confiserie') || nameLower.includes('sweet') ||
        nameLower.includes('sucette') || nameLower.includes('chewing') ||
        nameLower.includes('haribo') || nameLower.includes('mentos')) {
      return "chocolat";
    }
    
    // SNACKS SALES
    if (nameLower.includes('chips') || nameLower.includes('crisps') ||
        nameLower.includes('aperitif') || nameLower.includes('apéritif') ||
        nameLower.includes('cacahuète') || nameLower.includes('noix') ||
        nameLower.includes('olive') || nameLower.includes('pretzel') ||
        nameLower.includes('popcorn') || nameLower.includes('snack') ||
        nameLower.includes('biscuit apéritif') || nameLower.includes('tuile')) {
      return "snacks";
    }
    
    // CEREALES ET PETIT DEJEUNER
    if (nameLower.includes('céréale') || nameLower.includes('muesli') ||
        nameLower.includes('granola') || nameLower.includes('cornflakes') ||
        nameLower.includes('avoine') || nameLower.includes('porridge') ||
        nameLower.includes('petit-déjeuner') || nameLower.includes('breakfast') ||
        nameLower.includes('flocons') || nameLower.includes('choco pops') ||
        nameLower.includes('special k') || nameLower.includes('fitness')) {
      return "cereales";
    }
    
    // PRODUITS LAITIERS
    if (nameLower.includes('lait') || nameLower.includes('yaourt') ||
        nameLower.includes('fromage') || nameLower.includes('beurre') ||
        nameLower.includes('crème') || nameLower.includes('yogurt') ||
        nameLower.includes('cheese') || nameLower.includes('milk') ||
        nameLower.includes('cottage') || nameLower.includes('ricotta') ||
        nameLower.includes('mozzarella') || nameLower.includes('camembert') ||
        nameLower.includes('gouda') || nameLower.includes('emmental') ||
        nameLower.includes('mascarpone') || nameLower.includes('philadelphia')) {
      return "produits-laitiers";
    }
    
    // VIANDES ET POISSONS
    if (nameLower.includes('jambon') || nameLower.includes('saucisson') ||
        nameLower.includes('steak') || nameLower.includes('poulet') ||
        nameLower.includes('porc') || nameLower.includes('boeuf') ||
        nameLower.includes('viande') || nameLower.includes('charcuterie') ||
        nameLower.includes('poisson') || nameLower.includes('saumon') ||
        nameLower.includes('thon') || nameLower.includes('crevette') ||
        nameLower.includes('moule') || nameLower.includes('surimi') ||
        nameLower.includes('bacon') || nameLower.includes('chorizo')) {
      return "viandes-poissons";
    }
    
    // FRUITS ET LEGUMES
    if (nameLower.includes('pomme') || nameLower.includes('banane') ||
        nameLower.includes('tomate') || nameLower.includes('carotte') ||
        nameLower.includes('salade') || nameLower.includes('fruit') ||
        nameLower.includes('légume') || nameLower.includes('orange') ||
        nameLower.includes('fraise') || nameLower.includes('raisin') ||
        nameLower.includes('concombre') || nameLower.includes('poivron') ||
        nameLower.includes('courgette') || nameLower.includes('aubergine') ||
        nameLower.includes('brocoli') || nameLower.includes('épinard')) {
      return "fruits-legumes";
    }
    
    // PAIN ET VIENNOISERIES
    if (nameLower.includes('pain') || nameLower.includes('baguette') ||
        nameLower.includes('croissant') || nameLower.includes('brioche') ||
        nameLower.includes('toast') || nameLower.includes('sandwich') ||
        nameLower.includes('wrap') || nameLower.includes('bagel') ||
        nameLower.includes('pita') || nameLower.includes('ciabatta') ||
        nameLower.includes('boulangerie') || nameLower.includes('viennoiserie') ||
        nameLower.includes('pain de mie') || nameLower.includes('pain complet')) {
      return "pain-viennoiserie";
    }
    
    // PATES, RIZ ET FECULENTS
    if (nameLower.includes('pâte') || nameLower.includes('riz') ||
        nameLower.includes('pasta') || nameLower.includes('spaghetti') ||
        nameLower.includes('macaroni') || nameLower.includes('quinoa') ||
        nameLower.includes('couscous') || nameLower.includes('pomme de terre') ||
        nameLower.includes('patate') || nameLower.includes('féculent') ||
        nameLower.includes('tagliatelle') || nameLower.includes('penne') ||
        nameLower.includes('fusilli') || nameLower.includes('ravioli')) {
      return "feculents";
    }
    
    // SURGELES
    if (nameLower.includes('surgelé') || nameLower.includes('frozen') ||
        nameLower.includes('glace') || nameLower.includes('ice cream') ||
        nameLower.includes('sorbet') || nameLower.includes('esquimau') ||
        nameLower.includes('magnum') || nameLower.includes('ben jerry') ||
        nameLower.includes('häagen') || nameLower.includes('légume surgelé')) {
      return "surgeles";
    }
    
    // HYGIENE ET BEAUTE
    if (nameLower.includes('shampoo') || nameLower.includes('savon') ||
        nameLower.includes('gel douche') || nameLower.includes('dentifrice') ||
        nameLower.includes('déodorant') || nameLower.includes('parfum') ||
        nameLower.includes('crème visage') || nameLower.includes('lotion') ||
        nameLower.includes('maquillage') || nameLower.includes('rouge à lèvres') ||
        nameLower.includes('mascara') || nameLower.includes('fond de teint')) {
      return "hygiene-beaute";
    }
    
    // ENTRETIEN
    if (nameLower.includes('lessive') || nameLower.includes('détergent') ||
        nameLower.includes('javel') || nameLower.includes('nettoyant') ||
        nameLower.includes('liquide vaisselle') || nameLower.includes('éponge') ||
        nameLower.includes('papier toilette') || nameLower.includes('essuie-tout') ||
        nameLower.includes('sac poubelle') || nameLower.includes('film plastique')) {
      return "entretien";
    }
    
    // BEBE
    if (nameLower.includes('bébé') || nameLower.includes('baby') ||
        nameLower.includes('couche') || nameLower.includes('lait infantile') ||
        nameLower.includes('biberon') || nameLower.includes('petit pot') ||
        nameLower.includes('compote bébé') || nameLower.includes('formula')) {
      return "bebe";
    }
    
    return "alimentaire";
  }
}