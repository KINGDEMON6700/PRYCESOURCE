// Base de données exhaustive des magasins belges par ville
export interface StoreTemplate {
  name: string;
  brand: string;
  address: string;
  city: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
}

export const belgianStoreDatabase: Record<string, StoreTemplate[]> = {
  // BRUXELLES
  bruxelles: [
    // Delhaize
    { name: "Delhaize Bruxelles Centre", brand: "delhaize", address: "Rue Neuve 120", city: "Bruxelles", postalCode: "1000", latitude: 50.8503, longitude: 4.3517 },
    { name: "Delhaize Bruxelles Toison d'Or", brand: "delhaize", address: "Avenue de la Toison d'Or 8", city: "Bruxelles", postalCode: "1050", latitude: 50.8267, longitude: 4.3591 },
    { name: "Delhaize Bruxelles Ixelles", brand: "delhaize", address: "Chaussée d'Ixelles 167", city: "Bruxelles", postalCode: "1050", latitude: 50.8274, longitude: 4.3645 },
    { name: "Delhaize Bruxelles Louise", brand: "delhaize", address: "Avenue Louise 235", city: "Bruxelles", postalCode: "1050", latitude: 50.8244, longitude: 4.3556 },
    { name: "Delhaize Bruxelles Uccle", brand: "delhaize", address: "Chaussée de Waterloo 1480", city: "Bruxelles", postalCode: "1180", latitude: 50.8035, longitude: 4.3393 },
    { name: "Delhaize Bruxelles Etterbeek", brand: "delhaize", address: "Avenue des Casernes 15", city: "Bruxelles", postalCode: "1040", latitude: 50.8275, longitude: 4.3882 },
    { name: "Delhaize Bruxelles Schaerbeek", brand: "delhaize", address: "Place Meiser 23", city: "Bruxelles", postalCode: "1030", latitude: 50.8597, longitude: 4.3717 },
    { name: "Delhaize Bruxelles Anderlecht", brand: "delhaize", address: "Rue de Fiennes 86", city: "Bruxelles", postalCode: "1070", latitude: 50.8365, longitude: 4.3139 },
    { name: "Delhaize Bruxelles Woluwe", brand: "delhaize", address: "Avenue Georges Henri 404", city: "Bruxelles", postalCode: "1200", latitude: 50.8543, longitude: 4.4324 },
    { name: "Delhaize Bruxelles Jette", brand: "delhaize", address: "Boulevard de Smet de Naeyer 145", city: "Bruxelles", postalCode: "1090", latitude: 50.8794, longitude: 4.3236 },
    
    // Carrefour
    { name: "Carrefour Bruxelles Toison d'Or", brand: "carrefour", address: "Avenue de la Toison d'Or 15", city: "Bruxelles", postalCode: "1050", latitude: 50.8267, longitude: 4.3591 },
    { name: "Carrefour Bruxelles Evere", brand: "carrefour", address: "Chaussée de Louvain 948", city: "Bruxelles", postalCode: "1140", latitude: 50.8697, longitude: 4.4054 },
    { name: "Carrefour Bruxelles Docks", brand: "carrefour", address: "Place des Armateurs 1", city: "Bruxelles", postalCode: "1000", latitude: 50.8617, longitude: 4.3520 },
    { name: "Carrefour Bruxelles Uccle", brand: "carrefour", address: "Chaussée de Waterloo 1518", city: "Bruxelles", postalCode: "1180", latitude: 50.8023, longitude: 4.3381 },
    { name: "Carrefour Express Bruxelles Sablon", brand: "carrefour", address: "Rue de la Régence 47", city: "Bruxelles", postalCode: "1000", latitude: 50.8404, longitude: 4.3580 },
    { name: "Carrefour Express Bruxelles Louise", brand: "carrefour", address: "Avenue Louise 54", city: "Bruxelles", postalCode: "1050", latitude: 50.8358, longitude: 4.3584 },
    
    // Aldi
    { name: "Aldi Bruxelles Molière", brand: "aldi", address: "Chaussée de Charleroi 132", city: "Bruxelles", postalCode: "1060", latitude: 50.8263, longitude: 4.3342 },
    { name: "Aldi Bruxelles Ixelles", brand: "aldi", address: "Rue de la Paix 47", city: "Bruxelles", postalCode: "1050", latitude: 50.8296, longitude: 4.3668 },
    { name: "Aldi Bruxelles Schaerbeek", brand: "aldi", address: "Chaussée de Helmet 290", city: "Bruxelles", postalCode: "1030", latitude: 50.8679, longitude: 4.3825 },
    { name: "Aldi Bruxelles Anderlecht", brand: "aldi", address: "Rue du Chimiste 34", city: "Bruxelles", postalCode: "1070", latitude: 50.8344, longitude: 4.3085 },
    { name: "Aldi Bruxelles Uccle", brand: "aldi", address: "Chaussée d'Alsemberg 808", city: "Bruxelles", postalCode: "1180", latitude: 50.7973, longitude: 4.3364 },
    
    // Lidl
    { name: "Lidl Bruxelles Flagey", brand: "lidl", address: "Place Eugène Flagey 18", city: "Bruxelles", postalCode: "1050", latitude: 50.8275, longitude: 4.3722 },
    { name: "Lidl Bruxelles Midi", brand: "lidl", address: "Rue de France 2", city: "Bruxelles", postalCode: "1060", latitude: 50.8356, longitude: 4.3364 },
    { name: "Lidl Bruxelles Etterbeek", brand: "lidl", address: "Chaussée de Wavre 1015", city: "Bruxelles", postalCode: "1160", latitude: 50.8226, longitude: 4.4096 },
    { name: "Lidl Bruxelles Schaerbeek", brand: "lidl", address: "Rue Royale Sainte-Marie 214", city: "Bruxelles", postalCode: "1030", latitude: 50.8679, longitude: 4.3751 },
    { name: "Lidl Bruxelles Jette", brand: "lidl", address: "Avenue de Jette 255", city: "Bruxelles", postalCode: "1090", latitude: 50.8821, longitude: 4.3285 },
    
    // Colruyt
    { name: "Colruyt Bruxelles Uccle", brand: "colruyt", address: "Chaussée de Waterloo 1514", city: "Bruxelles", postalCode: "1180", latitude: 50.8025, longitude: 4.3383 },
    { name: "Colruyt Bruxelles Evere", brand: "colruyt", address: "Chaussée de Louvain 944", city: "Bruxelles", postalCode: "1140", latitude: 50.8695, longitude: 4.4052 },
    { name: "Colruyt Bruxelles Anderlecht", brand: "colruyt", address: "Rue du Chimiste 30", city: "Bruxelles", postalCode: "1070", latitude: 50.8346, longitude: 4.3087 },
  ],

  // ANVERS
  anvers: [
    // Delhaize
    { name: "Delhaize Anvers Central", brand: "delhaize", address: "Meir 78", city: "Anvers", postalCode: "2000", latitude: 51.2194, longitude: 4.4025 },
    { name: "Delhaize Anvers Berchem", brand: "delhaize", address: "Grote Steenweg 200", city: "Anvers", postalCode: "2600", latitude: 51.1945, longitude: 4.4205 },
    { name: "Delhaize Anvers Wilrijk", brand: "delhaize", address: "Boomsesteenweg 65", city: "Anvers", postalCode: "2610", latitude: 51.1693, longitude: 4.3955 },
    { name: "Delhaize Anvers Hoboken", brand: "delhaize", address: "Kioskplaats 16", city: "Anvers", postalCode: "2660", latitude: 51.1744, longitude: 4.3508 },
    { name: "Delhaize Anvers Deurne", brand: "delhaize", address: "Turnhoutsebaan 282", city: "Anvers", postalCode: "2100", latitude: 51.2344, longitude: 4.4634 },
    
    // Carrefour
    { name: "Carrefour Anvers Groenplaats", brand: "carrefour", address: "Groenplaats 21", city: "Anvers", postalCode: "2000", latitude: 51.2201, longitude: 4.4009 },
    { name: "Carrefour Anvers Shopping Stadsfeestzaal", brand: "carrefour", address: "Meir 78", city: "Anvers", postalCode: "2000", latitude: 51.2194, longitude: 4.4025 },
    { name: "Carrefour Express Anvers Centraal", brand: "carrefour", address: "Koningin Astridplein 27", city: "Anvers", postalCode: "2018", latitude: 51.2173, longitude: 4.4213 },
    
    // Aldi
    { name: "Aldi Anvers Berchem", brand: "aldi", address: "Grote Steenweg 204", city: "Anvers", postalCode: "2600", latitude: 51.1945, longitude: 4.4205 },
    { name: "Aldi Anvers Merksem", brand: "aldi", address: "Bredabaan 902", city: "Anvers", postalCode: "2170", latitude: 51.2543, longitude: 4.4454 },
    { name: "Aldi Anvers Hoboken", brand: "aldi", address: "Kioskplaats 12", city: "Anvers", postalCode: "2660", latitude: 51.1742, longitude: 4.3506 },
    
    // Lidl
    { name: "Lidl Anvers Wilrijk", brand: "lidl", address: "Boomsesteenweg 67", city: "Anvers", postalCode: "2610", latitude: 51.1693, longitude: 4.3955 },
    { name: "Lidl Anvers Borgerhout", brand: "lidl", address: "Turnhoutsebaan 110", city: "Anvers", postalCode: "2140", latitude: 51.2186, longitude: 4.4334 },
    { name: "Lidl Anvers Ekeren", brand: "lidl", address: "Kapelsesteenweg 520", city: "Anvers", postalCode: "2180", latitude: 51.2854, longitude: 4.4237 },
  ],

  // GAND
  gand: [
    // Delhaize
    { name: "Delhaize Gand Korenmarkt", brand: "delhaize", address: "Korenmarkt 16", city: "Gand", postalCode: "9000", latitude: 51.0543, longitude: 3.7174 },
    { name: "Delhaize Gand Zuid", brand: "delhaize", address: "Woodrow Wilsonplein 2", city: "Gand", postalCode: "9000", latitude: 51.0355, longitude: 3.7105 },
    { name: "Delhaize Gand Gentbrugge", brand: "delhaize", address: "Brusselsesteenweg 347", city: "Gand", postalCode: "9050", latitude: 51.0319, longitude: 3.7621 },
    { name: "Delhaize Gand Mariakerke", brand: "delhaize", address: "Hogeweg 218", city: "Gand", postalCode: "9030", latitude: 51.0834, longitude: 3.6834 },
    
    // Carrefour
    { name: "Carrefour Gand Zuid", brand: "carrefour", address: "Woodrow Wilsonplein 4", city: "Gand", postalCode: "9000", latitude: 51.0355, longitude: 3.7105 },
    { name: "Carrefour Express Gand Korenmarkt", brand: "carrefour", address: "Korenmarkt 12", city: "Gand", postalCode: "9000", latitude: 51.0541, longitude: 3.7172 },
    
    // Aldi
    { name: "Aldi Gand Dampoort", brand: "aldi", address: "Dampoortstraat 15", city: "Gand", postalCode: "9000", latitude: 51.0613, longitude: 3.7416 },
    { name: "Aldi Gand Ledeberg", brand: "aldi", address: "Hundelgemsesteenweg 395", city: "Gand", postalCode: "9050", latitude: 51.0234, longitude: 3.7654 },
    { name: "Aldi Gand Mariakerke", brand: "aldi", address: "Hogeweg 214", city: "Gand", postalCode: "9030", latitude: 51.0832, longitude: 3.6832 },
    
    // Lidl
    { name: "Lidl Gand Rabot", brand: "lidl", address: "Rabotstraat 100", city: "Gand", postalCode: "9000", latitude: 51.0634, longitude: 3.7234 },
    { name: "Lidl Gand Sint-Amandsberg", brand: "lidl", address: "Antwerpsesteenweg 367", city: "Gand", postalCode: "9040", latitude: 51.0734, longitude: 3.7534 },
  ],

  // LIÈGE
  liege: [
    // Delhaize
    { name: "Delhaize Liège Centre", brand: "delhaize", address: "Rue de la Cathédrale 85", city: "Liège", postalCode: "4000", latitude: 50.6426, longitude: 5.5740 },
    { name: "Delhaize Liège Guillemins", brand: "delhaize", address: "Place des Guillemins 2", city: "Liège", postalCode: "4000", latitude: 50.6246, longitude: 5.5672 },
    { name: "Delhaize Liège Sclessin", brand: "delhaize", address: "Rue de Sclessin 57", city: "Liège", postalCode: "4000", latitude: 50.6147, longitude: 5.5391 },
    { name: "Delhaize Liège Angleur", brand: "delhaize", address: "Rue Jauniaux 47", city: "Liège", postalCode: "4031", latitude: 50.5987, longitude: 5.6134 },
    
    // Carrefour
    { name: "Carrefour Liège Médiacité", brand: "carrefour", address: "Boulevard Raymond Poincaré 7", city: "Liège", postalCode: "4020", latitude: 50.6310, longitude: 5.5687 },
    { name: "Carrefour Express Liège Cathédrale", brand: "carrefour", address: "Place de la Cathédrale 32", city: "Liège", postalCode: "4000", latitude: 50.6424, longitude: 5.5738 },
    
    // Aldi
    { name: "Aldi Liège Sclessin", brand: "aldi", address: "Rue de Sclessin 61", city: "Liège", postalCode: "4000", latitude: 50.6145, longitude: 5.5389 },
    { name: "Aldi Liège Bressoux", brand: "aldi", address: "Quai du Halage 15", city: "Liège", postalCode: "4020", latitude: 50.6534, longitude: 5.5987 },
    { name: "Aldi Liège Rocourt", brand: "aldi", address: "Rue Saint-Lambert 234", city: "Liège", postalCode: "4000", latitude: 50.6654, longitude: 5.5434 },
    
    // Lidl
    { name: "Lidl Liège Sclessin", brand: "lidl", address: "Rue de Sclessin 59", city: "Liège", postalCode: "4000", latitude: 50.6145, longitude: 5.5389 },
    { name: "Lidl Liège Bressoux", brand: "lidl", address: "Quai du Halage 13", city: "Liège", postalCode: "4020", latitude: 50.6532, longitude: 5.5985 },
    { name: "Lidl Liège Seraing", brand: "lidl", address: "Rue du Pairay 123", city: "Liège", postalCode: "4100", latitude: 50.6034, longitude: 5.5234 },
  ],

  // CHARLEROI
  charleroi: [
    // Delhaize
    { name: "Delhaize Charleroi Centre", brand: "delhaize", address: "Boulevard Tirou 167", city: "Charleroi", postalCode: "6000", latitude: 50.4108, longitude: 4.4446 },
    { name: "Delhaize Charleroi Marcinelle", brand: "delhaize", address: "Chaussée de Lodelinsart 179", city: "Charleroi", postalCode: "6001", latitude: 50.3982, longitude: 4.4161 },
    { name: "Delhaize Charleroi Gilly", brand: "delhaize", address: "Chaussée de Fleurus 567", city: "Charleroi", postalCode: "6060", latitude: 50.4234, longitude: 4.4987 },
    
    // Carrefour
    { name: "Carrefour Charleroi Ville 2", brand: "carrefour", address: "Boulevard Tirou 132", city: "Charleroi", postalCode: "6000", latitude: 50.4118, longitude: 4.4439 },
    { name: "Carrefour Charleroi Gosselies", brand: "carrefour", address: "Chaussée de Bruxelles 135", city: "Charleroi", postalCode: "6041", latitude: 50.4687, longitude: 4.4587 },
    
    // Aldi
    { name: "Aldi Charleroi Marcinelle", brand: "aldi", address: "Chaussée de Lodelinsart 181", city: "Charleroi", postalCode: "6001", latitude: 50.3980, longitude: 4.4159 },
    { name: "Aldi Charleroi Gilly", brand: "aldi", address: "Chaussée de Fleurus 565", city: "Charleroi", postalCode: "6060", latitude: 50.4232, longitude: 4.4985 },
    { name: "Aldi Charleroi Montignies", brand: "aldi", address: "Rue de Montignies 234", city: "Charleroi", postalCode: "6000", latitude: 50.4234, longitude: 4.4654 },
    
    // Lidl
    { name: "Lidl Charleroi Gilly", brand: "lidl", address: "Chaussée de Fleurus 563", city: "Charleroi", postalCode: "6060", latitude: 50.4230, longitude: 4.4983 },
    { name: "Lidl Charleroi Gosselies", brand: "lidl", address: "Chaussée de Bruxelles 133", city: "Charleroi", postalCode: "6041", latitude: 50.4685, longitude: 4.4585 },
  ],

  // MONS
  mons: [
    // Delhaize
    { name: "Delhaize Mons Centre", brand: "delhaize", address: "Rue de Nimy 7", city: "Mons", postalCode: "7000", latitude: 50.4542, longitude: 3.9516 },
    { name: "Delhaize Mons Grands Prés", brand: "delhaize", address: "Avenue du Tir 75", city: "Mons", postalCode: "7000", latitude: 50.4663, longitude: 3.9246 },
    { name: "Delhaize Mons Jemappes", brand: "delhaize", address: "Rue de l'Enseignement 4", city: "Mons", postalCode: "7012", latitude: 50.4485, longitude: 3.8876 },
    
    // Carrefour
    { name: "Carrefour Mons Grands Prés", brand: "carrefour", address: "Avenue du Tir 77", city: "Mons", postalCode: "7000", latitude: 50.4661, longitude: 3.9244 },
    { name: "Carrefour Express Mons Centre", brand: "carrefour", address: "Grand-Place 22", city: "Mons", postalCode: "7000", latitude: 50.4534, longitude: 3.9524 },
    
    // Aldi
    { name: "Aldi Mons Jemappes", brand: "aldi", address: "Rue de l'Enseignement 6", city: "Mons", postalCode: "7012", latitude: 50.4487, longitude: 3.8878 },
    { name: "Aldi Mons Cuesmes", brand: "aldi", address: "Rue de la Station 87", city: "Mons", postalCode: "7033", latitude: 50.4387, longitude: 3.9123 },
    
    // Lidl
    { name: "Lidl Mons Jemappes", brand: "lidl", address: "Rue de l'Enseignement 2", city: "Mons", postalCode: "7012", latitude: 50.4483, longitude: 3.8874 },
    { name: "Lidl Mons Quaregnon", brand: "lidl", address: "Avenue Eugène Dufaux 234", city: "Mons", postalCode: "7390", latitude: 50.4367, longitude: 3.8734 },
  ],

  // NAMUR
  namur: [
    // Delhaize
    { name: "Delhaize Namur Centre", brand: "delhaize", address: "Rue de Fer 87", city: "Namur", postalCode: "5000", latitude: 50.4674, longitude: 4.8720 },
    { name: "Delhaize Namur Les Moulins", brand: "delhaize", address: "Chaussée de Liège 623", city: "Namur", postalCode: "5100", latitude: 50.4799, longitude: 4.8535 },
    { name: "Delhaize Namur Salzinnes", brand: "delhaize", address: "Chaussée de Dinant 234", city: "Namur", postalCode: "5000", latitude: 50.4534, longitude: 4.8534 },
    
    // Carrefour
    { name: "Carrefour Namur Les Moulins", brand: "carrefour", address: "Chaussée de Liège 625", city: "Namur", postalCode: "5100", latitude: 50.4797, longitude: 4.8533 },
    { name: "Carrefour Express Namur Centre", brand: "carrefour", address: "Place de l'Ange 15", city: "Namur", postalCode: "5000", latitude: 50.4672, longitude: 4.8718 },
    
    // Aldi
    { name: "Aldi Namur Salzinnes", brand: "aldi", address: "Chaussée de Dinant 236", city: "Namur", postalCode: "5000", latitude: 50.4532, longitude: 4.8532 },
    { name: "Aldi Namur Jambes", brand: "aldi", address: "Avenue Jean Materne 178", city: "Namur", postalCode: "5100", latitude: 50.4634, longitude: 4.8487 },
    
    // Lidl
    { name: "Lidl Namur Salzinnes", brand: "lidl", address: "Chaussée de Dinant 232", city: "Namur", postalCode: "5000", latitude: 50.4530, longitude: 4.8530 },
    { name: "Lidl Namur Belgrade", brand: "lidl", address: "Chaussée de Waterloo 567", city: "Namur", postalCode: "5000", latitude: 50.4787, longitude: 4.8434 },
  ],

  // BRUGES
  bruges: [
    // Delhaize
    { name: "Delhaize Bruges Centre", brand: "delhaize", address: "Noordzandstraat 4", city: "Bruges", postalCode: "8000", latitude: 51.2093, longitude: 3.2247 },
    { name: "Delhaize Bruges Sint-Pieters", brand: "delhaize", address: "Sint-Pieterskaai 58", city: "Bruges", postalCode: "8000", latitude: 51.2031, longitude: 3.2193 },
    { name: "Delhaize Bruges Sint-Michiels", brand: "delhaize", address: "Gistelsesteenweg 567", city: "Bruges", postalCode: "8200", latitude: 51.1834, longitude: 3.1987 },
    
    // Carrefour
    { name: "Carrefour Bruges Sint-Pieters", brand: "carrefour", address: "Sint-Pieterskaai 60", city: "Bruges", postalCode: "8000", latitude: 51.2029, longitude: 3.2191 },
    { name: "Carrefour Express Bruges Markt", brand: "carrefour", address: "Wollestraat 25", city: "Bruges", postalCode: "8000", latitude: 51.2087, longitude: 3.2267 },
    
    // Aldi
    { name: "Aldi Bruges Sint-Michiels", brand: "aldi", address: "Gistelsesteenweg 565", city: "Bruges", postalCode: "8200", latitude: 51.1832, longitude: 3.1985 },
    { name: "Aldi Bruges Sint-Andries", brand: "aldi", address: "Koning Albert I-laan 165", city: "Bruges", postalCode: "8200", latitude: 51.1987, longitude: 3.2134 },
    
    // Lidl
    { name: "Lidl Bruges Sint-Michiels", brand: "lidl", address: "Gistelsesteenweg 563", city: "Bruges", postalCode: "8200", latitude: 51.1830, longitude: 3.1983 },
    { name: "Lidl Bruges Assebroek", brand: "lidl", address: "Steenweg op Oostkamp 187", city: "Bruges", postalCode: "8310", latitude: 51.2234, longitude: 3.2654 },
  ],

  // LOUVAIN
  louvain: [
    // Delhaize
    { name: "Delhaize Louvain Bondgenotenlaan", brand: "delhaize", address: "Bondgenotenlaan 84", city: "Louvain", postalCode: "3000", latitude: 50.8798, longitude: 4.7005 },
    { name: "Delhaize Louvain Tiensestraat", brand: "delhaize", address: "Tiensestraat 89", city: "Louvain", postalCode: "3000", latitude: 50.8734, longitude: 4.7087 },
    { name: "Delhaize Louvain Heverlee", brand: "delhaize", address: "Naamsesteenweg 345", city: "Louvain", postalCode: "3001", latitude: 50.8587, longitude: 4.6987 },
    
    // Carrefour
    { name: "Carrefour Louvain Ring", brand: "carrefour", address: "Diestsesteenweg 92", city: "Louvain", postalCode: "3000", latitude: 50.8909, longitude: 4.7213 },
    { name: "Carrefour Express Louvain Oude Markt", brand: "carrefour", address: "Oude Markt 15", city: "Louvain", postalCode: "3000", latitude: 50.8787, longitude: 4.7003 },
    
    // Aldi
    { name: "Aldi Louvain Heverlee", brand: "aldi", address: "Naamsesteenweg 347", city: "Louvain", postalCode: "3001", latitude: 50.8585, longitude: 4.6985 },
    { name: "Aldi Louvain Kessel-Lo", brand: "aldi", address: "Diestsesteenweg 234", city: "Louvain", postalCode: "3010", latitude: 50.8934, longitude: 4.7234 },
    
    // Lidl
    { name: "Lidl Louvain Heverlee", brand: "lidl", address: "Naamsesteenweg 343", city: "Louvain", postalCode: "3001", latitude: 50.8583, longitude: 4.6983 },
    { name: "Lidl Louvain Wilsele", brand: "lidl", address: "Aarschotsesteenweg 145", city: "Louvain", postalCode: "3012", latitude: 50.9087, longitude: 4.7234 },
  ],

  // Autres villes importantes
  hasselt: [
    { name: "Delhaize Hasselt Centre", brand: "delhaize", address: "Grote Markt 45", city: "Hasselt", postalCode: "3500", latitude: 50.9307, longitude: 5.3378 },
    { name: "Carrefour Hasselt", brand: "carrefour", address: "Thonissenlaan 62", city: "Hasselt", postalCode: "3500", latitude: 50.9234, longitude: 5.3234 },
    { name: "Aldi Hasselt", brand: "aldi", address: "Kempische Steenweg 123", city: "Hasselt", postalCode: "3500", latitude: 50.9187, longitude: 5.3187 },
    { name: "Lidl Hasselt", brand: "lidl", address: "Gouverneur Verwilghensingel 45", city: "Hasselt", postalCode: "3500", latitude: 50.9345, longitude: 5.3345 },
  ],

  mechelen: [
    { name: "Delhaize Mechelen Centre", brand: "delhaize", address: "Grote Markt 23", city: "Mechelen", postalCode: "2800", latitude: 51.0259, longitude: 4.4777 },
    { name: "Carrefour Mechelen", brand: "carrefour", address: "Battelsesteenweg 455", city: "Mechelen", postalCode: "2800", latitude: 51.0134, longitude: 4.4634 },
    { name: "Aldi Mechelen", brand: "aldi", address: "Leuvensesteenweg 234", city: "Mechelen", postalCode: "2800", latitude: 51.0187, longitude: 4.4787 },
    { name: "Lidl Mechelen", brand: "lidl", address: "Hombeeksesteenweg 87", city: "Mechelen", postalCode: "2800", latitude: 51.0345, longitude: 4.4845 },
  ],

  turnhout: [
    { name: "Delhaize Turnhout Centre", brand: "delhaize", address: "Grote Markt 34", city: "Turnhout", postalCode: "2300", latitude: 51.3227, longitude: 4.9426 },
    { name: "Carrefour Turnhout", brand: "carrefour", address: "Steenweg op Merksplas 67", city: "Turnhout", postalCode: "2300", latitude: 51.3134, longitude: 4.9334 },
    { name: "Aldi Turnhout", brand: "aldi", address: "Wapenstraat 123", city: "Turnhout", postalCode: "2300", latitude: 51.3187, longitude: 4.9387 },
    { name: "Lidl Turnhout", brand: "lidl", address: "Otterstraat 234", city: "Turnhout", postalCode: "2300", latitude: 51.3245, longitude: 4.9445 },
  ],

  oostende: [
    { name: "Delhaize Oostende Centre", brand: "delhaize", address: "Kapellestraat 87", city: "Oostende", postalCode: "8400", latitude: 51.2287, longitude: 2.9187 },
    { name: "Carrefour Oostende", brand: "carrefour", address: "Torhoutsesteenweg 634", city: "Oostende", postalCode: "8400", latitude: 51.2134, longitude: 2.8934 },
    { name: "Aldi Oostende", brand: "aldi", address: "Nieuwpoortsesteenweg 456", city: "Oostende", postalCode: "8400", latitude: 51.2045, longitude: 2.8845 },
    { name: "Lidl Oostende", brand: "lidl", address: "Stuiverstraat 234", city: "Oostende", postalCode: "8400", latitude: 51.2187, longitude: 2.9087 },
  ],

  aalst: [
    { name: "Delhaize Aalst Centre", brand: "delhaize", address: "Grote Markt 56", city: "Aalst", postalCode: "9300", latitude: 50.9378, longitude: 4.0403 },
    { name: "Carrefour Aalst", brand: "carrefour", address: "Erembodegem-Dorp 123", city: "Aalst", postalCode: "9300", latitude: 50.9234, longitude: 4.0234 },
    { name: "Aldi Aalst", brand: "aldi", address: "Dendermondsesteenweg 234", city: "Aalst", postalCode: "9300", latitude: 50.9187, longitude: 4.0187 },
    { name: "Lidl Aalst", brand: "lidl", address: "Kattestraat 87", city: "Aalst", postalCode: "9300", latitude: 50.9345, longitude: 4.0345 },
  ],

  kortrijk: [
    { name: "Delhaize Kortrijk Centre", brand: "delhaize", address: "Grote Markt 67", city: "Kortrijk", postalCode: "8500", latitude: 50.8298, longitude: 3.2692 },
    { name: "Carrefour Kortrijk", brand: "carrefour", address: "President Kennedypark 10", city: "Kortrijk", postalCode: "8500", latitude: 50.8134, longitude: 3.2534 },
    { name: "Aldi Kortrijk", brand: "aldi", address: "Doorniksesteenweg 234", city: "Kortrijk", postalCode: "8500", latitude: 50.8187, longitude: 3.2587 },
    { name: "Lidl Kortrijk", brand: "lidl", address: "Broelkaai 87", city: "Kortrijk", postalCode: "8500", latitude: 50.8245, longitude: 3.2645 },
  ],
};

