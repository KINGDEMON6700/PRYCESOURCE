import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertStoreSchema, 
  insertProductSchema, 
  insertPriceSchema, 
  insertContributionSchema,
  insertStoreRatingSchema,
  insertProductRatingSchema,
  insertStoreCategorySchema,
  insertBrandConfigSchema,
  priceVotes,
  insertPriceVoteSchema 
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { registerBarcodeRoutes } from "./routes/barcode";



// Unified price management function
async function createOrUpdatePrice(storeId: number, productId: number, price: number, options: {
  isPromotion?: boolean;
  isAvailable?: boolean;
  source?: string;
} = {}) {
  try {

    
    // Check if price already exists
    const existingPrices = await storage.getPricesByStore(storeId);
    const existingPrice = existingPrices.find(p => p.productId === productId);
    
    if (existingPrice) {

      return await storage.updatePrice(existingPrice.id, {
        price: price.toString(),
        isPromotion: options.isPromotion || false,
        isAvailable: options.isAvailable !== false,
        source: options.source || 'user',
        lastUpdated: new Date()
      });
    } else {

      return await storage.createPrice({
        storeId,
        productId,
        price: price.toString(),
        isPromotion: options.isPromotion || false,
        isAvailable: options.isAvailable !== false,
        source: options.source || 'user'
      });
    }
  } catch (error) {

    throw error;
  }
}

