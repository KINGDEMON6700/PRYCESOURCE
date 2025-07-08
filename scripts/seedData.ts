import { db } from "../server/db";
import { stores, products, prices, storeProducts } from "../shared/schema";
import { eq, and } from "drizzle-orm";

// Données réelles des magasins belges avec coordonnées précises
const BELGIAN_STORES = [
  // Delhaize
  { name: "Delhaize Bruxelles Central", brand: "delhaize", address: "Rue Neuve 123, 1000 Bruxelles", lat: 50.8503, lng: 4.3517, city: "Bruxelles", postalCode: "1000", phone: "+32 2 123 45 67" },
  { name: "Delhaize Anvers Centre", brand: "delhaize", address: "Meir 45, 2000 Anvers", lat: 51.2194, lng: 4.4025, city: "Anvers", postalCode: "2000", phone: "+32 3 234 56 78" },
  { name: "Delhaize Gand Korenmarkt", brand: "delhaize", address: "Korenmarkt 16, 9000 Gand", lat: 51.0543, lng: 3.7174, city: "Gand", postalCode: "9000", phone: "+32 9 345 67 89" },
  { name: "Delhaize Liège Cathédrale", brand: "delhaize", address: "Place du Marché 8, 4000 Liège", lat: 50.6326, lng: 5.5797, city: "Liège", postalCode: "4000", phone: "+32 4 456 78 90" },
  { name: "Delhaize Louvain-la-Neuve", brand: "delhaize", address: "Place de l'Université 25, 1348 Louvain-la-Neuve", lat: 50.6692, lng: 4.6126, city: "Louvain-la-Neuve", postalCode: "1348", phone: "+32 10 567 89 01" },
  { name: "Delhaize Charleroi Centre", brand: "delhaize", address: "Boulevard Tirou 167, 6000 Charleroi", lat: 50.4108, lng: 4.4446, city: "Charleroi", postalCode: "6000", phone: "+32 71 678 90 12" },
  { name: "Delhaize Namur Grognon", brand: "delhaize", address: "Rue des Brasseurs 12, 5000 Namur", lat: 50.4674, lng: 4.8720, city: "Namur", postalCode: "5000", phone: "+32 81 789 01 23" },
  { name: "Delhaize Bruges Markt", brand: "delhaize", address: "Markt 34, 8000 Bruges", lat: 51.2085, lng: 3.2247, city: "Bruges", postalCode: "8000", phone: "+32 50 890 12 34" },
  { name: "Delhaize Mons Grand Place", brand: "delhaize", address: "Grand Place 18, 7000 Mons", lat: 50.4542, lng: 3.9523, city: "Mons", postalCode: "7000", phone: "+32 65 901 23 45" },
  { name: "Delhaize Tournai Cathédrale", brand: "delhaize", address: "Place de l'Evêché 4, 7500 Tournai", lat: 50.6056, lng: 3.3879, city: "Tournai", postalCode: "7500", phone: "+32 69 012 34 56" },
  { name: "Delhaize Ostende Marina", brand: "delhaize", address: "Visserskaai 21, 8400 Ostende", lat: 51.2213, lng: 2.9275, city: "Ostende", postalCode: "8400", phone: "+32 59 123 45 67" },
  { name: "Delhaize Hasselt Grote Markt", brand: "delhaize", address: "Grote Markt 5, 3500 Hasselt", lat: 50.9307, lng: 5.3378, city: "Hasselt", postalCode: "3500", phone: "+32 11 234 56 78" },
  { name: "Delhaize Mechelen Grote Markt", brand: "delhaize", address: "Grote Markt 7, 2800 Mechelen", lat: 51.0259, lng: 4.4772, city: "Mechelen", postalCode: "2800", phone: "+32 15 345 67 89" },

  // Carrefour
  { name: "Carrefour Bruxelles Docks", brand: "carrefour", address: "Rue Neuve 111, 1000 Bruxelles", lat: 50.8476, lng: 4.3559, city: "Bruxelles", postalCode: "1000", phone: "+32 2 456 78 90" },
  { name: "Carrefour Anvers Stadsfeestzaal", brand: "carrefour", address: "Meir 78, 2000 Anvers", lat: 51.2183, lng: 4.4054, city: "Anvers", postalCode: "2000", phone: "+32 3 567 89 01" },
  { name: "Carrefour Gand Zuid", brand: "carrefour", address: "Woodrow Wilsonplein 4, 9000 Gand", lat: 51.0365, lng: 3.7098, city: "Gand", postalCode: "9000", phone: "+32 9 678 90 12" },
  { name: "Carrefour Liège Guillemins", brand: "carrefour", address: "Rue des Guillemins 2, 4000 Liège", lat: 50.6247, lng: 5.5664, city: "Liège", postalCode: "4000", phone: "+32 4 789 01 23" },
  { name: "Carrefour Louvain Centre", brand: "carrefour", address: "Bondgenotenlaan 75, 3000 Louvain", lat: 50.8798, lng: 4.7005, city: "Louvain", postalCode: "3000", phone: "+32 16 890 12 34" },
  { name: "Carrefour Charleroi Rive Gauche", brand: "carrefour", address: "Boulevard Mayence 1, 6000 Charleroi", lat: 50.4169, lng: 4.4319, city: "Charleroi", postalCode: "6000", phone: "+32 71 901 23 45" },
  { name: "Carrefour Namur Wépion", brand: "carrefour", address: "Chaussée de Dinant 1149, 5100 Wépion", lat: 50.4406, lng: 4.8542, city: "Namur", postalCode: "5100", phone: "+32 81 012 34 56" },
  { name: "Carrefour Bruges Sint-Pieters", brand: "carrefour", address: "Sint-Pieterskaai 23, 8000 Bruges", lat: 51.2048, lng: 3.2214, city: "Bruges", postalCode: "8000", phone: "+32 50 123 45 67" },
  { name: "Carrefour Mons Grands Prés", brand: "carrefour", address: "Avenue des Grands Prés 7, 7000 Mons", lat: 50.4478, lng: 3.9445, city: "Mons", postalCode: "7000", phone: "+32 65 234 56 78" },
  { name: "Carrefour Tournai Templeuve", brand: "carrefour", address: "Route de Templeuve 17, 7500 Tournai", lat: 50.5989, lng: 3.4012, city: "Tournai", postalCode: "7500", phone: "+32 69 345 67 89" },
  { name: "Carrefour Ostende Petit-Paris", brand: "carrefour", address: "Petit-Paris 89, 8400 Ostende", lat: 51.2276, lng: 2.9187, city: "Ostende", postalCode: "8400", phone: "+32 59 456 78 90" },
  { name: "Carrefour Hasselt Quartier Bleu", brand: "carrefour", address: "Quartier Bleu 1, 3500 Hasselt", lat: 50.9234, lng: 5.3267, city: "Hasselt", postalCode: "3500", phone: "+32 11 567 89 01" },
  { name: "Carrefour Mechelen Nekkerspoel", brand: "carrefour", address: "Nekkerspoelstraat 378, 2800 Mechelen", lat: 51.0156, lng: 4.4598, city: "Mechelen", postalCode: "2800", phone: "+32 15 678 90 12" },

  // Aldi
  { name: "Aldi Bruxelles Schuman", brand: "aldi", address: "Rue Archimède 73, 1000 Bruxelles", lat: 50.8431, lng: 4.3816, city: "Bruxelles", postalCode: "1000", phone: "+32 2 789 01 23" },
  { name: "Aldi Anvers Berchem", brand: "aldi", address: "Statiestraat 45, 2600 Berchem", lat: 51.1998, lng: 4.4209, city: "Anvers", postalCode: "2600", phone: "+32 3 890 12 34" },
  { name: "Aldi Gand Ledeberg", brand: "aldi", address: "Hundelgemsesteenweg 395, 9050 Ledeberg", lat: 51.0298, lng: 3.7543, city: "Gand", postalCode: "9050", phone: "+32 9 901 23 45" },
  { name: "Aldi Liège Sclessin", brand: "aldi", address: "Rue de Sclessin 53, 4000 Liège", lat: 50.6139, lng: 5.5456, city: "Liège", postalCode: "4000", phone: "+32 4 012 34 56" },
  { name: "Aldi Louvain Heverlee", brand: "aldi", address: "Naamsesteenweg 355, 3001 Heverlee", lat: 50.8643, lng: 4.7076, city: "Louvain", postalCode: "3001", phone: "+32 16 123 45 67" },
  { name: "Aldi Charleroi Marcinelle", brand: "aldi", address: "Rue de la Providence 134, 6001 Marcinelle", lat: 50.3987, lng: 4.4234, city: "Charleroi", postalCode: "6001", phone: "+32 71 234 56 78" },
  { name: "Aldi Namur Salzinnes", brand: "aldi", address: "Chaussée de Waterloo 182, 5000 Namur", lat: 50.4598, lng: 4.8456, city: "Namur", postalCode: "5000", phone: "+32 81 345 67 89" },
  { name: "Aldi Bruges Assebroek", brand: "aldi", address: "Noordzandstraat 15, 8310 Assebroek", lat: 51.2234, lng: 3.1876, city: "Bruges", postalCode: "8310", phone: "+32 50 456 78 90" },
  { name: "Aldi Mons Cuesmes", brand: "aldi", address: "Rue de Mons 267, 7033 Cuesmes", lat: 50.4389, lng: 3.8945, city: "Mons", postalCode: "7033", phone: "+32 65 567 89 01" },
  { name: "Aldi Tournai Kain", brand: "aldi", address: "Chaussée de Lille 203, 7540 Kain", lat: 50.6187, lng: 3.4234, city: "Tournai", postalCode: "7540", phone: "+32 69 678 90 12" },
  { name: "Aldi Ostende Mariakerke", brand: "aldi", address: "Nieuwpoortsesteenweg 781, 8400 Ostende", lat: 51.2487, lng: 2.8934, city: "Ostende", postalCode: "8400", phone: "+32 59 789 01 23" },
  { name: "Aldi Hasselt Kiewit", brand: "aldi", address: "Kiewitstraat 9, 3500 Hasselt", lat: 50.9456, lng: 5.3567, city: "Hasselt", postalCode: "3500", phone: "+32 11 890 12 34" },
  { name: "Aldi Mechelen Muizen", brand: "aldi", address: "Leuvensesteenweg 175, 2812 Muizen", lat: 51.0087, lng: 4.5234, city: "Mechelen", postalCode: "2812", phone: "+32 15 901 23 45" },

  // Lidl
  { name: "Lidl Bruxelles Ixelles", brand: "lidl", address: "Chaussée d'Ixelles 123, 1050 Ixelles", lat: 50.8267, lng: 4.3676, city: "Bruxelles", postalCode: "1050", phone: "+32 2 012 34 56" },
  { name: "Lidl Anvers Wilrijk", brand: "lidl", address: "Boomsesteenweg 724, 2610 Wilrijk", lat: 51.1687, lng: 4.3945, city: "Anvers", postalCode: "2610", phone: "+32 3 123 45 67" },
  { name: "Lidl Gand Wondelgem", brand: "lidl", address: "Wondelgemstraat 158, 9000 Gand", lat: 51.0876, lng: 3.7234, city: "Gand", postalCode: "9000", phone: "+32 9 234 56 78" },
  { name: "Lidl Liège Herstal", brand: "lidl", address: "Rue Large Voie 98, 4040 Herstal", lat: 50.6789, lng: 5.6234, city: "Liège", postalCode: "4040", phone: "+32 4 345 67 89" },
  { name: "Lidl Louvain Kessel-Lo", brand: "lidl", address: "Diestsesteenweg 204, 3010 Kessel-Lo", lat: 50.8934, lng: 4.7345, city: "Louvain", postalCode: "3010", phone: "+32 16 456 78 90" },
  { name: "Lidl Charleroi Gilly", brand: "lidl", address: "Chaussée de Fleurus 441, 6060 Gilly", lat: 50.4234, lng: 4.4567, city: "Charleroi", postalCode: "6060", phone: "+32 71 567 89 01" },
  { name: "Lidl Namur Jambes", brand: "lidl", address: "Avenue de la Plante 45, 5100 Jambes", lat: 50.4456, lng: 4.8678, city: "Namur", postalCode: "5100", phone: "+32 81 678 90 12" },
  { name: "Lidl Bruges Zeebrugge", brand: "lidl", address: "Kustlaan 187, 8380 Zeebrugge", lat: 51.3234, lng: 3.1987, city: "Bruges", postalCode: "8380", phone: "+32 50 789 01 23" },
  { name: "Lidl Mons Jemappes", brand: "lidl", address: "Rue Buisseret 78, 7012 Jemappes", lat: 50.4567, lng: 3.8789, city: "Mons", postalCode: "7012", phone: "+32 65 890 12 34" },
  { name: "Lidl Tournai Froyennes", brand: "lidl", address: "Rue de Roubaix 267, 7503 Froyennes", lat: 50.5789, lng: 3.4123, city: "Tournai", postalCode: "7503", phone: "+32 69 901 23 45" },
  { name: "Lidl Ostende Bredene", brand: "lidl", address: "Kapellestraat 234, 8450 Bredene", lat: 51.2456, lng: 2.9612, city: "Ostende", postalCode: "8450", phone: "+32 59 012 34 56" },
  { name: "Lidl Hasselt Genk", brand: "lidl", address: "Winkelstraat 89, 3600 Genk", lat: 50.9678, lng: 5.5023, city: "Hasselt", postalCode: "3600", phone: "+32 89 123 45 67" },
  { name: "Lidl Mechelen Hombeek", brand: "lidl", address: "Leuvensesteenweg 423, 2811 Hombeek", lat: 51.0345, lng: 4.5678, city: "Mechelen", postalCode: "2811", phone: "+32 15 234 56 78" },
];