// Base de données Fast-Foods et autres commerces
export const fastFoodAndRetailDatabase: Record<string, StoreTemplate[]> = {
  // BRUXELLES - Fast Foods
  bruxelles: [
    // McDonald's
    { name: "McDonald's Bruxelles Central Station", brand: "mcdonalds", address: "Gare Centrale", city: "Bruxelles", postalCode: "1000", latitude: 50.8459, longitude: 4.3571 },
    { name: "McDonald's Bruxelles Toison d'Or", brand: "mcdonalds", address: "Avenue de la Toison d'Or 8", city: "Bruxelles", postalCode: "1050", latitude: 50.8267, longitude: 4.3591 },
    { name: "McDonald's Bruxelles Louise", brand: "mcdonalds", address: "Porte de Namur 38", city: "Bruxelles", postalCode: "1050", latitude: 50.8369, longitude: 4.3624 },
    { name: "McDonald's Bruxelles Rogier", brand: "mcdonalds", address: "Place Eugène Flagey 18", city: "Bruxelles", postalCode: "1210", latitude: 50.8587, longitude: 4.3634 },
    { name: "McDonald's Bruxelles Westland", brand: "mcdonalds", address: "Boulevard Sylvain Dupuis 315", city: "Bruxelles", postalCode: "1070", latitude: 50.8234, longitude: 4.3024 },
    
    // Quick
    { name: "Quick Bruxelles Gare du Midi", brand: "quick", address: "Avenue Fonsny 47B", city: "Bruxelles", postalCode: "1060", latitude: 50.8356, longitude: 4.3364 },
    { name: "Quick Bruxelles City 2", brand: "quick", address: "Rue Neuve 123", city: "Bruxelles", postalCode: "1000", latitude: 50.8503, longitude: 4.3517 },
    { name: "Quick Bruxelles Docks", brand: "quick", address: "Place des Armateurs 1", city: "Bruxelles", postalCode: "1000", latitude: 50.8617, longitude: 4.3520 },
    { name: "Quick Bruxelles Ixelles", brand: "quick", address: "Chaussée d'Ixelles 234", city: "Bruxelles", postalCode: "1050", latitude: 50.8274, longitude: 4.3645 },
    
    // Burger King
    { name: "Burger King Bruxelles Central", brand: "burgerking", address: "Boulevard Adolphe Max 7", city: "Bruxelles", postalCode: "1000", latitude: 50.8523, longitude: 4.3547 },
    { name: "Burger King Bruxelles Louise", brand: "burgerking", address: "Avenue Louise 162", city: "Bruxelles", postalCode: "1050", latitude: 50.8289, longitude: 4.3577 },
    { name: "Burger King Bruxelles Westland", brand: "burgerking", address: "Boulevard Sylvain Dupuis 317", city: "Bruxelles", postalCode: "1070", latitude: 50.8236, longitude: 4.3026 },
    
    // KFC
    { name: "KFC Bruxelles Central", brand: "kfc", address: "Rue Neuve 111", city: "Bruxelles", postalCode: "1000", latitude: 50.8501, longitude: 4.3515 },
    { name: "KFC Bruxelles Toison d'Or", brand: "kfc", address: "Avenue de la Toison d'Or 10", city: "Bruxelles", postalCode: "1050", latitude: 50.8265, longitude: 4.3589 },
    { name: "KFC Bruxelles Evere", brand: "kfc", address: "Chaussée de Louvain 950", city: "Bruxelles", postalCode: "1140", latitude: 50.8699, longitude: 4.4056 },
    
    // Subway
    { name: "Subway Bruxelles Central", brand: "subway", address: "Rue du Marché aux Herbes 90", city: "Bruxelles", postalCode: "1000", latitude: 50.8467, longitude: 4.3539 },
    { name: "Subway Bruxelles Louise", brand: "subway", address: "Avenue Louise 240", city: "Bruxelles", postalCode: "1050", latitude: 50.8246, longitude: 4.3558 },
    { name: "Subway Bruxelles Ixelles", brand: "subway", address: "Chaussée d'Ixelles 145", city: "Bruxelles", postalCode: "1050", latitude: 50.8272, longitude: 4.3643 },
    
    // Pizza Hut
    { name: "Pizza Hut Bruxelles Centre", brand: "pizzahut", address: "Rue de la Montagne 52", city: "Bruxelles", postalCode: "1000", latitude: 50.8445, longitude: 4.3565 },
    { name: "Pizza Hut Bruxelles Uccle", brand: "pizzahut", address: "Chaussée de Waterloo 1490", city: "Bruxelles", postalCode: "1180", latitude: 50.8037, longitude: 4.3395 },
    
    // Domino's Pizza
    { name: "Domino's Pizza Bruxelles Centre", brand: "dominos", address: "Rue des Bouchers 17", city: "Bruxelles", postalCode: "1000", latitude: 50.8473, longitude: 4.3545 },
    { name: "Domino's Pizza Bruxelles Ixelles", brand: "dominos", address: "Chaussée d'Ixelles 187", city: "Bruxelles", postalCode: "1050", latitude: 50.8276, longitude: 4.3647 },
    { name: "Domino's Pizza Bruxelles Uccle", brand: "dominos", address: "Chaussée de Waterloo 1485", city: "Bruxelles", postalCode: "1180", latitude: 50.8033, longitude: 4.3391 },
    
    // Pharmacies
    { name: "Pharmacie du Centre", brand: "pharmacie", address: "Rue Neuve 87", city: "Bruxelles", postalCode: "1000", latitude: 50.8498, longitude: 4.3512 },
    { name: "Pharmacie Louise", brand: "pharmacie", address: "Avenue Louise 198", city: "Bruxelles", postalCode: "1050", latitude: 50.8267, longitude: 4.3569 },
    { name: "Pharmacie Ixelles", brand: "pharmacie", address: "Chaussée d'Ixelles 123", city: "Bruxelles", postalCode: "1050", latitude: 50.8269, longitude: 4.3640 },
    
    // Boulangeries
    { name: "Paul Bruxelles Central", brand: "paul", address: "Rue de la Montagne 17", city: "Bruxelles", postalCode: "1000", latitude: 50.8442, longitude: 4.3562 },
    { name: "Paul Bruxelles Gare Centrale", brand: "paul", address: "Gare Centrale", city: "Bruxelles", postalCode: "1000", latitude: 50.8457, longitude: 4.3569 },
    { name: "Délifrance Bruxelles Toison d'Or", brand: "delifrance", address: "Avenue de la Toison d'Or 12", city: "Bruxelles", postalCode: "1050", latitude: 50.8269, longitude: 4.3593 },
    
    // Stations Service
    { name: "Shell Bruxelles Louise", brand: "shell", address: "Avenue Louise 289", city: "Bruxelles", postalCode: "1050", latitude: 50.8221, longitude: 4.3541 },
    { name: "Total Bruxelles Ixelles", brand: "total", address: "Chaussée d'Ixelles 267", city: "Bruxelles", postalCode: "1050", latitude: 50.8282, longitude: 4.3655 },
    { name: "Q8 Bruxelles Uccle", brand: "q8", address: "Chaussée de Waterloo 1520", city: "Bruxelles", postalCode: "1180", latitude: 50.8025, longitude: 4.3385 },
    
    // Magasins de vêtements
    { name: "H&M Bruxelles Rue Neuve", brand: "hm", address: "Rue Neuve 56", city: "Bruxelles", postalCode: "1000", latitude: 50.8495, longitude: 4.3509 },
    { name: "Zara Bruxelles Avenue Louise", brand: "zara", address: "Avenue Louise 71", city: "Bruxelles", postalCode: "1050", latitude: 50.8351, longitude: 4.3581 },
    { name: "C&A Bruxelles City 2", brand: "ca", address: "Rue Neuve 123", city: "Bruxelles", postalCode: "1000", latitude: 50.8503, longitude: 4.3517 },
  ],

  // ANVERS - Fast Foods
  anvers: [
    // McDonald's
    { name: "McDonald's Anvers Central", brand: "mcdonalds", address: "Meir 89", city: "Anvers", postalCode: "2000", latitude: 51.2196, longitude: 4.4027 },
    { name: "McDonald's Anvers Groenplaats", brand: "mcdonalds", address: "Groenplaats 5", city: "Anvers", postalCode: "2000", latitude: 51.2199, longitude: 4.4007 },
    { name: "McDonald's Anvers Berchem", brand: "mcdonalds", address: "Grote Steenweg 195", city: "Anvers", postalCode: "2600", latitude: 51.1943, longitude: 4.4203 },
    
    // Quick
    { name: "Quick Anvers Meir", brand: "quick", address: "Meir 102", city: "Anvers", postalCode: "2000", latitude: 51.2198, longitude: 4.4029 },
    { name: "Quick Anvers Berchem", brand: "quick", address: "Grote Steenweg 198", city: "Anvers", postalCode: "2600", latitude: 51.1947, longitude: 4.4207 },
    
    // Burger King
    { name: "Burger King Anvers Central", brand: "burgerking", address: "Koningin Astridplein 5", city: "Anvers", postalCode: "2018", latitude: 51.2171, longitude: 4.4211 },
    
    // KFC
    { name: "KFC Anvers Meir", brand: "kfc", address: "Meir 65", city: "Anvers", postalCode: "2000", latitude: 51.2192, longitude: 4.4023 },
    
    // Subway
    { name: "Subway Anvers Central", brand: "subway", address: "Koningin Astridplein 12", city: "Anvers", postalCode: "2018", latitude: 51.2169, longitude: 4.4209 },
    
    // Autres commerces
    { name: "H&M Anvers Meir", brand: "hm", address: "Meir 45", city: "Anvers", postalCode: "2000", latitude: 51.2189, longitude: 4.4020 },
    { name: "Zara Anvers Meir", brand: "zara", address: "Meir 67", city: "Anvers", postalCode: "2000", latitude: 51.2193, longitude: 4.4024 },
    { name: "Shell Anvers Berchem", brand: "shell", address: "Grote Steenweg 245", city: "Anvers", postalCode: "2600", latitude: 51.1952, longitude: 4.4212 },
  ],

  // GAND - Fast Foods
  gand: [
    // McDonald's
    { name: "McDonald's Gand Veldstraat", brand: "mcdonalds", address: "Veldstraat 67", city: "Gand", postalCode: "9000", latitude: 51.0556, longitude: 3.7223 },
    { name: "McDonald's Gand Zuid", brand: "mcdonalds", address: "Woodrow Wilsonplein 6", city: "Gand", postalCode: "9000", latitude: 51.0357, longitude: 3.7107 },
    
    // Quick
    { name: "Quick Gand Korenmarkt", brand: "quick", address: "Korenmarkt 7", city: "Gand", postalCode: "9000", latitude: 51.0541, longitude: 3.7172 },
    
    // Burger King
    { name: "Burger King Gand Zuid", brand: "burgerking", address: "Woodrow Wilsonplein 8", city: "Gand", postalCode: "9000", latitude: 51.0359, longitude: 3.7109 },
    
    // KFC
    { name: "KFC Gand Veldstraat", brand: "kfc", address: "Veldstraat 89", city: "Gand", postalCode: "9000", latitude: 51.0558, longitude: 3.7225 },
    
    // Autres commerces
    { name: "H&M Gand Veldstraat", brand: "hm", address: "Veldstraat 34", city: "Gand", postalCode: "9000", latitude: 51.0553, longitude: 3.7220 },
    { name: "Zara Gand Veldstraat", brand: "zara", address: "Veldstraat 56", city: "Gand", postalCode: "9000", latitude: 51.0555, longitude: 3.7222 },
  ],

  // LIÈGE - Fast Foods
  liege: [
    // McDonald's
    { name: "McDonald's Liège Médiacité", brand: "mcdonalds", address: "Boulevard Raymond Poincaré 9", city: "Liège", postalCode: "4020", latitude: 50.6312, longitude: 5.5689 },
    { name: "McDonald's Liège Centre", brand: "mcdonalds", address: "Rue de la Cathédrale 67", city: "Liège", postalCode: "4000", latitude: 50.6424, longitude: 5.5736 },
    
    // Quick
    { name: "Quick Liège Médiacité", brand: "quick", address: "Boulevard Raymond Poincaré 11", city: "Liège", postalCode: "4020", latitude: 50.6314, longitude: 5.5691 },
    
    // Burger King
    { name: "Burger King Liège Guillemins", brand: "burgerking", address: "Place des Guillemins 4", city: "Liège", postalCode: "4000", latitude: 50.6248, longitude: 5.5674 },
    
    // KFC
    { name: "KFC Liège Centre", brand: "kfc", address: "Rue de la Cathédrale 89", city: "Liège", postalCode: "4000", latitude: 50.6428, longitude: 5.5742 },
    
    // Autres commerces
    { name: "H&M Liège Médiacité", brand: "hm", address: "Boulevard Raymond Poincaré 7", city: "Liège", postalCode: "4020", latitude: 50.6308, longitude: 5.5685 },
  ],

  // CHARLEROI - Fast Foods
  charleroi: [
    // McDonald's
    { name: "McDonald's Charleroi Ville 2", brand: "mcdonalds", address: "Boulevard Tirou 134", city: "Charleroi", postalCode: "6000", latitude: 50.4120, longitude: 4.4441 },
    { name: "McDonald's Charleroi Gosselies", brand: "mcdonalds", address: "Chaussée de Bruxelles 137", city: "Charleroi", postalCode: "6041", latitude: 50.4689, longitude: 4.4589 },
    
    // Quick
    { name: "Quick Charleroi Ville 2", brand: "quick", address: "Boulevard Tirou 136", city: "Charleroi", postalCode: "6000", latitude: 50.4122, longitude: 4.4443 },
    
    // Burger King
    { name: "Burger King Charleroi Gosselies", brand: "burgerking", address: "Chaussée de Bruxelles 139", city: "Charleroi", postalCode: "6041", latitude: 50.4691, longitude: 4.4591 },
    
    // KFC
    { name: "KFC Charleroi Centre", brand: "kfc", address: "Boulevard Tirou 169", city: "Charleroi", postalCode: "6000", latitude: 50.4110, longitude: 4.4448 },
  ],

  // MONS - Fast Foods
  mons: [
    // McDonald's
    { name: "McDonald's Mons Grands Prés", brand: "mcdonalds", address: "Avenue du Tir 79", city: "Mons", postalCode: "7000", latitude: 50.4665, longitude: 3.9248 },
    { name: "McDonald's Mons Centre", brand: "mcdonalds", address: "Grand-Place 12", city: "Mons", postalCode: "7000", latitude: 50.4532, longitude: 3.9522 },
    
    // Quick
    { name: "Quick Mons Grands Prés", brand: "quick", address: "Avenue du Tir 81", city: "Mons", postalCode: "7000", latitude: 50.4667, longitude: 3.9250 },
    
    // Burger King
    { name: "Burger King Mons Centre", brand: "burgerking", address: "Grand-Place 14", city: "Mons", postalCode: "7000", latitude: 50.4534, longitude: 3.9524 },
    
    // KFC
    { name: "KFC Mons Grands Prés", brand: "kfc", address: "Avenue du Tir 83", city: "Mons", postalCode: "7000", latitude: 50.4669, longitude: 3.9252 },
  ],

  // NAMUR - Fast Foods
  namur: [
    // McDonald's
    { name: "McDonald's Namur Les Moulins", brand: "mcdonalds", address: "Chaussée de Liège 627", city: "Namur", postalCode: "5100", latitude: 50.4801, longitude: 4.8537 },
    { name: "McDonald's Namur Centre", brand: "mcdonalds", address: "Place de l'Ange 12", city: "Namur", postalCode: "5000", latitude: 50.4670, longitude: 4.8716 },
    
    // Quick
    { name: "Quick Namur Les Moulins", brand: "quick", address: "Chaussée de Liège 629", city: "Namur", postalCode: "5100", latitude: 50.4803, longitude: 4.8539 },
    
    // Burger King
    { name: "Burger King Namur Centre", brand: "burgerking", address: "Place de l'Ange 14", city: "Namur", postalCode: "5000", latitude: 50.4672, longitude: 4.8718 },
    
    // KFC
    { name: "KFC Namur Les Moulins", brand: "kfc", address: "Chaussée de Liège 631", city: "Namur", postalCode: "5100", latitude: 50.4805, longitude: 4.8541 },
  ],
};