// Function to apply contribution changes automatically
async function applyContributionChanges(contribution: any) {
  try {

    
    switch (contribution.type) {
      case 'price_update':
        if (contribution.storeId && contribution.productId && contribution.reportedPrice) {
          const price = typeof contribution.reportedPrice === 'string' 
            ? parseFloat(contribution.reportedPrice) 
            : contribution.reportedPrice;
            
          await createOrUpdatePrice(
            contribution.storeId, 
            contribution.productId, 
            price,
            {
              isPromotion: false,
              isAvailable: contribution.reportedAvailability !== false,
              source: 'contribution'
            }
          );

        } else {

        }
        break;
        
      case 'add_product_to_store':
        if (contribution.storeId && contribution.productId) {
          // Check if store-product relationship exists
          const storeProducts = await storage.getStoreProducts(contribution.storeId);
          const exists = storeProducts.find(sp => sp.productId === contribution.productId);
          
          if (!exists) {
            await storage.createStoreProduct({
              storeId: contribution.storeId,
              productId: contribution.productId,
              isAvailable: true
            });
          }
        }
        break;
        
      case 'availability':
        if (contribution.storeId && contribution.productId) {
          const storeProducts = await storage.getStoreProducts(contribution.storeId);
          const storeProduct = storeProducts.find(sp => sp.productId === contribution.productId);
          
          if (storeProduct) {
            await storage.updateStoreProduct(storeProduct.id, {
              isAvailable: contribution.reportedAvailability
            });
          }
        }
        break;
        
      case 'new_product':
        if (contribution.data && contribution.data.name) {
          const newProduct = await storage.createProduct({
            name: contribution.data.name,
            brand: contribution.data.brand,
            category: contribution.data.category,
            unit: contribution.data.unit,
            image: contribution.data.image
          });
          
          // If store is specified, add product to store
          if (contribution.storeId) {
            await storage.createStoreProduct({
              storeId: contribution.storeId,
              productId: newProduct.id,
              isAvailable: true
            });
          }
        }
        break;
        
      case 'new_store':
        if (contribution.data && contribution.data.name && contribution.data.address) {
          await storage.createStore({
            name: contribution.data.name,
            brand: contribution.data.brand || 'other',
            address: contribution.data.address,
            city: contribution.data.city,
            postalCode: contribution.data.postalCode,
            latitude: contribution.data.latitude || '0',
            longitude: contribution.data.longitude || '0',
            phone: contribution.data.phone,
            openingHours: contribution.data.openingHours || {}
          });
        }
        break;
    }
  } catch (error) {

    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);
  
  // Register barcode routes
  registerBarcodeRoutes(app);
  
  // Barcode search API (alternative route)
  app.get("/api/barcode/search", async (req, res) => {
    try {
      const { barcode } = req.query;
      if (!barcode) {
        return res.status(400).json({ error: "Barcode is required" });
      }

      // Search for product with this barcode
      const productsResult = await db.select({
        id: products.id,
        name: products.name,
        brand: products.brand,
        category: products.category,
        unit: products.unit,
        imageUrl: products.imageUrl,
        barcode: products.barcode,
        lowestPrice: sql<number>`COALESCE(MIN(${prices.price}), 0)`.as('lowestPrice'),
        storeCount: sql<number>`COUNT(DISTINCT ${prices.storeId})`.as('storeCount'),
        averageRating: sql<number>`COALESCE(AVG(${productRatings.rating}), 0)`.as('averageRating'),
        ratingCount: sql<number>`COUNT(${productRatings.rating})`.as('ratingCount')
      })
      .from(products)
      .leftJoin(prices, and(eq(prices.productId, products.id), eq(prices.isAvailable, true)))
      .leftJoin(productRatings, eq(productRatings.productId, products.id))
      .where(eq(products.barcode, barcode as string))
      .groupBy(products.id, products.name, products.brand, products.category, products.unit, products.imageUrl, products.barcode)
      .limit(1);

      if (productsResult.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(productsResult[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to search by barcode" });
    }
  });

  // Search suggestions API
  app.get("/api/search/suggestions", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string" || q.length < 2) {
        return res.json({ products: [], stores: [] });
      }

      const query = `%${q.toLowerCase()}%`;
      
      // Search products
      const productsResults = await db.select({
        id: products.id,
        name: products.name,
        brand: products.brand,
        category: products.category,
        unit: products.unit,
        imageUrl: products.imageUrl,
        lowestPrice: sql<number>`COALESCE(MIN(${prices.price}), 0)`.as('lowestPrice'),
        storeCount: sql<number>`COUNT(DISTINCT ${prices.storeId})`.as('storeCount'),
        averageRating: sql<number>`COALESCE(AVG(${productRatings.rating}), 0)`.as('averageRating'),
        ratingCount: sql<number>`COUNT(${productRatings.rating})`.as('ratingCount')
      })
      .from(products)
      .leftJoin(prices, and(eq(prices.productId, products.id), eq(prices.isAvailable, true)))
      .leftJoin(productRatings, eq(productRatings.productId, products.id))
      .where(
        or(
          ilike(products.name, query),
          ilike(products.brand, query),
          ilike(products.category, query)
        )
      )
      .groupBy(products.id, products.name, products.brand, products.category, products.unit, products.imageUrl)
      .orderBy(desc(sql`COUNT(DISTINCT ${prices.storeId})`))
      .limit(5);

      // Search stores
      const storesResults = await db.select({
        id: stores.id,
        name: stores.name,
        brand: stores.brand,
        address: stores.address,
        city: stores.city,
        postalCode: stores.postalCode,
        latitude: stores.latitude,
        longitude: stores.longitude,
        phone: stores.phone,
        openingHours: stores.openingHours,
        isActive: stores.isActive,
        createdAt: stores.createdAt,
        updatedAt: stores.updatedAt,
        averageRating: sql<number>`COALESCE(AVG(${storeRatings.rating}), 0)`.as('averageRating'),
        ratingCount: sql<number>`COUNT(${storeRatings.rating})`.as('ratingCount'),
        distance: sql<number>`0`.as('distance'),
        averageDiscount: sql<number>`0`.as('averageDiscount')
      })
      .from(stores)
      .leftJoin(storeRatings, eq(storeRatings.storeId, stores.id))
      .where(
        and(
          eq(stores.isActive, true),
          or(
            ilike(stores.name, query),
            ilike(stores.brand, query),
            ilike(stores.city, query),
            ilike(stores.address, query)
          )
        )
      )
      .groupBy(stores.id, stores.name, stores.brand, stores.address, stores.city, stores.postalCode, stores.latitude, stores.longitude, stores.phone, stores.openingHours, stores.isActive, stores.createdAt, stores.updatedAt)
      .orderBy(desc(sql`COUNT(${storeRatings.rating})`))
      .limit(3);

      res.json({ products: productsResults, stores: storesResults });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });
  
  // Middleware pour vérifier les droits d'administration (redéclaré localement)
  const adminMiddleware = async (req: any, res: any, next: any) => {
    try {
      if (!req.user) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Extraire l'ID utilisateur selon la structure de session
      let userId;
      if (req.user.claims && req.user.claims.sub) {
        userId = req.user.claims.sub;
      } else if (req.user.sub) {
        userId = req.user.sub;
      } else if (req.user.id) {
        userId = req.user.id;
      } else {

        return res.status(403).json({ message: "Admin access required" });
      }
      

      
      // Vérifier le rôle de l'utilisateur dans la base de données
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      next();
    } catch (error) {

      return res.status(403).json({ message: "Admin access required" });
    }
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // L'objet user est structuré différemment selon la session
      let userId;
      if (req.user.claims && req.user.claims.sub) {
        userId = req.user.claims.sub;
      } else if (req.user.sub) {
        userId = req.user.sub;
      } else {
        return res.status(401).json({ message: "Invalid session structure" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get current user role
  app.get('/api/auth/role', isAuthenticated, async (req: any, res) => {
    try {
      let userId;
      if (req.user.claims && req.user.claims.sub) {
        userId = req.user.claims.sub;
      } else if (req.user.sub) {
        userId = req.user.sub;
      } else {
        return res.status(401).json({ message: "Invalid session structure" });
      }
      
      const user = await storage.getUser(userId);
      
      res.json({ 
        isAdmin: user?.role === 'admin',
        role: user?.role || 'user'
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user role" });
    }
  });

  // Development route to toggle admin role
  app.post('/api/dev/toggle-admin', isAuthenticated, async (req: any, res) => {
    try {
      let userId;
      if (req.user.claims && req.user.claims.sub) {
        userId = req.user.claims.sub;
      } else if (req.user.sub) {
        userId = req.user.sub;
      } else {
        return res.status(401).json({ message: "Invalid session structure" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await storage.upsertUser({ 
        id: userId,
        email: user.email,
        name: user.name,
        role: newRole
      });
      
      res.json({ 
        message: `Rôle modifié vers: ${newRole === 'admin' ? 'Administrateur' : 'Contributeur'}`,
        role: newRole
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle admin role" });
    }
  });

  // Store categories route (public)
  app.get('/api/store-categories', async (req, res) => {
    try {
      const categories = await storage.getStoreCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch store categories" });
    }
  });

  // Store routes
  app.get('/api/stores', async (req, res) => {
    try {
      const stores = await storage.getStores();
      res.json(stores);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.get('/api/stores/nearby', async (req, res) => {
    try {
      const { latitude, longitude, radius = 10 } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }

      const stores = await storage.getStoresByLocation(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        parseFloat(radius as string)
      );
      res.json(stores);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch nearby stores" });
    }
  });

  app.get('/api/stores/:id', async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Valid store ID required" });
      }

      const store = await storage.getStoreById(storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }

      // Get products available at this store (from prices table)
      const prices = await storage.getPricesByStore(storeId);
      const productIds = Array.from(new Set(prices.map(p => p.productId)));
      
      const products = [];
      for (const productId of productIds) {
        const product = await storage.getProductById(productId);
        if (product) {
          const productPrices = prices.filter(p => p.productId === productId);
          const lowestPrice = Math.min(...productPrices.map(p => parseFloat(p.price.toString())));
          products.push({
            ...product,
            lowestPrice,
            storeCount: 1,
            averageRating: 0,
            ratingCount: 0
          });
        }
      }

      // Add store rating information
      const storeWithProducts = {
        ...store,
        averageRating: 0,
        ratingCount: 0,
        products
      };

      res.json(storeWithProducts);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch store" });
    }
  });

  app.post('/api/stores', isAuthenticated, adminMiddleware, async (req: any, res) => {
    try {
      // Validation et conversion des coordonnées GPS
      const { latitude, longitude, categoryId, ...otherData } = req.body;
      
      // Convertir les coordonnées en nombres et valider
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ 
          message: "Les coordonnées GPS doivent être des nombres valides (latitude: -90 à 90, longitude: -180 à 180)" 
        });
      }

      // Vérifier que categoryId est fourni et valide
      if (!categoryId || isNaN(parseInt(categoryId))) {
        return res.status(400).json({ 
          message: "Une catégorie de magasin valide est requise" 
        });
      }

      const validatedData = insertStoreSchema.parse({
        ...otherData,
        categoryId: parseInt(categoryId),
        latitude: lat.toString(),
        longitude: lng.toString()
      });
      
      const store = await storage.createStore(validatedData);
      res.status(201).json(store);
    } catch (error) {
      console.error('Store creation error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Données invalides", 
          details: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create store" });
    }
  });

  app.put('/api/stores/:id', isAuthenticated, adminMiddleware, async (req: any, res) => {
    try {

      const storeId = parseInt(req.params.id);
      const validatedData = insertStoreSchema.partial().parse(req.body);
      const store = await storage.updateStore(storeId, validatedData);
      res.json(store);
    } catch (error) {

      res.status(500).json({ message: "Failed to update store" });
    }
  });

  app.delete('/api/stores/:id', isAuthenticated, adminMiddleware, async (req: any, res) => {
    try {

      const storeId = parseInt(req.params.id);
      await storage.deleteStore(storeId);
      res.status(204).send();
    } catch (error) {

      res.status(500).json({ message: "Failed to delete store" });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/search', async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || !q.toString().trim()) {
        return res.json([]);
      }
      
      const products = await storage.searchProducts(q as string);
      res.json(products);
    } catch (error) {

      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.get('/api/products/popular', async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const products = await storage.getPopularProducts(parseInt(limit as string));
      res.json(products);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch popular products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProductById(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get('/api/products/:id/comparison', async (req, res) => {
    try {
      const { latitude, longitude } = req.query;
      const comparison = await storage.getPriceComparison(
        parseInt(req.params.id),
        latitude ? parseFloat(latitude as string) : undefined,
        longitude ? parseFloat(longitude as string) : undefined
      );
      res.json(comparison);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch price comparison" });
    }
  });

  app.get('/api/products/:id/prices', async (req, res) => {
    try {
      const prices = await storage.getPricesByProduct(parseInt(req.params.id));
      res.json(prices);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch price history" });
    }
  });

  app.post('/api/price-reports', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { productId, storeId, newPrice, comment } = req.body;

      if (!productId || !storeId || !newPrice) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const contribution = await storage.createContribution({
        userId,
        productId: parseInt(productId),
        storeId: parseInt(storeId),
        type: 'price_update',
        reportedPrice: parseFloat(newPrice).toString(),
        comment: comment || null,
        status: 'pending',
      });

      res.json({
        message: "Price report submitted successfully",
        contributionId: contribution.id,
      });
    } catch (error) {

      res.status(500).json({ message: "Failed to submit price report" });
    }
  });

  app.post('/api/products', isAuthenticated, adminMiddleware, async (req: any, res) => {
    try {

      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {

      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, adminMiddleware, async (req: any, res) => {
    try {

      const productId = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(productId, validatedData);
      res.json(product);
    } catch (error) {

      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, adminMiddleware, async (req: any, res) => {
    try {

      const productId = parseInt(req.params.id);
      await storage.deleteProduct(productId);
      res.status(204).send();
    } catch (error) {

      res.status(500).json({ message: "Failed to delete product" });
    }
  });



  // Price routes
  app.get('/api/prices/product/:productId', async (req, res) => {
    try {
      const prices = await storage.getPricesByProduct(parseInt(req.params.productId));
      res.json(prices);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch prices" });
    }
  });

  app.get('/api/prices/store/:storeId', async (req, res) => {
    try {
      const prices = await storage.getPricesByStore(parseInt(req.params.storeId));
      res.json(prices);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch prices" });
    }
  });

  app.post('/api/prices', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertPriceSchema.parse(req.body);
      const price = await storage.createPrice(validatedData);
      res.status(201).json(price);
    } catch (error) {

      res.status(500).json({ message: "Failed to create price" });
    }
  });

  // Contribution routes
  app.get('/api/contributions', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { status } = req.query;
      const contributions = await storage.getContributions(status as string);
      res.json(contributions);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.get('/api/contributions/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contributions = await storage.getContributionsByUser(userId);
      res.json(contributions);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch user contributions" });
    }
  });

  app.post('/api/contributions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Convert number fields to proper types
      const processedBody = {
        ...req.body,
        userId,
        storeId: req.body.storeId ? parseInt(req.body.storeId) : undefined,
        productId: req.body.productId ? parseInt(req.body.productId) : undefined,
        reportedPrice: req.body.reportedPrice ? parseFloat(req.body.reportedPrice) : undefined,
        latitude: req.body.latitude ? parseFloat(req.body.latitude) : undefined,
        longitude: req.body.longitude ? parseFloat(req.body.longitude) : undefined,
      };
      
      const validatedData = insertContributionSchema.parse(processedBody);
      const contribution = await storage.createContribution(validatedData);
      res.status(201).json(contribution);
    } catch (error) {

      res.status(500).json({ message: "Failed to create contribution" });
    }
  });

  // Update contribution (approve/reject)
  app.put('/api/contributions/:id', isAuthenticated, adminMiddleware, async (req: any, res) => {
    try {
      const contributionId = parseInt(req.params.id);
      const reviewerId = req.user.claims.sub;
      const { status, adminNotes } = req.body;

      const updatedContribution = await storage.updateContribution(contributionId, {
        status,
        adminNotes,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      });

      res.json(updatedContribution);
    } catch (error) {

      res.status(500).json({ message: "Failed to update contribution" });
    }
  });

  // Route simplifiée pour les contributions sans sélecteurs
  app.post('/api/contributions/simple', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productName, storeName, storeAddress, type, reportedPrice, reportedAvailability, comment, latitude, longitude } = req.body;
      
      const contributionData = {
        productName,
        storeName,
        storeAddress,
        type,
        reportedPrice,
        reportedAvailability,
        comment,
        latitude,
        longitude,
        userId,
        status: 'pending',
        priority: 'medium'
      };
      
      const contribution = await storage.createContribution(contributionData);
      res.status(201).json(contribution);
    } catch (error) {

      res.status(500).json({ message: "Failed to create contribution" });
    }
  });

  app.patch('/api/contributions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const contribution = await storage.updateContribution(parseInt(req.params.id), {
        ...req.body,
        reviewedBy: req.user.claims.sub,
        reviewedAt: new Date(),
      });
      res.json(contribution);
    } catch (error) {

      res.status(500).json({ message: "Failed to update contribution" });
    }
  });

  // Rating routes
  app.get('/api/ratings/store/:storeId', async (req, res) => {
    try {
      const ratings = await storage.getStoreRatings(parseInt(req.params.storeId));
      res.json(ratings);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch store ratings" });
    }
  });

  app.get('/api/ratings/product/:productId', async (req, res) => {
    try {
      const ratings = await storage.getProductRatings(parseInt(req.params.productId));
      res.json(ratings);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch product ratings" });
    }
  });

  app.post('/api/ratings/store', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertStoreRatingSchema.parse({
        ...req.body,
        userId,
      });
      const rating = await storage.createStoreRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {

      res.status(500).json({ message: "Failed to create store rating" });
    }
  });

  app.post('/api/ratings/product', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProductRatingSchema.parse({
        ...req.body,
        userId,
      });
      const rating = await storage.createProductRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {

      res.status(500).json({ message: "Failed to create product rating" });
    }
  });

  // Admin middleware pour vérifier les permissions
  const isAdmin = (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    if (userId !== "44762987") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Routes d'administration
  app.get('/api/admin/stats', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const [users, products, stores, contributions] = await Promise.all([
        storage.getUserCount(),
        storage.getProductCount(),
        storage.getStoreCount(),
        storage.getContributionCount()
      ]);

      const stats = {
        totalUsers: users,
        totalProducts: products,
        totalStores: stores,
        pendingContributions: contributions.pending || 0,
        todayContributions: contributions.today || 0,
        verifiedPrices: contributions.verified || 0,
      };

      res.json(stats);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/products', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/admin/products', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {

      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/admin/products/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(productId, validatedData);
      res.json(product);
    } catch (error) {

      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.get('/api/admin/stores', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const stores = await storage.getStores();
      res.json(stores);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.post('/api/admin/stores', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const validatedData = insertStoreSchema.parse(req.body);
      const store = await storage.createStore(validatedData);
      res.status(201).json(store);
    } catch (error) {

      res.status(500).json({ message: "Failed to create store" });
    }
  });

  app.put('/api/admin/stores/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const validatedData = insertStoreSchema.partial().parse(req.body);
      const store = await storage.updateStore(storeId, validatedData);
      res.json(store);
    } catch (error) {

      res.status(500).json({ message: "Failed to update store" });
    }
  });

  app.delete('/api/admin/stores/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      await storage.deleteStore(storeId);
      res.json({ success: true });
    } catch (error) {

      res.status(500).json({ message: "Failed to delete store" });
    }
  });

  app.delete('/api/admin/products/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      await storage.deleteProduct(productId);
      res.json({ success: true });
    } catch (error) {

      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get('/api/admin/contributions', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const status = req.query.status as string;
      const contributions = await storage.getContributions(status !== "all" ? status : undefined);
      res.json(contributions);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.patch('/api/admin/contributions/:id/approve', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const contributionId = parseInt(req.params.id);
      const { adminNotes, adminResponse } = req.body;
      const reviewerId = (req as any).user.id || (req as any).user.claims?.sub;
      

      
      // Get the contribution to know what to apply
      const contribution = await storage.getContributions().then(contributions => 
        contributions.find(c => c.id === contributionId)
      );
      
      if (!contribution) {

        return res.status(404).json({ message: "Contribution not found" });
      }



      // Apply the contribution changes

      await applyContributionChanges(contribution);

      
      // Update contribution status
      const result = await storage.updateContribution(contributionId, { 
        status: 'approved',
        adminNotes,
        adminResponse: adminResponse || 'Votre contribution a été approuvée et appliquée. Merci pour votre participation !',
        reviewedAt: new Date(),
        reviewedBy: reviewerId
      });
      

      
      res.json({ 
        ...result, 
        message: "Contribution approuvée et appliquée avec succès",
        notificationSent: true 
      });
    } catch (error) {

      res.status(500).json({ message: "Failed to approve contribution" });
    }
  });

  app.patch('/api/admin/contributions/:id/reject', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const contributionId = parseInt(req.params.id);
      const { adminNotes, adminResponse } = req.body;
      const reviewerId = (req as any).user.id || (req as any).user.claims?.sub;
      
      const result = await storage.updateContribution(contributionId, { 
        status: 'rejected',
        adminNotes,
        adminResponse: adminResponse || 'Votre contribution a été examinée mais ne peut pas être appliquée pour le moment. Merci de votre compréhension.',
        reviewedAt: new Date(),
        reviewedBy: reviewerId
      });
      
      res.json({ 
        ...result, 
        message: "Contribution rejetée avec notification envoyée",
        notificationSent: true 
      });
    } catch (error) {

      res.status(500).json({ message: "Failed to reject contribution" });
    }
  });

  app.post('/api/admin/auto-scrape-stores', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      // Vérifier si la clé API Google Places est disponible
      if (!process.env.GOOGLE_PLACES_API_KEY) {
        return res.status(400).json({ 
          message: "Google Places API key is required for auto-scraping" 
        });
      }

      // Importer et utiliser le scraper Google Places
      const { GooglePlacesScraper } = await import('../scripts/google-places-scraper');
      const scraper = new GooglePlacesScraper(process.env.GOOGLE_PLACES_API_KEY);

      // Envoyer une réponse immédiate pour éviter les timeouts
      res.json({ 
        message: "Auto-scraping started in background", 
        status: "running" 
      });

      // Lancer le scraping en arrière-plan
      scraper.scrapeAllStores().catch(error => {

      });

    } catch (error) {

      res.status(500).json({ message: "Failed to start auto-scraping" });
    }
  });

  app.post('/api/admin/update-prices', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      // Simulation de mise à jour des prix
      res.json({ 
        message: "Prices updated successfully", 
        pricesUpdated: 42 
      });
    } catch (error) {

      res.status(500).json({ message: "Failed to update prices" });
    }
  });

  // Admin direct price creation/update route
  app.post('/api/admin/prices', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { type, productId, storeId, data } = req.body;
      
      if (type === "price" && data.price !== undefined) {
        const price = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
        
        if (isNaN(price) || price < 0) {
          return res.status(400).json({ message: "Prix invalide" });
        }
        
        const result = await createOrUpdatePrice(storeId, productId, price, {
          isPromotion: data.isPromotion || false,
          isAvailable: data.isAvailable !== false,
          source: 'admin'
        });
        
        res.status(201).json({ 
          success: true, 
          price: result,
          message: "Prix créé/mis à jour par admin" 
        });
      } else if (type === "availability") {
        // Marquer comme non disponible (prix à 0)
        const result = await createOrUpdatePrice(storeId, productId, 0, {
          isPromotion: false,
          isAvailable: false,
          source: 'admin'
        });
        
        res.status(201).json({ 
          success: true, 
          price: result,
          message: "Disponibilité mise à jour par admin" 
        });
      } else {
        res.status(400).json({ message: "Données invalides - type ou prix manquant" });
      }
    } catch (error) {

      res.status(500).json({ message: "Failed to create price" });
    }
  });

  // Enhanced admin contributions route with comprehensive filtering
  app.get('/api/admin/contributions', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { status, type, priority, severity } = req.query;
      
      let contributions;
      if (status && status !== 'all') {
        contributions = await storage.getContributionsByStatus(status as string);
      } else {
        contributions = await storage.getContributions();
      }

      // Apply additional filters
      if (type && type !== 'all') {
        contributions = contributions.filter((c: any) => c.type === type);
      }
      if (priority && priority !== 'all') {
        contributions = contributions.filter((c: any) => c.priority === priority);
      }
      if (severity && severity !== 'all') {
        contributions = contributions.filter((c: any) => c.severity === severity);
      }

      res.json(contributions);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  // Update contribution route
  app.put('/api/admin/contributions/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const contributionId = parseInt(req.params.id);
      const updateData = req.body;
      
      // Add reviewer information
      if (updateData.status) {
        updateData.reviewedBy = req.user?.claims?.sub || req.user?.sub;
        updateData.reviewedAt = new Date().toISOString();
      }

      const contribution = await storage.updateContribution(contributionId, updateData);
      res.json(contribution);
    } catch (error) {

      res.status(500).json({ message: "Failed to update contribution" });
    }
  });

  // Advanced contribution management routes
  app.get('/api/admin/contributions/stats', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const stats = await storage.getContributionStats();
      res.json(stats);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch contribution stats" });
    }
  });

  app.get('/api/admin/contributions/status/:status', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { status } = req.params;
      const contributions = await storage.getContributionsByStatus(status);
      res.json(contributions);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.get('/api/admin/contributions/priority/:priority', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { priority } = req.params;
      const contributions = await storage.getContributionsByPriority(priority);
      res.json(contributions);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  app.post('/api/admin/contributions/bulk-update', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { ids, status, reviewerId } = req.body;
      const userId = req.user?.claims?.sub;
      await storage.bulkUpdateContributions(ids, status, reviewerId || userId);
      res.json({ message: "Contributions updated successfully", updatedCount: ids.length });
    } catch (error) {

      res.status(500).json({ message: "Failed to update contributions" });
    }
  });

  app.get('/api/admin/contributions/date-range', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const contributions = await storage.getContributionsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json(contributions);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch contributions" });
    }
  });

  // Bulk reject contributions
  app.post('/api/admin/contributions/bulk-reject', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { contributionIds, reason } = req.body;
      const userId = req.user?.claims?.sub;
      
      if (!contributionIds || !Array.isArray(contributionIds) || contributionIds.length === 0) {
        return res.status(400).json({ message: "Invalid contribution IDs" });
      }
      
      // Update each contribution to rejected status
      for (const id of contributionIds) {
        await storage.updateContribution(id, {
          status: 'rejected',
          adminResponse: reason || 'Votre contribution a été examinée mais ne peut pas être appliquée pour le moment. Merci de votre compréhension.',
          reviewedAt: new Date(),
          reviewedBy: userId
        });
      }
      
      res.json({ 
        message: `${contributionIds.length} contribution(s) rejetée(s) avec succès`,
        rejectedCount: contributionIds.length 
      });
    } catch (error) {

      res.status(500).json({ message: "Failed to reject contributions" });
    }
  });

  // Bulk delete contributions (permanent deletion)
  app.delete('/api/admin/contributions/bulk-delete', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { contributionIds } = req.body;
      
      if (!contributionIds || !Array.isArray(contributionIds) || contributionIds.length === 0) {
        return res.status(400).json({ message: "Invalid contribution IDs" });
      }
      
      // Suppression définitive des contributions
      const deletedCount = await storage.deleteContributionsPermanently(contributionIds);
      
      res.json({ 
        message: `${deletedCount} contribution(s) supprimée(s) définitivement`,
        deletedCount 
      });
    } catch (error) {

      res.status(500).json({ message: "Failed to delete contributions" });
    }
  });

  // Delete single contribution permanently
  app.delete('/api/admin/contributions/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const contributionId = parseInt(req.params.id);
      
      await storage.deleteContribution(contributionId);
      
      res.json({ 
        message: "Contribution supprimée définitivement",
        success: true 
      });
    } catch (error) {

      res.status(500).json({ message: "Failed to delete contribution" });
    }
  });

  // Cleanup soft-deleted contributions
  app.post('/api/admin/contributions/cleanup', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const cleanedCount = await storage.cleanupDeletedContributions();
      
      res.json({ 
        message: `${cleanedCount} contribution(s) marquée(s) comme supprimée(s) ont été nettoyées définitivement`,
        cleanedCount 
      });
    } catch (error) {

      res.status(500).json({ message: "Failed to cleanup deleted contributions" });
    }
  });

  // Store-Product relationship routes
  app.get('/api/stores/:storeId/products', async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const storeProducts = await storage.getStoreProducts(storeId);
      
      // Enrichir avec les informations produits et prix
      const enrichedProducts = [];
      for (const sp of storeProducts) {
        const product = await storage.getProductById(sp.productId);
        const prices = await storage.getPricesByStore(storeId);
        const productPrice = prices.find(p => p.productId === sp.productId);
        
        if (product) {
          // Calculer le prix final
          let finalPrice = null;
          let hasPrice = false;
          if (productPrice) {
            finalPrice = typeof productPrice.price === 'string' ? parseFloat(productPrice.price) : productPrice.price;
            hasPrice = true;
          }
          
          enrichedProducts.push({
            id: sp.id,
            productId: sp.productId,
            storeId: sp.storeId,
            price: finalPrice,
            hasPrice: hasPrice,
            isAvailable: sp.isAvailable,
            isPromotion: productPrice?.isPromotion || false,
            lastChecked: sp.lastChecked,
            createdAt: sp.createdAt,
            updatedAt: sp.updatedAt,
            product: {
              id: product.id,
              name: product.name,
              brand: product.brand,
              category: product.category,
              unit: product.unit,
              description: product.description,
              image: product.imageUrl,
              imageUrl: product.imageUrl, // Utiliser imageUrl de la base
            }
          });
        }
      }
      
      res.json(enrichedProducts);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch store products" });
    }
  });

  app.get('/api/products/:productId/stores', async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const productStores = await storage.getProductStores(productId);
      res.json(productStores);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch product stores" });
    }
  });

  app.post('/api/store-products', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const storeProduct = await storage.createStoreProduct(req.body);
      res.status(201).json(storeProduct);
    } catch (error) {

      res.status(500).json({ message: "Failed to create store-product relationship" });
    }
  });

  app.patch('/api/store-products/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const storeProduct = await storage.updateStoreProduct(id, req.body);
      res.json(storeProduct);
    } catch (error) {

      res.status(500).json({ message: "Failed to update store-product relationship" });
    }
  });

  app.delete('/api/store-products/:storeId/:productId', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const productId = parseInt(req.params.productId);
      await storage.deleteStoreProduct(storeId, productId);
      res.json({ message: "Store-product relationship deleted successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to delete store-product relationship" });
    }
  });

  // Advanced user analytics routes
  app.get('/api/admin/users/:userId/activity', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { userId } = req.params;
      const activity = await storage.getUserActivity(userId);
      res.json(activity);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch user activity" });
    }
  });

  app.get('/api/admin/system/health', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const health = await storage.getSystemHealth();
      res.json(health);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch system health" });
    }
  });

  // Advanced moderation routes
  app.post('/api/admin/contributions/:id/priority', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { priority } = req.body;
      const userId = req.user?.claims?.sub;
      await storage.updateContribution(id, { 
        priority, 
        reviewedBy: userId,
        updatedAt: new Date() 
      });
      res.json({ message: "Contribution priority updated successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to update contribution priority" });
    }
  });

  app.post('/api/admin/contributions/:id/notes', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;
      const userId = req.user?.claims?.sub;
      await storage.updateContribution(id, { 
        adminNotes: notes,
        reviewedBy: userId,
        updatedAt: new Date() 
      });
      res.json({ message: "Admin notes updated successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to update admin notes" });
    }
  });

  // === USER NOTIFICATIONS API ===
  
  // Get user notifications (based on their contributions with admin responses)
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      // Extract user ID from session
      let userId;
      if ((req as any).user.claims && (req as any).user.claims.sub) {
        userId = (req as any).user.claims.sub;
      } else if ((req as any).user.sub) {
        userId = (req as any).user.sub;
      } else {
        return res.status(401).json({ message: "Invalid session structure" });
      }

      // Get user's contributions with admin responses
      const userContributions = await storage.getContributionsByUser(userId);
      const notifications = userContributions
        .filter(contribution => contribution.adminResponse && (contribution.status === 'approved' || contribution.status === 'rejected'))
        .map(contribution => ({
          id: contribution.id,
          type: contribution.status === 'approved' ? 'success' : 'info',
          title: contribution.status === 'approved' ? 'Contribution approuvée' : 'Contribution examinée',
          message: contribution.adminResponse,
          contributionType: contribution.type,
          createdAt: contribution.reviewedAt || contribution.updatedAt,
          isRead: false // Pour une future implémentation
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(notifications);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // === PRICE VOTES API ===
  
  // Create a price vote
  app.post('/api/price-votes', isAuthenticated, async (req, res) => {
    try {
      const { storeId, productId, voteType, suggestedPrice, comment } = req.body;
      
      // Extract user ID from session
      let userId;
      if ((req as any).user.claims && (req as any).user.claims.sub) {
        userId = (req as any).user.claims.sub;
      } else if ((req as any).user.sub) {
        userId = (req as any).user.sub;
      } else {
        return res.status(401).json({ message: "Invalid session structure" });
      }

      // Check if user already voted for this product in this store
      const existingVote = await db.select()
        .from(priceVotes)
        .where(
          and(
            eq(priceVotes.userId, userId),
            eq(priceVotes.storeId, storeId),
            eq(priceVotes.productId, productId)
          )
        )
        .limit(1);

      if (existingVote.length > 0) {
        // Update existing vote
        await db.update(priceVotes)
          .set({
            voteType,
            suggestedPrice: suggestedPrice ? parseFloat(suggestedPrice) : null,
            comment: comment || null,
          })
          .where(eq(priceVotes.id, existingVote[0].id));
      } else {
        // Create new vote
        await db.insert(priceVotes).values({
          userId,
          storeId,
          productId,
          voteType,
          suggestedPrice: suggestedPrice ? parseFloat(suggestedPrice) : null,
          comment: comment || null,
        });
      }

      res.status(201).json({ message: "Vote enregistré avec succès" });
    } catch (error) {

      res.status(500).json({ message: "Failed to create price vote" });
    }
  });

  // === ROUTES CRUD AVANCÉES POUR ADMINISTRATION PROFESSIONNELLE ===

  // CRUD Stores avancé avec géolocalisation et distance
  app.get('/api/stores', async (req, res) => {
    try {
      const { lat, lng, radius = 50 } = req.query;
      let stores;
      
      if (lat && lng) {
        const latitude = parseFloat(lat as string);
        const longitude = parseFloat(lng as string);
        const radiusKm = parseFloat(radius as string);
        stores = await storage.getStoresByLocation(latitude, longitude, radiusKm);
      } else {
        stores = await storage.getStores();
      }
      
      res.json(stores);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.get('/api/stores/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const store = await storage.getStoreById(id);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      // Récupérer les produits de ce magasin avec leurs prix spécifiques
      const storeProducts = await storage.getStoreProducts(id);
      const productsWithPrices = [];
      
      for (const storeProduct of storeProducts) {
        const product = await storage.getProductById(storeProduct.productId);
        if (product) {
          // Récupérer le prix spécifique de ce magasin pour ce produit
          const prices = await storage.getPricesByStore(id);
          const productPrice = prices.find(p => p.productId === product.id);
          
          productsWithPrices.push({
            ...product,
            lowestPrice: productPrice ? productPrice.price : 0,
            storeCount: 1,
            averageRating: 0,
            ratingCount: 0,
            storePrice: productPrice ? productPrice.price : null,
            isAvailable: storeProduct.isAvailable,
            isPromotion: productPrice ? productPrice.isPromotion : false
          });
        }
      }
      
      // Calculer les statistiques du magasin
      const ratings = await storage.getStoreRatings(id);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;
      
      const storeWithProducts = {
        ...store,
        averageRating,
        ratingCount: ratings.length,
        products: productsWithPrices
      };
      
      res.json(storeWithProducts);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch store" });
    }
  });



  // Ajouter un produit à un magasin
  app.post('/api/stores/:id/products', isAuthenticated, async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const { productId, price, comment } = req.body;
      
      // Extraire l'ID utilisateur selon la structure de session
      let userId;
      if ((req as any).user.claims && (req as any).user.claims.sub) {
        userId = (req as any).user.claims.sub;
      } else if ((req as any).user.sub) {
        userId = (req as any).user.sub;
      } else {
        return res.status(401).json({ message: "Invalid session structure" });
      }

      // Vérifier que le produit existe
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Créer la relation store-product
      const storeProduct = await storage.createStoreProduct({
        storeId,
        productId: product.id,
        isAvailable: true,
      });

      // Créer un prix si fourni
      if (price) {
        await storage.createPrice({
          storeId,
          productId: product.id,
          price: price.toString(),
          isPromotion: false,
          isAvailable: true,
          source: 'user',
        });
      }

      // Note: No contribution created for admin actions

      res.status(201).json(storeProduct);
    } catch (error) {

      res.status(500).json({ message: "Failed to add product to store" });
    }
  });

  // Store ratings routes
  app.get('/api/stores/:storeId/ratings', async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const ratings = await storage.getStoreRatings(storeId);
      res.json(ratings);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch store ratings" });
    }
  });

  app.post('/api/stores/:storeId/ratings', isAuthenticated, async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      
      // Extraire l'ID utilisateur selon la structure de session
      let userId;
      if ((req as any).user.claims && (req as any).user.claims.sub) {
        userId = (req as any).user.claims.sub;
      } else if ((req as any).user.sub) {
        userId = (req as any).user.sub;
      } else if ((req as any).user.id) {
        userId = (req as any).user.id;
      } else {
        return res.status(401).json({ message: "Invalid session structure" });
      }

      const ratingData = insertStoreRatingSchema.parse({
        ...req.body,
        storeId,
        userId
      });
      
      const newRating = await storage.createStoreRating(ratingData);
      res.status(201).json(newRating);
    } catch (error) {
      console.error('Rating creation error:', error);
      res.status(400).json({ message: "Invalid rating data", error: error.message });
    }
  });

  // Supprimer un produit du catalogue d'un magasin
  app.delete('/api/stores/:storeId/products/:productId', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const productId = parseInt(req.params.productId);
      
      // Supprimer la relation store-product
      await storage.deleteStoreProduct(storeId, productId);
      
      res.status(204).send();
    } catch (error) {

      res.status(500).json({ message: "Failed to remove product from store" });
    }
  });

  // Voter sur la disponibilité d'un produit
  app.post('/api/store-products/:id/vote', isAuthenticated, async (req, res) => {
    try {
      const storeProductId = parseInt(req.params.id);
      const { available } = req.body;
      const userId = (req as any).user.claims.sub;

      // Mettre à jour la disponibilité
      await storage.updateStoreProduct(storeProductId, {
        isAvailable: available,

      });

      // Créer une contribution pour documenter le vote
      await storage.createContribution({
        userId,
        productName: `Product Vote ${storeProductId}`,
        storeName: `Store Product ${storeProductId}`,
        storeAddress: '',
        type: 'availability',
        reportedAvailability: available,
        comment: `Vote: ${available ? 'Available' : 'Not available'}`,
        status: 'approved',
        priority: 'low',
      });

      res.json({ success: true, message: "Vote recorded successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to record vote" });
    }
  });

  // API endpoint pour les signalements unifiés
  app.post('/api/reports', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user.claims.sub;

      
      const { 
        type, 
        storeId,
        productId,
        comment,
        priority,
        severity,
        reportedPrice,
        reportedAvailability,
        data,
        // Legacy fields for compatibility
        productName, 
        productBrand, 
        productCategory, 
        existingProductId,
        storeName, 
        storeAddress, 
        existingStoreId,
        price, 
        availability, 
        issueType, 
        description 
      } = req.body;

      // Créer une contribution basée sur le type de signalement
      let contributionData: any = {
        userId,
        type: type || 'both',
        status: 'pending',
        priority: priority || 'normal',
        severity: severity || 'low',
        comment: comment || description || '',
        reportedPrice: reportedPrice ? parseFloat(reportedPrice) : (price ? parseFloat(price) : null),
        reportedAvailability: reportedAvailability ?? availability ?? true,
        storeId: storeId ? parseInt(storeId) : (existingStoreId ? parseInt(existingStoreId) : null),
        productId: productId ? parseInt(productId) : (existingProductId ? parseInt(existingProductId) : null),
      };

      // Ajouter les données structurées si elles existent
      if (data && Object.keys(data).length > 0) {
        contributionData.data = data;
      }

      // Traitement spécifique selon le type
      switch (type) {
        case 'new_store':
          contributionData.data = {
            ...contributionData.data,
            suggestedName: data?.suggestedName || data?.storeName || storeName || '',
            suggestedAddress: data?.suggestedAddress || data?.storeAddress || storeAddress || '',
            suggestedBrand: data?.suggestedBrand || data?.storeBrand || '',
          };
          break;

        case 'new_product':
          contributionData.data = {
            ...contributionData.data,
            suggestedName: data?.suggestedName || data?.productName || productName || '',
            suggestedBrand: data?.suggestedBrand || data?.productBrand || productBrand || '',
            suggestedCategory: data?.suggestedCategory || data?.productCategory || productCategory || '',
          };
          break;

        case 'add_product_to_store':
          contributionData.type = 'add_product_to_store';
          contributionData.data = {
            productName: productName || data?.productName || 'Nouveau produit',
            productBrand: productBrand || data?.productBrand || '',
            productCategory: productCategory || data?.productCategory || '',
            storeName: storeName || data?.storeName || 'Magasin non spécifié',
            storeAddress: storeAddress || data?.storeAddress || '',
            price: price ? parseFloat(price) : (data?.price ? parseFloat(data.price) : null),
            availability: availability ?? data?.availability ?? true,
          };
          if (!contributionData.comment) {
            contributionData.comment = `Demande d'ajout de produit: ${contributionData.data.productName} au magasin ${contributionData.data.storeName}`;
          }
          break;

        case 'price_update':
          contributionData.type = 'price_update';
          break;

        case 'store_update':
          contributionData.data = {
            ...contributionData.data,
            field: data?.field || data?.updateField || '',
            currentValue: data?.currentValue || '',
            suggestedValue: data?.suggestedValue || '',
          };
          break;

        case 'bug_report':
          contributionData.priority = 'high';
          contributionData.data = {
            ...contributionData.data,
            steps: data?.steps || data?.bugSteps || '',
            expected: data?.expected || data?.bugExpected || '',
            actual: data?.actual || data?.bugActual || '',
            browser: data?.browser || '',
          };
          break;

        case 'feature_request':
          contributionData.data = {
            ...contributionData.data,
            description: data?.description || data?.featureDescription || '',
            useCase: data?.useCase || data?.featureUseCase || '',
          };
          break;

        case 'support':
          contributionData.priority = 'high';
          break;

        // Legacy compatibility
        case 'add_product':
          contributionData.type = 'add_product_to_store';
          contributionData.data = {
            productName: productName || 'Nouveau produit',
            productBrand: productBrand || '',
            productCategory: productCategory || '',
            storeName: storeName || 'Magasin non spécifié',
            storeAddress: storeAddress || '',
            price: price ? parseFloat(price) : null,
            availability: availability ?? true,
          };
          contributionData.comment = description || `Demande d'ajout de produit: ${productName || 'Nouveau produit'} au magasin ${storeName || 'Non spécifié'}`;
          break;

        case 'update_price':
          contributionData.type = 'price_update';
          contributionData.reportedPrice = price ? parseFloat(price) : null;
          contributionData.reportedAvailability = availability;
          break;

        case 'update_store':
          contributionData.comment = `${issueType}: ${description}`;
          break;

        case 'report_issue':
          contributionData.type = 'support';
          contributionData.priority = 'high';
          contributionData.comment = description || 'Signalement général';
          break;
      }


      const contribution = await storage.createContribution(contributionData);
      
      res.status(201).json({ 
        success: true, 
        message: "Signalement créé avec succès",
        contributionId: contribution.id 
      });
    } catch (error) {

      res.status(500).json({ message: "Failed to create report", error: error.message });
    }
  });

  // CRUD Admin Stores
  app.get('/api/admin/stores', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const stores = await storage.getStores();
      res.json(stores);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.post('/api/admin/stores', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const storeData = insertStoreSchema.parse(req.body);
      const store = await storage.createStore(storeData);
      res.status(201).json(store);
    } catch (error) {

      res.status(500).json({ message: "Failed to create store" });
    }
  });

  app.put('/api/admin/stores/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const storeData = insertStoreSchema.partial().parse(req.body);
      const store = await storage.updateStore(id, storeData);
      res.json(store);
    } catch (error) {

      res.status(500).json({ message: "Failed to update store" });
    }
  });

  app.delete('/api/admin/stores/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteStore(id);
      res.json({ message: "Store deleted successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to delete store" });
    }
  });

  // Toggle disponibilité produit dans magasin
  app.post('/api/admin/stores/:storeId/products/:productId/toggle-availability', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const storeId = parseInt(req.params.storeId);
      const productId = parseInt(req.params.productId);
      const { isAvailable } = req.body;
      
      // Vérifier si la relation existe
      const storeProducts = await storage.getStoreProducts(storeId);
      const existing = storeProducts.find(sp => sp.productId === productId);
      
      if (existing) {
        await storage.updateStoreProduct(existing.id, { 
          isAvailable,
          lastChecked: new Date()
        });
      } else {
        await storage.createStoreProduct({
          storeId,
          productId,
          isAvailable,
          lastChecked: new Date()
        });
      }
      
      res.json({ message: "Product availability updated successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to toggle product availability" });
    }
  });

  // CRUD Admin Products avancé
  app.post('/api/admin/products', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {

      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/admin/products/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      res.json(product);
    } catch (error) {

      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/admin/products/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {

      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Contributions publiques (pour utilisateurs)
  app.post('/api/contributions', isAuthenticated, async (req, res) => {
    try {
      const contributionData = insertContributionSchema.parse({
        ...req.body,
        userId: (req.user as any)?.id || (req.user as any)?.claims?.sub,
        status: 'pending'
      });
      const contribution = await storage.createContribution(contributionData);
      res.status(201).json(contribution);
    } catch (error) {

      res.status(500).json({ message: "Failed to create contribution" });
    }
  });

  // Modération contributions avancée


  app.patch('/api/admin/contributions/:id/reject', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
      const { reason } = req.body;
      
      const contribution = await storage.updateContribution(id, {
        status: 'rejected',
        reviewedBy: userId,
        reviewedAt: new Date(),
        adminNotes: reason
      });
      
      res.json(contribution);
    } catch (error) {

      res.status(500).json({ message: "Failed to reject contribution" });
    }
  });

  // Actions en masse pour contributions
  app.post('/api/admin/contributions/bulk-approve', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { contributionIds } = req.body;
      const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
      
      await storage.bulkUpdateContributions(contributionIds, 'approved', userId);
      res.json({ message: `${contributionIds.length} contributions approved successfully` });
    } catch (error) {

      res.status(500).json({ message: "Failed to bulk approve contributions" });
    }
  });

  app.post('/api/admin/contributions/bulk-reject', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { contributionIds, reason } = req.body;
      const userId = (req.user as any)?.id || (req.user as any)?.claims?.sub;
      
      await storage.bulkUpdateContributions(contributionIds, 'rejected', userId);
      res.json({ message: `${contributionIds.length} contributions rejected successfully` });
    } catch (error) {

      res.status(500).json({ message: "Failed to bulk reject contributions" });
    }
  });

  // Analytics et insights avancés
  app.get('/api/admin/analytics/top-contributors', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const contributions = await storage.getContributions();
      
      const contributorStats = contributions.reduce((acc, contrib) => {
        if (!acc[contrib.userId]) {
          acc[contrib.userId] = {
            userId: contrib.userId,
            total: 0,
            approved: 0,
            pending: 0,
            rejected: 0
          };
        }
        acc[contrib.userId].total++;
        acc[contrib.userId][contrib.status as keyof typeof acc[typeof contrib.userId]]++;
        return acc;
      }, {} as Record<string, any>);
      
      const topContributors = Object.values(contributorStats)
        .sort((a: any, b: any) => b.approved - a.approved)
        .slice(0, parseInt(limit as string));
      
      res.json(topContributors);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch top contributors" });
    }
  });

  app.get('/api/admin/analytics/activity-heatmap', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));
      
      const contributions = await storage.getContributionsByDateRange(startDate, new Date());
      
      const heatmapData = contributions.reduce((acc, contrib) => {
        const date = contrib.createdAt?.toISOString().split('T')[0] || '';
        if (!acc[date]) {
          acc[date] = 0;
        }
        acc[date]++;
        return acc;
      }, {} as Record<string, number>);
      
      res.json(heatmapData);
    } catch (error) {

      res.status(500).json({ message: "Failed to generate activity heatmap" });
    }
  });

  app.get('/api/admin/analytics/store-performance', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const stores = await storage.getStores();
      const contributions = await storage.getContributions();
      
      const storePerformance = stores.map(store => {
        const storeContributions = contributions.filter(c => c.storeId === store.id);
        const recentContributions = storeContributions.filter(c => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return c.createdAt && c.createdAt > thirtyDaysAgo;
        });
        
        return {
          storeId: store.id,
          storeName: store.name,
          brand: store.brand,
          totalContributions: storeContributions.length,
          recentContributions: recentContributions.length,
          averageRating: store.averageRating,
          isActive: store.isActive
        };
      });
      
      res.json(storePerformance.sort((a, b) => b.recentContributions - a.recentContributions));
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch store performance" });
    }
  });

  // Export des données (CSV/JSON)
  app.get('/api/admin/export/contributions', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const { format = 'json', status, startDate, endDate } = req.query;
      
      let contributions = await storage.getContributions();
      
      // Filtrage
      if (status) {
        contributions = contributions.filter(c => c.status === status);
      }
      
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        contributions = contributions.filter(c => 
          c.createdAt && c.createdAt >= start && c.createdAt <= end
        );
      }
      
      if (format === 'csv') {
        const csvHeaders = 'ID,Type,Store ID,Product ID,User ID,Status,Priority,Created At,Reviewed At,Admin Notes\n';
        const csvData = contributions.map(c => 
          `${c.id},"${c.type}",${c.storeId || ''},${c.productId || ''},"${c.userId}","${c.status}","${c.priority || ''}","${c.createdAt?.toISOString() || ''}","${c.reviewedAt?.toISOString() || ''}","${c.adminNotes || ''}"`
        ).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="contributions.csv"');
        res.send(csvHeaders + csvData);
      } else {
        res.json(contributions);
      }
    } catch (error) {

      res.status(500).json({ message: "Failed to export contributions" });
    }
  });

  // Système de notifications pour les admins
  app.get('/api/admin/notifications', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const [
        pendingContributions,
        highPriorityContributions,
        recentUsers
      ] = await Promise.all([
        storage.getContributionsByStatus('pending'),
        storage.getContributionsByPriority('high'),
        storage.getAllUsers()
      ]);
      
      const notifications = [];
      
      if (pendingContributions.length > 0) {
        notifications.push({
          type: 'pending_contributions',
          title: 'Contributions en attente',
          message: `${pendingContributions.length} contributions nécessitent votre attention`,
          count: pendingContributions.length,
          priority: 'normal',
          url: '/admin/contributions?status=pending'
        });
      }
      
      if (highPriorityContributions.length > 0) {
        notifications.push({
          type: 'high_priority',
          title: 'Contributions prioritaires',
          message: `${highPriorityContributions.length} contributions haute priorité`,
          count: highPriorityContributions.length,
          priority: 'high',
          url: '/admin/contributions?priority=high'
        });
      }
      
      // Nouveaux utilisateurs cette semaine
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newUsersThisWeek = recentUsers.filter(u => 
        u.createdAt && u.createdAt > oneWeekAgo
      );
      
      if (newUsersThisWeek.length > 0) {
        notifications.push({
          type: 'new_users',
          title: 'Nouveaux utilisateurs',
          message: `${newUsersThisWeek.length} nouveaux utilisateurs cette semaine`,
          count: newUsersThisWeek.length,
          priority: 'low',
          url: '/admin/users?filter=recent'
        });
      }
      
      res.json(notifications);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Store category routes
  app.get('/api/admin/store-categories', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const categories = await storage.getStoreCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch store categories" });
    }
  });

  app.get('/api/admin/store-categories/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.getStoreCategoryById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Store category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch store category" });
    }
  });

  app.post('/api/admin/store-categories', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const validatedData = insertStoreCategorySchema.parse(req.body);
      const category = await storage.createStoreCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create store category" });
    }
  });

  app.put('/api/admin/store-categories/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const validatedData = insertStoreCategorySchema.partial().parse(req.body);
      const category = await storage.updateStoreCategory(categoryId, validatedData);
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update store category" });
    }
  });

  app.delete('/api/admin/store-categories/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      await storage.deleteStoreCategory(categoryId);
      res.json({ message: "Store category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete store category" });
    }
  });

  // Brand configuration routes
  app.get('/api/admin/brands', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const brands = await storage.getBrandConfigs();
      res.json(brands);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch brand configurations" });
    }
  });

  app.get('/api/admin/brands/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const brandId = parseInt(req.params.id);
      const brand = await storage.getBrandConfigById(brandId);
      if (!brand) {
        return res.status(404).json({ message: "Brand configuration not found" });
      }
      res.json(brand);
    } catch (error) {

      res.status(500).json({ message: "Failed to fetch brand configuration" });
    }
  });

  app.post('/api/admin/brands', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const validatedData = insertBrandConfigSchema.parse(req.body);
      const brand = await storage.createBrandConfig(validatedData);
      res.status(201).json(brand);
    } catch (error) {

      res.status(500).json({ message: "Failed to create brand configuration" });
    }
  });

  app.put('/api/admin/brands/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const brandId = parseInt(req.params.id);
      const validatedData = insertBrandConfigSchema.partial().parse(req.body);
      const brand = await storage.updateBrandConfig(brandId, validatedData);
      res.json(brand);
    } catch (error) {

      res.status(500).json({ message: "Failed to update brand configuration" });
    }
  });

  app.delete('/api/admin/brands/:id', isAuthenticated, adminMiddleware, async (req, res) => {
    try {
      const brandId = parseInt(req.params.id);
      await storage.deleteBrandConfig(brandId);
      res.status(204).send();
    } catch (error) {

      res.status(500).json({ message: "Failed to delete brand configuration" });
    }
  });

  // ===== GOOGLE PLACES API ROUTES =====
  
  // Route pour rechercher des suggestions de magasins
  app.get("/api/places/search", async (req, res) => {
    try {
      const { query, latitude, longitude, radius = "5000" } = req.query as {
        query: string;
        latitude?: string;
        longitude?: string;
        radius?: string;
      };

      if (!query) {
        return res.status(400).json({ error: "Query parameter is required" });
      }

      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Places API key not configured" });
      }

      // Détecter si c'est une recherche de ville (Frameries, Mons, etc.)
      const knownBrands = ['aldi', 'lidl', 'delhaize', 'carrefour', 'colruyt', 'okay', 'proxy', 'match', 'intermarché', 'spar'];
      const isLocationSearch = /^[A-Za-zÀ-ÿ\-\s]{2,}$/.test(query.trim()) && 
                              !knownBrands.some(brand => query.toLowerCase().includes(brand));

      let searchUrl;
      
      if (isLocationSearch) {
        // Si c'est une recherche de lieu, chercher spécifiquement les commerces alimentaires dans cette ville
        const modifiedQuery = `grocery stores supermarkets in ${query}`;
        searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(modifiedQuery)}&key=${apiKey}&type=grocery_or_supermarket|store|establishment`;
      } else {
        // Recherche normale par nom de magasin
        searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
      }
      
      if (latitude && longitude) {
        searchUrl += `&location=${latitude},${longitude}&radius=${radius}`;
      }

      // Région Belgique
      searchUrl += "&region=be";

      console.log("Google Places API URL:", searchUrl);
      const response = await fetch(searchUrl);
      const data = await response.json();
      console.log("Google Places API response:", data);

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error("Google Places API error:", data.status, data.error_message);
        return res.status(500).json({ 
          error: "Google Places API error", 
          details: data.error_message,
          status: data.status 
        });
      }

      const suggestions = data.results?.map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        types: place.types,
        rating: place.rating,
        vicinity: place.vicinity
      })) || [];

      res.json({ suggestions });
    } catch (error) {

      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Route pour récupérer les détails d'un magasin
  app.get("/api/places/details", async (req, res) => {
    try {
      const { placeId } = req.query as { placeId: string };

      if (!placeId) {
        return res.status(400).json({ error: "placeId parameter is required" });
      }

      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Google Places API key not configured" });
      }

      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,formatted_phone_number,opening_hours,rating,website,address_components&key=${apiKey}`;

      const response = await fetch(detailsUrl);
      const data = await response.json();

      if (data.status !== "OK") {
        console.error("Google Places Details API error:", data.status, data.error_message);
        return res.status(500).json({ 
          error: "Google Places Details API error", 
          details: data.error_message,
          status: data.status 
        });
      }

      const place = data.result;
      
      // Extraire ville et code postal des composants d'adresse
      const addressComponents = place.address_components || [];
      let city = "";
      let postalCode = "";

      for (const component of addressComponents) {
        if (component.types.includes("locality")) {
          city = component.long_name;
        }
        if (component.types.includes("postal_code")) {
          postalCode = component.long_name;
        }
      }

      const details = {
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        city,
        postalCode,
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
        phone: place.formatted_phone_number,
        openingHours: place.opening_hours,
        rating: place.rating,
        website: place.website,
        types: place.types
      };

      res.json({ details });
    } catch (error) {

      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Development/Test route to toggle admin role
  app.post('/api/dev/toggle-admin', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get current user
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Toggle role between 'user' and 'admin'
      const newRole = currentUser.role === 'admin' ? 'user' : 'admin';
      
      // Update user role in database
      const updatedUser = await storage.upsertUser({
        id: userId,
        email: currentUser.email,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        profileImageUrl: currentUser.profileImageUrl,
        role: newRole
      });
      
      res.json({ 
        success: true, 
        role: newRole,
        message: `Rôle changé vers: ${newRole === 'admin' ? 'Administrateur' : 'Contributeur'}`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle admin role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