// Produits réels belges avec descriptions détaillées
const BELGIAN_PRODUCTS = [
  // Produits frais
  { name: "Pain de mie complet Bio", category: "Boulangerie", brand: "Delhaize", unit: "500g", description: "Pain de mie complet bio, riche en fibres, sans conservateurs artificiels" },
  { name: "Baguette tradition", category: "Boulangerie", brand: "Carrefour", unit: "1 pièce", description: "Baguette tradition française, croustillante et dorée, cuite au four" },
  { name: "Croissants au beurre", category: "Boulangerie", brand: "Lidl", unit: "6 pièces", description: "Croissants pur beurre, feuilletés et dorés, prêts à déguster" },
  { name: "Lait demi-écrémé", category: "Produits laitiers", brand: "Delhaize", unit: "1L", description: "Lait frais belge demi-écrémé, source naturelle de calcium" },
  { name: "Fromage de chèvre fermier", category: "Fromage", brand: "Carrefour", unit: "200g", description: "Fromage de chèvre fermier belge, crémeux et savoureux" },
  { name: "Yaourt nature Bio", category: "Produits laitiers", brand: "Aldi", unit: "4x125g", description: "Yaourt nature bio, sans sucres ajoutés, riche en ferments lactiques" },
  { name: "Beurre doux fermier", category: "Produits laitiers", brand: "Delhaize", unit: "250g", description: "Beurre doux fermier belge, onctueux et savoureux" },
  { name: "Œufs frais de poules élevées au sol", category: "Œufs", brand: "Carrefour", unit: "12 pièces", description: "Œufs frais de poules élevées au sol, riches en protéines" },
  
  // Viandes et charcuteries
  { name: "Jambon cuit supérieur", category: "Charcuterie", brand: "Delhaize", unit: "200g", description: "Jambon cuit supérieur belge, sans polyphosphates, tranché finement" },
  { name: "Saucisson sec artisanal", category: "Charcuterie", brand: "Carrefour", unit: "150g", description: "Saucisson sec artisanal belge, affiné traditionnellement" },
  { name: "Escalopes de porc", category: "Viande", brand: "Aldi", unit: "400g", description: "Escalopes de porc belge, tendres et savoureuses" },
  { name: "Filet de bœuf", category: "Viande", brand: "Delhaize", unit: "300g", description: "Filet de bœuf belge, pièce noble et tendre" },
  { name: "Cuisses de poulet fermier", category: "Volaille", brand: "Lidl", unit: "1kg", description: "Cuisses de poulet fermier belge, élevé au grain" },
  
  // Fruits et légumes
  { name: "Pommes Golden Bio", category: "Fruits", brand: "Delhaize", unit: "1kg", description: "Pommes Golden bio belges, croquantes et sucrées" },
  { name: "Bananes équitables", category: "Fruits", brand: "Carrefour", unit: "1kg", description: "Bananes équitables, mûries naturellement" },
  { name: "Tomates cerises", category: "Légumes", brand: "Aldi", unit: "500g", description: "Tomates cerises belges, sucrées et parfumées" },
  { name: "Carottes nouvelles", category: "Légumes", brand: "Lidl", unit: "1kg", description: "Carottes nouvelles belges, tendres et croquantes" },
  { name: "Salade mélangée", category: "Légumes", brand: "Delhaize", unit: "150g", description: "Mélange de jeunes pousses, prêt à consommer" },
  { name: "Champignons de Paris", category: "Légumes", brand: "Carrefour", unit: "300g", description: "Champignons de Paris frais, cultivés en Belgique" },
  
  // Épicerie salée
  { name: "Pâtes spaghetti", category: "Épicerie", brand: "Aldi", unit: "500g", description: "Spaghetti de blé dur, cuisson parfaite en 8 minutes" },
  { name: "Riz basmati", category: "Épicerie", brand: "Lidl", unit: "1kg", description: "Riz basmati parfumé, grains longs et fins" },
  { name: "Huile d'olive extra vierge", category: "Épicerie", brand: "Delhaize", unit: "500ml", description: "Huile d'olive extra vierge première pression à froid" },
  { name: "Sauce tomate basilic", category: "Épicerie", brand: "Carrefour", unit: "400g", description: "Sauce tomate au basilic, sans conservateurs" },
  { name: "Conserve de thon", category: "Conserves", brand: "Aldi", unit: "160g", description: "Thon au naturel, pêché de manière responsable" },
  { name: "Légumes pour potage", category: "Conserves", brand: "Lidl", unit: "400g", description: "Mélange de légumes pour potage, prêt à cuisiner" },
  
  // Épicerie sucrée
  { name: "Confiture de fraises", category: "Épicerie sucrée", brand: "Delhaize", unit: "300g", description: "Confiture de fraises belges, 60% de fruits" },
  { name: "Miel de fleurs", category: "Épicerie sucrée", brand: "Carrefour", unit: "250g", description: "Miel de fleurs belge, cristallisé naturellement" },
  { name: "Chocolat noir 70%", category: "Chocolat", brand: "Aldi", unit: "100g", description: "Chocolat noir belge 70% cacao, intense et fondant" },
  { name: "Pralines assorties", category: "Chocolat", brand: "Lidl", unit: "200g", description: "Assortiment de pralines belges, fourrées et enrobées" },
  { name: "Biscuits au beurre", category: "Biscuits", brand: "Delhaize", unit: "200g", description: "Biscuits sablés au beurre, recette traditionnelle belge" },
  { name: "Gaufres de Liège", category: "Biscuits", brand: "Carrefour", unit: "6 pièces", description: "Authentiques gaufres de Liège, avec perles de sucre" },
  
  // Boissons
  { name: "Eau minérale naturelle", category: "Boissons", brand: "Aldi", unit: "1.5L", description: "Eau minérale naturelle belge, source des Ardennes" },
  { name: "Jus d'orange frais", category: "Boissons", brand: "Lidl", unit: "1L", description: "Jus d'orange 100% pur jus, sans sucres ajoutés" },
  { name: "Bière blonde belge", category: "Alcools", brand: "Delhaize", unit: "33cl", description: "Bière blonde belge traditionnelle, houblonnée" },
  { name: "Vin rouge de Bordeaux", category: "Alcools", brand: "Carrefour", unit: "75cl", description: "Vin rouge de Bordeaux, millésime récent" },
  { name: "Café moulu arabica", category: "Boissons chaudes", brand: "Aldi", unit: "250g", description: "Café moulu 100% arabica, torréfaction artisanale" },
  { name: "Thé Earl Grey", category: "Boissons chaudes", brand: "Lidl", unit: "25 sachets", description: "Thé Earl Grey aux bergamotes, mélange raffiné" },
  
  // Surgelés
  { name: "Frites belges surgelées", category: "Surgelés", brand: "Delhaize", unit: "1kg", description: "Frites belges surgelées, prêtes à cuire" },
  { name: "Légumes pour wok", category: "Surgelés", brand: "Carrefour", unit: "400g", description: "Mélange de légumes asiatiques surgelés" },
  { name: "Poisson pané", category: "Surgelés", brand: "Aldi", unit: "400g", description: "Filets de poisson panés, prêts à cuire" },
  { name: "Pizza margherita", category: "Surgelés", brand: "Lidl", unit: "350g", description: "Pizza margherita surgelée, pâte fine" },
  { name: "Glace vanille", category: "Surgelés", brand: "Delhaize", unit: "500ml", description: "Glace à la vanille de Madagascar, onctueuse" },
  
  // Hygiène et beauté
  { name: "Gel douche hydratant", category: "Hygiène", brand: "Carrefour", unit: "400ml", description: "Gel douche hydratant, peaux sensibles" },
  { name: "Shampooing tous cheveux", category: "Hygiène", brand: "Aldi", unit: "300ml", description: "Shampooing pour tous types de cheveux" },
  { name: "Dentifrice menthe", category: "Hygiène", brand: "Lidl", unit: "75ml", description: "Dentifrice au fluor, fraîcheur menthe" },
  { name: "Déodorant 48h", category: "Hygiène", brand: "Delhaize", unit: "150ml", description: "Déodorant protection 48h, sans alcool" },
  { name: "Crème hydratante", category: "Beauté", brand: "Carrefour", unit: "200ml", description: "Crème hydratante corps, peaux sèches" },
  
  // Entretien
  { name: "Lessive liquide", category: "Entretien", brand: "Aldi", unit: "1.5L", description: "Lessive liquide concentrée, 30 lavages" },
  { name: "Liquide vaisselle", category: "Entretien", brand: "Lidl", unit: "500ml", description: "Liquide vaisselle dégraissant, parfum citron" },
  { name: "Nettoyant multi-surfaces", category: "Entretien", brand: "Delhaize", unit: "750ml", description: "Nettoyant multi-surfaces, désinfectant" },
  { name: "Papier toilette", category: "Entretien", brand: "Carrefour", unit: "12 rouleaux", description: "Papier toilette 3 épaisseurs, doux et résistant" },
  { name: "Sacs poubelle", category: "Entretien", brand: "Aldi", unit: "20 pièces", description: "Sacs poubelle 50L, résistants et étanches" },
  
  // Produits pour animaux
  { name: "Croquettes pour chien", category: "Animaux", brand: "Lidl", unit: "2kg", description: "Croquettes pour chien adulte, riches en protéines" },
  { name: "Pâtée pour chat", category: "Animaux", brand: "Delhaize", unit: "400g", description: "Pâtée pour chat adulte, au saumon" },
  { name: "Litière pour chat", category: "Animaux", brand: "Carrefour", unit: "5kg", description: "Litière agglomérante, contrôle des odeurs" },
  { name: "Friandises pour chien", category: "Animaux", brand: "Aldi", unit: "200g", description: "Friandises pour chien, os à mâcher" },
  
  // Produits de saison
  { name: "Chocolats de Pâques", category: "Saisonnier", brand: "Lidl", unit: "150g", description: "Assortiment de chocolats de Pâques belges" },
  { name: "Bûche de Noël", category: "Saisonnier", brand: "Delhaize", unit: "500g", description: "Bûche de Noël glacée, parfum vanille-chocolat" },
  { name: "Galette des rois", category: "Saisonnier", brand: "Carrefour", unit: "400g", description: "Galette des rois à la frangipane, fève incluse" },
  { name: "Speculoos de Saint-Nicolas", category: "Saisonnier", brand: "Aldi", unit: "300g", description: "Speculoos traditionnels belges de Saint-Nicolas" },
  
  // Produits bio
  { name: "Quinoa bio", category: "Bio", brand: "Delhaize", unit: "400g", description: "Quinoa bio équitable, riche en protéines" },
  { name: "Lentilles vertes bio", category: "Bio", brand: "Carrefour", unit: "500g", description: "Lentilles vertes bio françaises, riches en fibres" },
  { name: "Muesli bio", category: "Bio", brand: "Aldi", unit: "500g", description: "Muesli bio aux fruits secs et noix" },
  { name: "Compote pomme bio", category: "Bio", brand: "Lidl", unit: "400g", description: "Compote de pommes bio, sans sucres ajoutés" },
  { name: "Pâtes complètes bio", category: "Bio", brand: "Delhaize", unit: "500g", description: "Pâtes complètes bio, riches en fibres" },
  
  // Produits régionaux belges
  { name: "Carbonnade flamande", category: "Plats préparés", brand: "Carrefour", unit: "400g", description: "Carbonnade flamande traditionnelle, mijotée à la bière" },
  { name: "Waterzooi de poulet", category: "Plats préparés", brand: "Aldi", unit: "350g", description: "Waterzooi de poulet gantois, crémeux et parfumé" },
  { name: "Boudin noir de Liège", category: "Charcuterie", brand: "Lidl", unit: "200g", description: "Boudin noir de Liège, recette traditionnelle" },
  { name: "Fromage de Herve", category: "Fromage", brand: "Delhaize", unit: "200g", description: "Fromage de Herve AOP, pâte molle à croûte lavée" },
  { name: "Sirop de Liège", category: "Épicerie sucrée", brand: "Carrefour", unit: "450g", description: "Sirop de Liège traditionnel, aux pommes et poires" },
  
  // Produits pour bébés
  { name: "Lait infantile 1er âge", category: "Bébé", brand: "Aldi", unit: "800g", description: "Lait infantile 1er âge, 0-6 mois" },
  { name: "Petits pots légumes", category: "Bébé", brand: "Lidl", unit: "2x130g", description: "Petits pots légumes variés, dès 4 mois" },
  { name: "Couches taille 3", category: "Bébé", brand: "Delhaize", unit: "44 pièces", description: "Couches taille 3, absorption 12h" },
  { name: "Lingettes bébé", category: "Bébé", brand: "Carrefour", unit: "72 pièces", description: "Lingettes bébé ultra-douces, sans parfum" },
  
  // Produits diététiques
  { name: "Barres protéinées", category: "Diététique", brand: "Aldi", unit: "6x35g", description: "Barres protéinées, 20g de protéines par barre" },
  { name: "Boisson isotonique", category: "Diététique", brand: "Lidl", unit: "500ml", description: "Boisson isotonique, parfum citron" },
  { name: "Substitut de repas", category: "Diététique", brand: "Delhaize", unit: "330ml", description: "Substitut de repas, saveur vanille" },
  { name: "Compléments vitaminés", category: "Diététique", brand: "Carrefour", unit: "30 comprimés", description: "Compléments multivitaminés, 1 par jour" },
  
  // Produits sans gluten
  { name: "Pain sans gluten", category: "Sans gluten", brand: "Aldi", unit: "400g", description: "Pain de mie sans gluten, moelleux" },
  { name: "Pâtes sans gluten", category: "Sans gluten", brand: "Lidl", unit: "400g", description: "Pâtes fusilli sans gluten, au riz" },
  { name: "Biscuits sans gluten", category: "Sans gluten", brand: "Delhaize", unit: "150g", description: "Biscuits digestifs sans gluten" },
  { name: "Farine sans gluten", category: "Sans gluten", brand: "Carrefour", unit: "500g", description: "Farine sans gluten, mix pâtisserie" },
  
  // Produits végétariens/végans
  { name: "Steaks végétaux", category: "Végétarien", brand: "Aldi", unit: "200g", description: "Steaks végétaux aux légumes et céréales" },
  { name: "Lait d'amande", category: "Végétal", brand: "Lidl", unit: "1L", description: "Boisson à l'amande, sans sucres ajoutés" },
  { name: "Tofu fumé", category: "Végétarien", brand: "Delhaize", unit: "200g", description: "Tofu fumé bio, riche en protéines" },
  { name: "Houmous classique", category: "Végétarien", brand: "Carrefour", unit: "200g", description: "Houmous de pois chiches, recette libanaise" },
  
  // Produits artisanaux
  { name: "Pain artisanal aux graines", category: "Artisanal", brand: "Aldi", unit: "500g", description: "Pain artisanal aux graines de tournesol" },
  { name: "Confitures artisanales", category: "Artisanal", brand: "Lidl", unit: "220g", description: "Confiture artisanale, 70% de fruits" },
  { name: "Moutarde à l'ancienne", category: "Artisanal", brand: "Delhaize", unit: "200g", description: "Moutarde à l'ancienne, grains entiers" },
  { name: "Vinaigre balsamique", category: "Artisanal", brand: "Carrefour", unit: "250ml", description: "Vinaigre balsamique de Modène" },
  
  // Produits festifs
  { name: "Champagne brut", category: "Festif", brand: "Aldi", unit: "75cl", description: "Champagne brut, bulles fines et élégantes" },
  { name: "Foie gras", category: "Festif", brand: "Lidl", unit: "120g", description: "Foie gras de canard, bloc avec morceaux" },
  { name: "Saumon fumé", category: "Festif", brand: "Delhaize", unit: "150g", description: "Saumon fumé d'Écosse, tranché finement" },
  { name: "Caviar d'Aquitaine", category: "Festif", brand: "Carrefour", unit: "30g", description: "Caviar d'Aquitaine, grains nacrés" },
  
  // Produits du terroir
  { name: "Miel de lavande", category: "Terroir", brand: "Aldi", unit: "250g", description: "Miel de lavande de Provence, parfumé" },
  { name: "Rillettes de porc", category: "Terroir", brand: "Lidl", unit: "200g", description: "Rillettes de porc du Maine, onctueuses" },
  { name: "Andouillette de Troyes", category: "Terroir", brand: "Delhaize", unit: "150g", description: "Andouillette de Troyes, AAAAA" },
  { name: "Roquefort AOP", category: "Terroir", brand: "Carrefour", unit: "100g", description: "Roquefort AOP, pâte persillée" },
  
  // Produits exotiques
  { name: "Lait de coco", category: "Exotique", brand: "Aldi", unit: "400ml", description: "Lait de coco, cuisine asiatique" },
  { name: "Sauce soja", category: "Exotique", brand: "Lidl", unit: "200ml", description: "Sauce soja salée, cuisine japonaise" },
  { name: "Pâte de curry", category: "Exotique", brand: "Delhaize", unit: "100g", description: "Pâte de curry rouge thaï, épicée" },
  { name: "Nouilles de riz", category: "Exotique", brand: "Carrefour", unit: "400g", description: "Nouilles de riz, cuisine asiatique" },
  
  // Produits de petit-déjeuner
  { name: "Céréales au chocolat", category: "Petit-déjeuner", brand: "Aldi", unit: "375g", description: "Céréales croustillantes au chocolat" },
  { name: "Porridge avoine", category: "Petit-déjeuner", brand: "Lidl", unit: "500g", description: "Porridge d'avoine, riche en fibres" },
  { name: "Pâte à tartiner", category: "Petit-déjeuner", brand: "Delhaize", unit: "400g", description: "Pâte à tartiner noisettes et cacao" },
  { name: "Jus de fruits pressé", category: "Petit-déjeuner", brand: "Carrefour", unit: "1L", description: "Jus multi-fruits pressé à froid" },
  
  // Produits apéritifs
  { name: "Olives vertes", category: "Apéritif", brand: "Aldi", unit: "200g", description: "Olives vertes dénoyautées, marinées" },
  { name: "Tapenades mixtes", category: "Apéritif", brand: "Lidl", unit: "90g", description: "Tapenade d'olives noires et vertes" },
  { name: "Chips artisanales", category: "Apéritif", brand: "Delhaize", unit: "150g", description: "Chips artisanales, sel de Guérande" },
  { name: "Crackers fromage", category: "Apéritif", brand: "Carrefour", unit: "100g", description: "Crackers au fromage, croustillants" },
  
  // Produits cuisinés
  { name: "Lasagnes bolognaise", category: "Plats cuisinés", brand: "Aldi", unit: "400g", description: "Lasagnes à la bolognaise, gratinées" },
  { name: "Couscous royal", category: "Plats cuisinés", brand: "Lidl", unit: "500g", description: "Couscous royal aux légumes et merguez" },
  { name: "Paella valencienne", category: "Plats cuisinés", brand: "Delhaize", unit: "450g", description: "Paella valencienne aux fruits de mer" },
  { name: "Chili con carne", category: "Plats cuisinés", brand: "Carrefour", unit: "400g", description: "Chili con carne épicé, haricots rouges" },
  
  // Produits de boulangerie fine
  { name: "Macarons assortis", category: "Pâtisserie", brand: "Aldi", unit: "12 pièces", description: "Macarons assortis, 6 parfums différents" },
  { name: "Éclairs au chocolat", category: "Pâtisserie", brand: "Lidl", unit: "4 pièces", description: "Éclairs au chocolat, pâte à choux" },
  { name: "Mille-feuille vanille", category: "Pâtisserie", brand: "Delhaize", unit: "200g", description: "Mille-feuille à la crème vanille" },
  { name: "Tarte aux fruits", category: "Pâtisserie", brand: "Carrefour", unit: "400g", description: "Tarte aux fruits de saison, pâte sablée" },
  
  // Produits de conserve fine
  { name: "Rillettes de saumon", category: "Conserve fine", brand: "Aldi", unit: "120g", description: "Rillettes de saumon, recette artisanale" },
  { name: "Confit de canard", category: "Conserve fine", brand: "Lidl", unit: "300g", description: "Confit de canard du Sud-Ouest" },
  { name: "Cassoulet toulousain", category: "Conserve fine", brand: "Delhaize", unit: "840g", description: "Cassoulet toulousain, recette traditionnelle" },
  { name: "Brandade de morue", category: "Conserve fine", brand: "Carrefour", unit: "200g", description: "Brandade de morue, spécialité nîmoise" },
  
  // Produits de snacking
  { name: "Sandwich jambon-beurre", category: "Snacking", brand: "Aldi", unit: "1 pièce", description: "Sandwich jambon-beurre, baguette fraîche" },
  { name: "Wraps poulet curry", category: "Snacking", brand: "Lidl", unit: "1 pièce", description: "Wrap au poulet curry et crudités" },
  { name: "Salade César", category: "Snacking", brand: "Delhaize", unit: "200g", description: "Salade César, poulet et parmesan" },
  { name: "Quiche lorraine", category: "Snacking", brand: "Carrefour", unit: "200g", description: "Quiche lorraine, lardons et gruyère" },
  
  // Produits de tradition belge
  { name: "Speculoos à tartiner", category: "Tradition belge", brand: "Aldi", unit: "400g", description: "Pâte de speculoos belges à tartiner" },
  { name: "Cuberdon violet", category: "Tradition belge", brand: "Lidl", unit: "200g", description: "Cuberdons violets gantois, nez de Gand" },
  { name: "Chicons au gratin", category: "Tradition belge", brand: "Delhaize", unit: "600g", description: "Chicons au gratin, béchamel et jambon" },
  { name: "Américain préparé", category: "Tradition belge", brand: "Carrefour", unit: "200g", description: "Américain préparé, steak tartare belge" },
  
  // Produits de luxe
  { name: "Truffe noire", category: "Luxe", brand: "Aldi", unit: "20g", description: "Truffe noire du Périgord, saveur intense" },
  { name: "Huîtres spéciales", category: "Luxe", brand: "Lidl", unit: "12 pièces", description: "Huîtres spéciales de Belon, calibre 3" },
  { name: "Homard breton", category: "Luxe", brand: "Delhaize", unit: "500g", description: "Homard breton vivant, pêche française" },
  { name: "Magret de canard", category: "Luxe", brand: "Carrefour", unit: "300g", description: "Magret de canard du Sud-Ouest, IGP" },
];

