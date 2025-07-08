# Configuration Google Places API pour Pryce

## 📋 Étapes de Configuration

### 1. Obtenir une Clé API Google Places

1. **Accédez à Google Cloud Console** : https://console.cloud.google.com
2. **Créez un nouveau projet** (ou sélectionnez un projet existant)
3. **Activez l'API Google Places** :
   - Allez dans "API et services" → "Bibliothèque"
   - Recherchez "Places API" 
   - Cliquez sur "Places API" et "ACTIVER"
4. **Créez une clé API** :
   - Allez dans "API et services" → "Identifiants"
   - Cliquez sur "CRÉER DES IDENTIFIANTS" → "Clé API"
   - Copiez votre clé API

### 2. Configurer les Restrictions (Recommandé)

1. **Cliquez sur votre clé API** dans la liste des identifiants
2. **Restrictions d'applications** : Choisissez "Référents HTTP"
3. **Ajoutez vos domaines** :
   - `localhost:5000/*` (pour développement)
   - `*.replit.app/*` (pour production)
   - Votre domaine personnalisé si applicable
4. **Restrictions d'API** : Limitez à "Places API"

### 3. Configurer la Clé dans Pryce

1. **Connectez-vous à Pryce** avec votre compte administrateur
2. **Accédez au Panel Admin** : Profil → Administration
3. **Allez dans l'onglet Paramètres**
4. **Section "Configuration Google Maps"** :
   - Collez votre clé API dans le champ prévu
   - Cliquez sur "Vérifier" pour tester la clé
   - Cliquez sur "Sauvegarder" si la validation réussit

## 🏪 Comment Utiliser l'Ajout de Magasins

### Panel Admin - Onglet Magasins

1. **Accédez au Panel Admin** : `/admin`
2. **Onglet "Magasins"**
3. **Cliquer sur "Ajouter un magasin"**

### Méthodes d'Ajout

#### Option 1 : Recherche Google Places (Recommandée)
1. **Onglet "Recherche Google Places"**
2. **Tapez le nom du magasin** (ex: "Delhaize Bruxelles")
3. **Sélectionnez dans les suggestions** qui apparaissent
4. **Toutes les données sont automatiquement remplies** :
   - Nom exact du magasin
   - Adresse complète
   - Ville et code postal
   - Coordonnées GPS
   - Téléphone (si disponible)
   - Heures d'ouverture (si disponibles)
   - Note Google (si disponible)

#### Option 2 : Saisie Manuelle
1. **Onglet "Saisie manuelle"**
2. **Remplissez les champs** manuellement
3. **La géolocalisation est optionnelle**

### Détection Automatique des Marques

Le système détecte automatiquement les marques principales :
- **Aldi** : Magasins Aldi
- **Lidl** : Magasins Lidl  
- **Delhaize** : Delhaize, AD Delhaize, Proxy Delhaize
- **Carrefour** : Carrefour, Carrefour Express, Carrefour Market
- **Okay** : Magasins Okay

## 🔧 Fonctionnalités Avancées

### Calcul de Distance Automatique
- Les magasins sont triés par distance depuis votre position
- Affichage du badge de proximité (< 5km, < 10km, etc.)

### Import de Données Complètes
- **Adresse formatée** : Rue, ville, code postal
- **Coordonnées GPS** : Latitude/longitude précises
- **Informations business** : Téléphone, site web, heures
- **Données de qualité** : Note Google, avis clients

### Validation en Temps Réel
- **Vérification de la clé API** : Test automatique de validité
- **Détection de doublons** : Évite les magasins en double
- **Géocodage intelligent** : Conversion adresse → coordonnées

## 🚨 Dépannage

### Clé API Non Fonctionnelle
1. **Vérifiez que l'API Places est activée** dans Google Cloud Console
2. **Contrôlez les restrictions** de domaine
3. **Assurez-vous que la facturation est activée** (Google exige une carte bancaire)

### Aucune Suggestion n'Apparaît
1. **Tapez au moins 3 caractères**
2. **Vérifiez votre connexion internet**
3. **Regardez la console** pour les erreurs (F12)

### Géolocalisation Bloquée
1. **Autorisez la géolocalisation** dans votre navigateur
2. **La fonctionnalité reste disponible** sans géolocalisation
3. **Position par défaut** : Bruxelles, Belgique

## 💰 Coûts Google Places API

- **Recherche de lieux** : 0,032€ par requête (1000 requêtes gratuites/mois)
- **Détails de lieu** : 0,017€ par requête  
- **Crédits gratuits** : 200€/mois offerts par Google
- **Usage typique** : ~50-100 requêtes/jour = largement dans la limite gratuite

## 📞 Support

Si vous rencontrez des problèmes :
1. **Vérifiez ce guide** en premier
2. **Consultez les logs** dans la console développeur (F12)
3. **Testez votre clé API** dans la section Paramètres
4. **Contactez l'équipe** si le problème persiste

---

✅ **Votre application est maintenant configurée pour utiliser Google Places API avec l'ID administrateur 44753612**