// Fonction pour rechercher dans toute la base de données (supermarchés + fast-foods + commerces)
export function searchBelgianStores(query: string): StoreTemplate[] {
  const searchTerm = query.toLowerCase();
  const results: StoreTemplate[] = [];
  
  // Recherche dans les supermarchés
  Object.values(belgianStoreDatabase).forEach(cityStores => {
    cityStores.forEach(store => {
      if (
        store.name.toLowerCase().includes(searchTerm) ||
        store.city.toLowerCase().includes(searchTerm) ||
        store.brand.toLowerCase().includes(searchTerm) ||
        store.address.toLowerCase().includes(searchTerm) ||
        store.postalCode.includes(searchTerm)
      ) {
        results.push(store);
      }
    });
  });
  
  // Recherche dans les fast-foods et autres commerces
  Object.values(fastFoodAndRetailDatabase).forEach(cityStores => {
    cityStores.forEach(store => {
      if (
        store.name.toLowerCase().includes(searchTerm) ||
        store.city.toLowerCase().includes(searchTerm) ||
        store.brand.toLowerCase().includes(searchTerm) ||
        store.address.toLowerCase().includes(searchTerm) ||
        store.postalCode.includes(searchTerm)
      ) {
        results.push(store);
      }
    });
  });
  
  // Trier par pertinence (nom exact > début du nom > contient le nom)
  return results.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    
    // Correspondance exacte du nom
    if (aName === searchTerm && bName !== searchTerm) return -1;
    if (bName === searchTerm && aName !== searchTerm) return 1;
    
    // Début du nom
    if (aName.startsWith(searchTerm) && !bName.startsWith(searchTerm)) return -1;
    if (bName.startsWith(searchTerm) && !aName.startsWith(searchTerm)) return 1;
    
    // Ordre alphabétique par défaut
    return aName.localeCompare(bName);
  });
}

// Fonction pour obtenir les magasins par ville
export function getStoresByCity(city: string): StoreTemplate[] {
  const cityKey = city.toLowerCase().replace(/[^a-z]/g, '');
  return belgianStoreDatabase[cityKey] || [];
}

// Fonction pour obtenir les magasins par marque
export function getStoresByBrand(brand: string): StoreTemplate[] {
  const results: StoreTemplate[] = [];
  const brandKey = brand.toLowerCase();
  
  Object.values(belgianStoreDatabase).forEach(cityStores => {
    cityStores.forEach(store => {
      if (store.brand === brandKey) {
        results.push(store);
      }
    });
  });
  
  return results;
}