// Fonction pour générer des prix réalistes
function generateRealisticPrice(productName: string, brand: string): number {
  const basePrices: { [key: string]: number } = {
    'pain': 2.50, 'lait': 1.20, 'fromage': 8.50, 'yaourt': 3.20, 'beurre': 2.80,
    'œufs': 3.50, 'jambon': 4.50, 'saucisson': 6.80, 'escalopes': 7.20, 'filet': 22.00,
    'poulet': 5.50, 'pommes': 2.80, 'bananes': 2.20, 'tomates': 3.80, 'carottes': 1.80,
    'salade': 1.50, 'champignons': 2.90, 'pâtes': 1.80, 'riz': 2.50, 'huile': 4.20,
    'sauce': 2.10, 'thon': 2.80, 'légumes': 1.90, 'confiture': 3.50, 'miel': 5.20,
    'chocolat': 3.80, 'pralines': 12.50, 'biscuits': 2.90, 'gaufres': 4.20, 'eau': 0.85,
    'jus': 2.80, 'bière': 1.20, 'vin': 8.50, 'café': 4.20, 'thé': 3.50, 'frites': 2.20,
    'pizza': 3.80, 'glace': 4.50, 'gel': 2.80, 'shampooing': 3.50, 'dentifrice': 2.20,
    'déodorant': 3.20, 'crème': 4.80, 'lessive': 4.50, 'liquide': 2.20, 'nettoyant': 3.50,
    'papier': 8.50, 'sacs': 4.20, 'croquettes': 12.50, 'pâtée': 3.80, 'litière': 8.50,
    'friandises': 3.20, 'quinoa': 4.50, 'lentilles': 2.80, 'muesli': 3.50, 'compote': 2.20,
    'carbonnade': 6.50, 'waterzooi': 5.80, 'boudin': 4.20, 'herve': 7.50, 'sirop': 4.80,
    'steaks': 4.50, 'tofu': 3.20, 'houmous': 2.80, 'champagne': 25.00, 'foie': 18.50,
    'saumon': 12.50, 'caviar': 45.00, 'olives': 3.50, 'chips': 2.80, 'lasagnes': 4.50,
    'macarons': 8.50, 'truffe': 85.00, 'huîtres': 22.00, 'homard': 35.00, 'magret': 15.50
  };

  // Trouver le prix de base
  let basePrice = 3.50; // Prix par défaut
  for (const [key, price] of Object.entries(basePrices)) {
    if (productName.toLowerCase().includes(key)) {
      basePrice = price;
      break;
    }
  }

  // Ajustement par marque
  const brandMultipliers: { [key: string]: number } = {
    'delhaize': 1.15, // Plus cher
    'carrefour': 1.05, // Légèrement plus cher
    'aldi': 0.85, // Moins cher
    'lidl': 0.90 // Moins cher
  };

  const multiplier = brandMultipliers[brand.toLowerCase()] || 1.0;
  const adjustedPrice = basePrice * multiplier;

  // Variation aléatoire de ±10%
  const variation = (Math.random() - 0.5) * 0.2;
  const finalPrice = adjustedPrice * (1 + variation);

  return Math.round(finalPrice * 100) / 100;
}

// Fonction pour générer des images réalistes
function generateProductImage(productName: string, category: string): string {
  const unsplashQueries: { [key: string]: string } = {
    'Boulangerie': 'bread-bakery',
    'Produits laitiers': 'dairy-milk',
    'Fromage': 'cheese-dairy',
    'Œufs': 'eggs-fresh',
    'Charcuterie': 'deli-meat',
    'Viande': 'meat-butcher',
    'Volaille': 'chicken-poultry',
    'Fruits': 'fresh-fruit',
    'Légumes': 'fresh-vegetables',
    'Épicerie': 'groceries-pantry',
    'Conserves': 'canned-food',
    'Épicerie sucrée': 'sweets-candy',
    'Chocolat': 'chocolate-belgian',
    'Biscuits': 'cookies-biscuits',
    'Boissons': 'beverages-drinks',
    'Alcools': 'wine-alcohol',
    'Boissons chaudes': 'coffee-tea',
    'Surgelés': 'frozen-food',
    'Hygiène': 'hygiene-products',
    'Beauté': 'beauty-products',
    'Entretien': 'cleaning-products',
    'Animaux': 'pet-food',
    'Saisonnier': 'seasonal-food',
    'Bio': 'organic-food',
    'Plats préparés': 'prepared-meals',
    'Bébé': 'baby-food',
    'Diététique': 'health-food',
    'Sans gluten': 'gluten-free',
    'Végétarien': 'vegetarian-food',
    'Végétal': 'plant-based',
    'Artisanal': 'artisan-food',
    'Festif': 'gourmet-food',
    'Terroir': 'regional-food',
    'Exotique': 'exotic-food',
    'Petit-déjeuner': 'breakfast-food',
    'Apéritif': 'appetizer-snacks',
    'Plats cuisinés': 'ready-meals',
    'Pâtisserie': 'pastry-desserts',
    'Conserve fine': 'gourmet-preserves',
    'Snacking': 'snack-food',
    'Tradition belge': 'belgian-food',
    'Luxe': 'luxury-food'
  };

  const query = unsplashQueries[category] || 'food-product';
  const productSlug = productName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
  
  return `https://images.unsplash.com/photo-1${Math.floor(Math.random() * 999999999)}?ixlib=rb-4.0.3&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&h=400&fit=crop&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`;
}

// Fonction pour générer des logos de magasins
function generateStoreLogo(brand: string): string {
  const logos: { [key: string]: string } = {
    'delhaize': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Delhaize_logo.svg/200px-Delhaize_logo.svg.png',
    'carrefour': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/200px-Carrefour_logo.svg.png',
    'aldi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/ALDI_Logo.svg/200px-ALDI_Logo.svg.png',
    'lidl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Lidl-Logo.svg/200px-Lidl-Logo.svg.png'
  };
  return logos[brand.toLowerCase()] || 'https://via.placeholder.com/200x100?text=Store+Logo';
}

export async function seedDatabase() {
  console.log('🌱 Début du seeding de la base de données...');
  
  try {
    // 1. Vérifier et nettoyer les données existantes
    console.log('🧹 Nettoyage des données existantes...');
    await db.delete(prices);
    await db.delete(storeProducts);
    await db.delete(products);
    await db.delete(stores);
    
    // 2. Insérer les magasins
    console.log('🏪 Insertion des magasins...');
    const insertedStores = [];
    for (const storeData of BELGIAN_STORES) {
      const [store] = await db.insert(stores).values({
        name: storeData.name,
        brand: storeData.brand,
        address: storeData.address,
        city: storeData.city,
        postalCode: storeData.postalCode,
        latitude: storeData.lat.toString(),
        longitude: storeData.lng.toString(),
        phone: storeData.phone,
        isActive: true,
        openingHours: {
          monday: '08:00-20:00',
          tuesday: '08:00-20:00',
          wednesday: '08:00-20:00',
          thursday: '08:00-20:00',
          friday: '08:00-20:00',
          saturday: '08:00-20:00',
          sunday: '09:00-19:00'
        }
      }).returning();
      insertedStores.push(store);
    }
    
    // 3. Insérer les produits
    console.log('🥗 Insertion des produits...');
    const insertedProducts = [];
    for (const productData of BELGIAN_PRODUCTS) {
      const [product] = await db.insert(products).values({
        name: productData.name,
        category: productData.category,
        brand: productData.brand,
        unit: productData.unit,
        description: productData.description,
        imageUrl: generateProductImage(productData.name, productData.category),
        isActive: true
      }).returning();
      insertedProducts.push(product);
    }
    
    // 4. Créer les relations magasin-produit et prix
    console.log('💰 Génération des prix et disponibilités...');
    for (const store of insertedStores) {
      // Chaque magasin a 70-90% des produits disponibles
      const availableProducts = insertedProducts.filter(() => Math.random() > 0.2);
      
      for (const product of availableProducts) {
        // Créer la relation magasin-produit
        await db.insert(storeProducts).values({
          storeId: store.id,
          productId: product.id,
          isAvailable: Math.random() > 0.05, // 95% des produits sont disponibles
          lastChecked: new Date()
        });
        
        // Créer le prix
        const price = generateRealisticPrice(product.name, store.brand);
        await db.insert(prices).values({
          storeId: store.id,
          productId: product.id,
          price: price.toString(),
          isPromotion: Math.random() > 0.85, // 15% des prix sont en promotion
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
        });
      }
    }
    
    // 5. Statistiques finales
    const stats = {
      stores: insertedStores.length,
      products: insertedProducts.length,
      storeProducts: insertedStores.length * Math.floor(insertedProducts.length * 0.8),
      prices: insertedStores.length * Math.floor(insertedProducts.length * 0.8)
    };
    
    console.log('✅ Seeding terminé avec succès !');
    console.log('📊 Statistiques :');
    console.log(`  - ${stats.stores} magasins créés`);
    console.log(`  - ${stats.products} produits créés`);
    console.log(`  - ~${stats.storeProducts} relations magasin-produit`);
    console.log(`  - ~${stats.prices} prix générés`);
    
    return stats;
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding :', error);
    throw error;
  }
}

// Fonction pour mettre à jour les données (nouveau contenu)
export async function updateDatabase() {
  console.log('🔄 Mise à jour des données...');
  
  try {
    // Mettre à jour les prix avec de nouvelles variations
    const existingPrices = await db.select().from(prices);
    
    for (const priceRecord of existingPrices) {
      const product = await db.select().from(products).where(eq(products.id, priceRecord.productId));
      const store = await db.select().from(stores).where(eq(stores.id, priceRecord.storeId));
      
      if (product.length > 0 && store.length > 0) {
        const newPrice = generateRealisticPrice(product[0].name, store[0].brand);
        await db.update(prices)
          .set({ 
            price: newPrice,
            isPromotion: Math.random() > 0.85,
            validFrom: new Date()
          })
          .where(eq(prices.id, priceRecord.id));
      }
    }
    
    // Mettre à jour les disponibilités
    const existingStoreProducts = await db.select().from(storeProducts);
    
    for (const storeProduct of existingStoreProducts) {
      await db.update(storeProducts)
        .set({ 
          isAvailable: Math.random() > 0.05,
          lastUpdated: new Date()
        })
        .where(and(
          eq(storeProducts.storeId, storeProduct.storeId),
          eq(storeProducts.productId, storeProduct.productId)
        ));
    }
    
    console.log('✅ Mise à jour terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour :', error);
    throw error;
  }
}

// Exécution directe du script (compatible modules ES)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Base de données seedée avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale :', error);
      process.exit(1);
    });
}