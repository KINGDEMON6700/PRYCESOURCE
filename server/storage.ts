import {
  users,
  stores,
  products,
  prices,
  contributions,
  storeRatings,
  productRatings,
  storeProducts,
  storeCategories,
  brandConfigs,
  priceVotes,
  type User,
  type UpsertUser,
  type Store,
  type Product,
  type Price,
  type Contribution,
  type StoreRating,
  type ProductRating,
  type StoreProduct,
  type StoreCategory,
  type BrandConfig,
  type InsertStore,
  type InsertProduct,
  type InsertPrice,
  type InsertContribution,
  type InsertStoreRating,
  type InsertProductRating,
  type InsertStoreProduct,
  type InsertStoreCategory,
  type InsertBrandConfig,
  type StoreWithRating,
  type ProductWithPrice,
  type PriceComparison,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, like, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Store operations
  getStores(): Promise<StoreWithRating[]>;
  getStoreById(id: number): Promise<Store | undefined>;
  getStoresByLocation(latitude: number, longitude: number, radius: number): Promise<StoreWithRating[]>;
  createStore(store: InsertStore): Promise<Store>;
  updateStore(id: number, store: Partial<InsertStore>): Promise<Store>;
  deleteStore(id: number): Promise<void>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  searchProducts(query: string): Promise<ProductWithPrice[]>;
  getPopularProducts(limit: number): Promise<ProductWithPrice[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Price operations
  getPricesByProduct(productId: number): Promise<Price[]>;
  getPricesByStore(storeId: number): Promise<Price[]>;
  getPriceComparison(productId: number, latitude?: number, longitude?: number): Promise<PriceComparison>;
  createPrice(price: InsertPrice): Promise<Price>;
  updatePrice(id: number, price: Partial<InsertPrice>): Promise<Price>;

  // Contribution operations
  getContributions(status?: string): Promise<Contribution[]>;
  getContributionsByUser(userId: string): Promise<Contribution[]>;
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  updateContribution(id: number, contribution: Partial<InsertContribution>): Promise<Contribution>;

  // Rating operations
  getStoreRatings(storeId: number): Promise<StoreRating[]>;
  getProductRatings(productId: number): Promise<ProductRating[]>;
  createStoreRating(rating: InsertStoreRating): Promise<StoreRating>;
  createProductRating(rating: InsertProductRating): Promise<ProductRating>;
  updateStoreRating(id: number, rating: Partial<InsertStoreRating>): Promise<StoreRating>;
  updateProductRating(id: number, rating: Partial<InsertProductRating>): Promise<ProductRating>;

  // Store-Product relationship operations
  getStoreProducts(storeId: number): Promise<StoreProduct[]>;
  getProductStores(productId: number): Promise<StoreProduct[]>;
  createStoreProduct(storeProduct: InsertStoreProduct): Promise<StoreProduct>;
  updateStoreProduct(id: number, storeProduct: Partial<InsertStoreProduct>): Promise<StoreProduct>;
  deleteStoreProduct(storeId: number, productId: number): Promise<void>;

  // Advanced contribution operations
  getContributionsByStatus(status: string): Promise<Contribution[]>;
  getContributionsByPriority(priority: string): Promise<Contribution[]>;
  getContributionsByDateRange(startDate: Date, endDate: Date): Promise<Contribution[]>;
  bulkUpdateContributions(ids: number[], status: string, reviewerId?: string): Promise<void>;
  getContributionStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
  }>;

  // Advanced admin operations
  getUserCount(): Promise<number>;
  getProductCount(): Promise<number>;
  getStoreCount(): Promise<number>;
  getContributionCount(): Promise<{ pending: number; today: number; verified: number; }>;
  getAllUsers(): Promise<User[]>;
  getUserActivity(userId: string): Promise<{
    contributionsCount: number;
    ratingsCount: number;
    lastActivity: Date | null;
  }>;
  getSystemHealth(): Promise<{
    activeUsers: number;
    todayContributions: number;
    pendingContributions: number;
    averageResponseTime: number;
  }>;

  // Store category operations
  getStoreCategories(): Promise<StoreCategory[]>;
  getStoreCategoryById(id: number): Promise<StoreCategory | undefined>;
  createStoreCategory(storeCategory: InsertStoreCategory): Promise<StoreCategory>;
  updateStoreCategory(id: number, storeCategory: Partial<InsertStoreCategory>): Promise<StoreCategory>;
  deleteStoreCategory(id: number): Promise<void>;

  // Brand configuration operations
  getBrandConfigs(): Promise<BrandConfig[]>;
  getBrandConfigById(id: number): Promise<BrandConfig | undefined>;
  createBrandConfig(brandConfig: InsertBrandConfig): Promise<BrandConfig>;
  updateBrandConfig(id: number, brandConfig: Partial<InsertBrandConfig>): Promise<BrandConfig>;
  deleteBrandConfig(id: number): Promise<void>;

  // Permanent deletion operations
  deleteContribution(id: number): Promise<void>;
  deleteContributionsPermanently(contributionIds: number[]): Promise<number>;
  cleanupDeletedContributions(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Store operations
  async getStores(): Promise<StoreWithRating[]> {
    const result = await db
      .select({
        id: stores.id,
        name: stores.name,
        categoryId: stores.categoryId,
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
        averageRating: sql<number>`COALESCE(AVG(${storeRatings.rating}), 0)`,
        ratingCount: sql<number>`COUNT(${storeRatings.id})`,
        distance: sql<number>`0`,
        averageDiscount: sql<number>`0`,
      })
      .from(stores)
      .leftJoin(storeRatings, eq(stores.id, storeRatings.storeId))
      .where(eq(stores.isActive, true))
      .groupBy(stores.id)
      .orderBy(asc(stores.categoryId), asc(stores.name));

    // Calculer les prix moyens pour chaque magasin
    const storesWithPrices = await Promise.all(
      result.map(async (store) => {
        const avgPriceResult = await db
          .select({ 
            avgPrice: sql<number>`COALESCE(AVG(CAST(${prices.price} AS DECIMAL)), 0)`,
            count: sql<number>`COUNT(${prices.id})`
          })
          .from(prices)
          .where(eq(prices.storeId, store.id));
        
        const avgPrice = avgPriceResult[0]?.avgPrice || 0;
        const priceCount = avgPriceResult[0]?.count || 0;
        
        return {
          ...store,
          averagePrice: avgPrice,
          productCount: priceCount
        };
      })
    );

    // Trier par prix moyen (meilleur prix en premier) puis par nom
    return storesWithPrices.sort((a, b) => {
      if (a.averagePrice === 0 && b.averagePrice === 0) return a.name.localeCompare(b.name);
      if (a.averagePrice === 0) return 1;
      if (b.averagePrice === 0) return -1;
      return a.averagePrice - b.averagePrice;
    }) as StoreWithRating[];
  }

  async getStoreById(id: number): Promise<Store | undefined> {
    const [store] = await db.select().from(stores).where(eq(stores.id, id));
    return store;
  }

  async getStoresByLocation(latitude: number, longitude: number, radius: number): Promise<StoreWithRating[]> {
    const result = await db
      .select({
        id: stores.id,
        name: stores.name,
        categoryId: stores.categoryId,
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
        averageRating: sql<number>`COALESCE(AVG(${storeRatings.rating}), 0)`,
        ratingCount: sql<number>`COUNT(${storeRatings.id})`,
        distance: sql<number>`0`,
      })
      .from(stores)
      .leftJoin(storeRatings, eq(stores.id, storeRatings.storeId))
      .where(eq(stores.isActive, true))
      .groupBy(stores.id)
      .orderBy(asc(stores.categoryId), asc(stores.name));

    // Calculer distance et prix moyens pour chaque magasin
    const storesWithData = await Promise.all(
      result.map(async (store) => {
        // Calculer la distance haversine
        const storeLatitude = parseFloat(store.latitude.toString());
        const storeLongitude = parseFloat(store.longitude.toString());
        
        const R = 6371; // Rayon de la Terre en kilomètres
        const dLat = (storeLatitude - latitude) * Math.PI / 180;
        const dLng = (storeLongitude - longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(latitude * Math.PI / 180) * Math.cos(storeLatitude * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const calculatedDistance = R * c;

        // Calculer les prix moyens
        const avgPriceResult = await db
          .select({ 
            avgPrice: sql<number>`COALESCE(AVG(CAST(${prices.price} AS DECIMAL)), 0)`,
            count: sql<number>`COUNT(${prices.id})`
          })
          .from(prices)
          .where(eq(prices.storeId, store.id));
        
        const avgPrice = avgPriceResult[0]?.avgPrice || 0;
        const priceCount = avgPriceResult[0]?.count || 0;
        
        return {
          ...store,
          distance: calculatedDistance,
          averagePrice: avgPrice,
          productCount: priceCount
        };
      })
    );

    // Filtrer par rayon et trier par distance puis par prix moyen
    const filteredStores = storesWithData.filter(store => store.distance <= radius);
    
    return filteredStores.sort((a, b) => {
      // D'abord par distance
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      // Puis par prix moyen (meilleur prix en premier)
      if (a.averagePrice === 0 && b.averagePrice === 0) return a.name.localeCompare(b.name);
      if (a.averagePrice === 0) return 1;
      if (b.averagePrice === 0) return -1;
      return a.averagePrice - b.averagePrice;
    }) as StoreWithRating[];
  }

  async createStore(store: InsertStore): Promise<Store> {
    const [newStore] = await db.insert(stores).values(store).returning();
    return newStore;
  }

  async updateStore(id: number, store: Partial<InsertStore>): Promise<Store> {
    const [updatedStore] = await db
      .update(stores)
      .set({ ...store, updatedAt: new Date() })
      .where(eq(stores.id, id))
      .returning();
    return updatedStore;
  }

  async deleteStore(id: number): Promise<void> {
    // Supprimer dans l'ordre correct pour respecter les contraintes
    
    // 1. Supprimer toutes les contributions liées à ce magasin
    await db.delete(contributions).where(eq(contributions.storeId, id));
    
    // 2. Supprimer tous les votes de prix liés aux prix de ce magasin
    await db.delete(priceVotes).where(eq(priceVotes.storeId, id));
    
    // 3. Supprimer toutes les notes du magasin
    await db.delete(storeRatings).where(eq(storeRatings.storeId, id));
    
    // 4. Supprimer tous les prix associés à ce magasin
    await db.delete(prices).where(eq(prices.storeId, id));
    
    // 5. Supprimer les relations store-products
    await db.delete(storeProducts).where(eq(storeProducts.storeId, id));
    
    // 6. Enfin supprimer le magasin
    await db.delete(stores).where(eq(stores.id, id));
  }

  // Product operations
  async getProducts(): Promise<ProductWithPrice[]> {
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        brand: products.brand,
        category: products.category,
        description: products.description,
        unit: products.unit,
        barcode: products.barcode,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        lowestPrice: sql<number>`COALESCE(MIN(CASE WHEN ${storeProducts.isAvailable} = true AND ${prices.price} IS NOT NULL THEN CAST(${prices.price} AS DECIMAL) END), 0)`,
        storeCount: sql<number>`COUNT(DISTINCT CASE WHEN ${storeProducts.isAvailable} = true THEN ${storeProducts.storeId} END)`,
        averageRating: sql<number>`COALESCE(AVG(${productRatings.rating}), 0)`,
        ratingCount: sql<number>`COUNT(${productRatings.id})`,
      })
      .from(products)
      .leftJoin(storeProducts, eq(products.id, storeProducts.productId))
      .leftJoin(prices, and(eq(products.id, prices.productId), eq(prices.isAvailable, true)))
      .leftJoin(productRatings, eq(products.id, productRatings.productId))
      .where(eq(products.isActive, true))
      .groupBy(products.id)
      .orderBy(products.name);

    return result as ProductWithPrice[];
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async searchProducts(query: string): Promise<ProductWithPrice[]> {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        brand: products.brand,
        category: products.category,
        description: products.description,
        unit: products.unit,
        barcode: products.barcode,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        lowestPrice: sql<number>`COALESCE(MIN(CASE WHEN ${storeProducts.isAvailable} = true AND ${prices.price} IS NOT NULL THEN CAST(${prices.price} AS DECIMAL) END), 0)`,
        storeCount: sql<number>`COUNT(DISTINCT CASE WHEN ${storeProducts.isAvailable} = true THEN ${storeProducts.storeId} END)`,
        averageRating: sql<number>`COALESCE(AVG(${productRatings.rating}), 0)`,
        ratingCount: sql<number>`COUNT(${productRatings.id})`,
      })
      .from(products)
      .leftJoin(storeProducts, eq(products.id, storeProducts.productId))
      .leftJoin(prices, and(eq(products.id, prices.productId), eq(prices.isAvailable, true)))
      .leftJoin(productRatings, eq(products.id, productRatings.productId))
      .where(
        and(
          eq(products.isActive, true),
          sql`LOWER(${products.name}) LIKE ${`%${query?.toLowerCase() || ''}%`} OR LOWER(COALESCE(${products.brand}, '')) LIKE ${`%${query?.toLowerCase() || ''}%`}`
        )
      )
      .groupBy(products.id)
      .orderBy(products.name);

    return result as ProductWithPrice[];
  }

  async getPopularProducts(limit: number): Promise<ProductWithPrice[]> {
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        brand: products.brand,
        category: products.category,
        description: products.description,
        unit: products.unit,
        barcode: products.barcode,
        imageUrl: products.imageUrl,
        isActive: products.isActive,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
        lowestPrice: sql<number>`COALESCE(MIN(CASE WHEN ${storeProducts.isAvailable} = true AND ${prices.price} IS NOT NULL THEN CAST(${prices.price} AS DECIMAL) END), 0)`,
        storeCount: sql<number>`COUNT(DISTINCT CASE WHEN ${storeProducts.isAvailable} = true THEN ${storeProducts.storeId} END)`,
        averageRating: sql<number>`COALESCE(AVG(${productRatings.rating}), 0)`,
        ratingCount: sql<number>`COUNT(${productRatings.id})`,
      })
      .from(products)
      .leftJoin(storeProducts, eq(products.id, storeProducts.productId))
      .leftJoin(prices, and(eq(products.id, prices.productId), eq(prices.isAvailable, true)))
      .leftJoin(productRatings, eq(products.id, productRatings.productId))
      .where(eq(products.isActive, true))
      .groupBy(products.id)
      .orderBy(desc(sql`COUNT(${productRatings.id})`))
      .limit(limit);

    return result as ProductWithPrice[];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    // Supprimer dans l'ordre correct pour respecter les contraintes
    
    // 1. Supprimer toutes les contributions liées à ce produit
    await db.delete(contributions).where(eq(contributions.productId, id));
    
    // 2. Supprimer tous les votes de prix liés à ce produit
    await db.delete(priceVotes).where(eq(priceVotes.productId, id));
    
    // 3. Supprimer toutes les notes de ce produit
    await db.delete(productRatings).where(eq(productRatings.productId, id));
    
    // 4. Supprimer tous les prix associés à ce produit
    await db.delete(prices).where(eq(prices.productId, id));
    
    // 5. Supprimer les relations store-products
    await db.delete(storeProducts).where(eq(storeProducts.productId, id));
    
    // 6. Enfin supprimer le produit
    await db.delete(products).where(eq(products.id, id));
  }

  // Price operations
  async getPricesByProduct(productId: number): Promise<Price[]> {
    return await db
      .select()
      .from(prices)
      .where(eq(prices.productId, productId))
      .orderBy(asc(prices.price));
  }

  async getPricesByStore(storeId: number): Promise<Price[]> {
    return await db
      .select()
      .from(prices)
      .where(eq(prices.storeId, storeId))
      .orderBy(prices.lastUpdated);
  }

  async getPriceComparison(productId: number, latitude?: number, longitude?: number): Promise<PriceComparison> {
    const [product] = await db.select().from(products).where(eq(products.id, productId));
    
    if (!product) {
      throw new Error('Product not found');
    }

    // Get all stores that have this product in their catalog
    const storeProductData = await db
      .select({
        store: stores,
        storeProduct: storeProducts,
        price: prices.price,
        isPromotion: prices.isPromotion,
        isAvailable: prices.isAvailable,
        lastUpdated: prices.lastUpdated,
      })
      .from(storeProducts)
      .innerJoin(stores, eq(storeProducts.storeId, stores.id))
      .leftJoin(prices, and(
        eq(prices.productId, productId),
        eq(prices.storeId, stores.id)
      ))
      .where(
        and(
          eq(storeProducts.productId, productId),
          eq(stores.isActive, true)
        )
      );

    // Calculate distance and format data
    const formattedPriceData = storeProductData.map(item => {
      let distance: number | undefined;
      
      if (latitude && longitude && item.store.latitude && item.store.longitude) {
        // Calculate actual distance using Haversine formula
        const R = 6371; // Earth's radius in kilometers
        const dLat = (item.store.latitude - latitude) * Math.PI / 180;
        const dLon = (item.store.longitude - longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(latitude * Math.PI / 180) * Math.cos(item.store.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }

      return {
        store: item.store,
        price: item.price ? parseFloat(item.price as string) : 0,
        isPromotion: Boolean(item.isPromotion),
        isAvailable: item.isAvailable !== null ? Boolean(item.isAvailable) : true, // Default to available if no price data
        distance,
        hasPrice: item.price !== null,
        lastUpdated: item.lastUpdated,
      };
    });

    // Sort by: availability first, then by price (lowest first), then by distance (closest first)
    const sortedData = formattedPriceData.sort((a, b) => {
      // First priority: availability
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      
      // Second priority: has price data
      if (a.hasPrice !== b.hasPrice) {
        return a.hasPrice ? -1 : 1;
      }
      
      // Third priority: price (only if both have prices)
      if (a.hasPrice && b.hasPrice && a.price !== b.price) {
        return a.price - b.price;
      }
      
      // Fourth priority: distance (only if both have distance)
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      
      return 0;
    });

    return {
      product,
      prices: sortedData,
    };
  }

  async createPrice(price: InsertPrice): Promise<Price> {
    const [newPrice] = await db.insert(prices).values(price).returning();
    return newPrice;
  }

  async updatePrice(id: number, price: Partial<InsertPrice>): Promise<Price> {
    const [updatedPrice] = await db
      .update(prices)
      .set({ ...price, lastUpdated: new Date() })
      .where(eq(prices.id, id))
      .returning();
    return updatedPrice;
  }

  // Contribution operations
  async getContributions(status?: string): Promise<Contribution[]> {
    const query = db.select().from(contributions).orderBy(desc(contributions.createdAt));
    
    if (status) {
      return await query.where(eq(contributions.status, status));
    }
    
    return await query;
  }

  async getContributionsByUser(userId: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.userId, userId))
      .orderBy(desc(contributions.createdAt));
  }

  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const [newContribution] = await db.insert(contributions).values(contribution).returning();
    return newContribution;
  }

  async updateContribution(id: number, contribution: Partial<InsertContribution>): Promise<Contribution> {
    const [updatedContribution] = await db
      .update(contributions)
      .set(contribution)
      .where(eq(contributions.id, id))
      .returning();
    return updatedContribution;
  }

  // Rating operations
  async getStoreRatings(storeId: number): Promise<StoreRating[]> {
    return await db
      .select({
        id: storeRatings.id,
        storeId: storeRatings.storeId,
        userId: storeRatings.userId,
        rating: storeRatings.rating,
        comment: storeRatings.comment,
        createdAt: storeRatings.createdAt,
        updatedAt: storeRatings.updatedAt,
        user: {
          id: users.id,
          email: users.email,
        }
      })
      .from(storeRatings)
      .leftJoin(users, eq(storeRatings.userId, users.id))
      .where(eq(storeRatings.storeId, storeId))
      .orderBy(desc(storeRatings.createdAt));
  }

  async getProductRatings(productId: number): Promise<ProductRating[]> {
    return await db
      .select()
      .from(productRatings)
      .where(eq(productRatings.productId, productId))
      .orderBy(desc(productRatings.createdAt));
  }

  async createStoreRating(rating: InsertStoreRating): Promise<StoreRating> {
    const [newRating] = await db.insert(storeRatings).values(rating).returning();
    return newRating;
  }

  async createProductRating(rating: InsertProductRating): Promise<ProductRating> {
    const [newRating] = await db.insert(productRatings).values(rating).returning();
    return newRating;
  }

  async updateStoreRating(id: number, rating: Partial<InsertStoreRating>): Promise<StoreRating> {
    const [updatedRating] = await db
      .update(storeRatings)
      .set({ ...rating, updatedAt: new Date() })
      .where(eq(storeRatings.id, id))
      .returning();
    return updatedRating;
  }

  async updateProductRating(id: number, rating: Partial<InsertProductRating>): Promise<ProductRating> {
    const [updatedRating] = await db
      .update(productRatings)
      .set({ ...rating, updatedAt: new Date() })
      .where(eq(productRatings.id, id))
      .returning();
    return updatedRating;
  }

  // Admin operations
  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  async getProductCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(products);
    return result[0].count;
  }

  async getStoreCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(stores);
    return result[0].count;
  }

  async getContributionCount(): Promise<{ pending: number; today: number; verified: number; }> {
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(contributions);
    const pendingResult = await db.select({ count: sql<number>`count(*)` }).from(contributions).where(eq(contributions.status, 'pending'));
    const verifiedResult = await db.select({ count: sql<number>`count(*)` }).from(contributions).where(eq(contributions.status, 'approved'));
    
    return {
      pending: pendingResult[0]?.count || 0,
      today: Math.floor(totalResult[0]?.count / 10) || 0, // Simulation
      verified: verifiedResult[0]?.count || 0,
    };
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Store-Product relationship operations
  async getStoreProducts(storeId: number): Promise<StoreProduct[]> {
    return await db
      .select()
      .from(storeProducts)
      .where(eq(storeProducts.storeId, storeId))
      .orderBy(desc(storeProducts.lastChecked));
  }

  async getProductStores(productId: number): Promise<StoreProduct[]> {
    return await db
      .select()
      .from(storeProducts)
      .where(eq(storeProducts.productId, productId))
      .orderBy(desc(storeProducts.lastChecked));
  }

  async createStoreProduct(storeProduct: InsertStoreProduct): Promise<StoreProduct> {
    const [newStoreProduct] = await db.insert(storeProducts).values(storeProduct).returning();
    return newStoreProduct;
  }

  async updateStoreProduct(id: number, storeProduct: Partial<InsertStoreProduct>): Promise<StoreProduct> {
    const [updatedStoreProduct] = await db
      .update(storeProducts)
      .set({ ...storeProduct, updatedAt: new Date() })
      .where(eq(storeProducts.id, id))
      .returning();
    return updatedStoreProduct;
  }

  async deleteStoreProduct(storeId: number, productId: number): Promise<void> {
    // Supprimer d'abord les prix liés à cette relation store-product
    await db.delete(prices).where(
      and(
        eq(prices.storeId, storeId),
        eq(prices.productId, productId)
      )
    );
    
    // Supprimer les contributions liées à cette relation
    await db.delete(contributions).where(
      and(
        eq(contributions.storeId, storeId),
        eq(contributions.productId, productId)
      )
    );
    
    // Supprimer les votes de prix liés
    await db.delete(priceVotes).where(
      and(
        eq(priceVotes.storeId, storeId),
        eq(priceVotes.productId, productId)
      )
    );
    
    // Enfin supprimer la relation store-product
    await db
      .delete(storeProducts)
      .where(and(
        eq(storeProducts.storeId, storeId),
        eq(storeProducts.productId, productId)
      ));
  }

  // Advanced contribution operations
  async getContributionsByStatus(status: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.status, status))
      .orderBy(desc(contributions.createdAt));
  }

  async getContributionsByPriority(priority: string): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(eq(contributions.priority, priority))
      .orderBy(desc(contributions.createdAt));
  }

  async getContributionsByDateRange(startDate: Date, endDate: Date): Promise<Contribution[]> {
    return await db
      .select()
      .from(contributions)
      .where(and(
        sql`${contributions.createdAt} >= ${startDate}`,
        sql`${contributions.createdAt} <= ${endDate}`
      ))
      .orderBy(desc(contributions.createdAt));
  }

  async bulkUpdateContributions(ids: number[], status: string, reviewerId?: string): Promise<void> {
    await db
      .update(contributions)
      .set({
        status,
        reviewedBy: reviewerId || null,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(inArray(contributions.id, ids));
  }

  async getContributionStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(contributions);
    const pendingResult = await db.select({ count: sql<number>`count(*)` }).from(contributions).where(eq(contributions.status, 'pending'));
    const approvedResult = await db.select({ count: sql<number>`count(*)` }).from(contributions).where(eq(contributions.status, 'approved'));
    const rejectedResult = await db.select({ count: sql<number>`count(*)` }).from(contributions).where(eq(contributions.status, 'rejected'));

    // Get priority stats
    const priorityStats = await db
      .select({
        priority: contributions.priority,
        count: sql<number>`count(*)`
      })
      .from(contributions)
      .groupBy(contributions.priority);

    // Get type stats
    const typeStats = await db
      .select({
        type: contributions.type,
        count: sql<number>`count(*)`
      })
      .from(contributions)
      .groupBy(contributions.type);

    return {
      total: totalResult[0]?.count || 0,
      pending: pendingResult[0]?.count || 0,
      approved: approvedResult[0]?.count || 0,
      rejected: rejectedResult[0]?.count || 0,
      byPriority: priorityStats.reduce((acc, item) => {
        acc[item.priority || 'unknown'] = item.count;
        return acc;
      }, {} as Record<string, number>),
      byType: typeStats.reduce((acc, item) => {
        acc[item.type || 'unknown'] = item.count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async getUserActivity(userId: string): Promise<{
    contributionsCount: number;
    ratingsCount: number;
    lastActivity: Date | null;
  }> {
    const contributionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contributions)
      .where(eq(contributions.userId, userId));

    const storeRatingsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(storeRatings)
      .where(eq(storeRatings.userId, userId));

    const productRatingsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(productRatings)
      .where(eq(productRatings.userId, userId));

    // Get last activity from contributions
    const lastContribution = await db
      .select({ date: contributions.createdAt })
      .from(contributions)
      .where(eq(contributions.userId, userId))
      .orderBy(desc(contributions.createdAt))
      .limit(1);

    return {
      contributionsCount: contributionsResult[0]?.count || 0,
      ratingsCount: (storeRatingsResult[0]?.count || 0) + (productRatingsResult[0]?.count || 0),
      lastActivity: lastContribution[0]?.date || null,
    };
  }

  async getSystemHealth(): Promise<{
    activeUsers: number;
    todayContributions: number;
    pendingContributions: number;
    averageResponseTime: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeUsersResult = await db
      .select({ count: sql<number>`count(distinct ${contributions.userId})` })
      .from(contributions)
      .where(sql`${contributions.createdAt} >= ${today}`);

    const todayContributionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contributions)
      .where(sql`${contributions.createdAt} >= ${today}`);

    const pendingContributionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(contributions)
      .where(eq(contributions.status, 'pending'));

    return {
      activeUsers: activeUsersResult[0]?.count || 0,
      todayContributions: todayContributionsResult[0]?.count || 0,
      pendingContributions: pendingContributionsResult[0]?.count || 0,
      averageResponseTime: 2.5, // Simulated metric - could be calculated based on real data
    };
  }

  // Store category methods
  async getStoreCategories(): Promise<StoreCategory[]> {
    const result = await db
      .select()
      .from(storeCategories)
      .orderBy(asc(storeCategories.sortOrder));
    return result;
  }

  async getStoreCategoryById(id: number): Promise<StoreCategory | undefined> {
    const result = await db
      .select()
      .from(storeCategories)
      .where(eq(storeCategories.id, id))
      .limit(1);
    return result[0];
  }

  async createStoreCategory(storeCategory: InsertStoreCategory): Promise<StoreCategory> {
    const [newCategory] = await db.insert(storeCategories).values(storeCategory).returning();
    return newCategory;
  }

  async updateStoreCategory(id: number, storeCategory: Partial<InsertStoreCategory>): Promise<StoreCategory> {
    const [updatedCategory] = await db
      .update(storeCategories)
      .set({ ...storeCategory, updatedAt: new Date() })
      .where(eq(storeCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteStoreCategory(id: number): Promise<void> {
    // Vérifier s'il y a des magasins utilisant cette catégorie
    const storesUsingCategory = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stores)
      .where(eq(stores.categoryId, id));
    
    const storeCount = storesUsingCategory[0]?.count || 0;
    
    if (storeCount > 0) {
      // Trouver une catégorie de remplacement (la première disponible)
      const replacementCategory = await db
        .select()
        .from(storeCategories)
        .where(and(
          ne(storeCategories.id, id),
          eq(storeCategories.isActive, true)
        ))
        .orderBy(asc(storeCategories.sortOrder))
        .limit(1);
      
      if (replacementCategory.length > 0) {
        // Réassigner tous les magasins à la catégorie de remplacement
        await db
          .update(stores)
          .set({ categoryId: replacementCategory[0].id })
          .where(eq(stores.categoryId, id));
      } else {
        // Créer une catégorie "Autre" si aucune autre catégorie n'existe
        const [newCategory] = await db
          .insert(storeCategories)
          .values({
            name: "autre",
            label: "Autre",
            color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
            iconName: "Building",
            description: "Autres types de magasins",
            isActive: true,
            sortOrder: 999,
          })
          .returning();
        
        // Réassigner tous les magasins à la nouvelle catégorie "Autre"
        await db
          .update(stores)
          .set({ categoryId: newCategory.id })
          .where(eq(stores.categoryId, id));
      }
    }
    
    // Supprimer la catégorie
    await db.delete(storeCategories).where(eq(storeCategories.id, id));
  }

  // Brand configuration methods
  async getBrandConfigs(): Promise<BrandConfig[]> {
    const result = await db
      .select()
      .from(brandConfigs)
      .orderBy(asc(brandConfigs.name));
    return result;
  }

  async getBrandConfigById(id: number): Promise<BrandConfig | undefined> {
    const result = await db
      .select()
      .from(brandConfigs)
      .where(eq(brandConfigs.id, id))
      .limit(1);
    return result[0];
  }

  async createBrandConfig(brandConfig: InsertBrandConfig): Promise<BrandConfig> {
    const result = await db
      .insert(brandConfigs)
      .values(brandConfig)
      .returning();
    return result[0];
  }

  async updateBrandConfig(id: number, brandConfig: Partial<InsertBrandConfig>): Promise<BrandConfig> {
    const result = await db
      .update(brandConfigs)
      .set(brandConfig)
      .where(eq(brandConfigs.id, id))
      .returning();
    return result[0];
  }

  async deleteBrandConfig(id: number): Promise<void> {
    await db
      .delete(brandConfigs)
      .where(eq(brandConfigs.id, id));
  }

  // Permanent deletion operations
  async deleteContribution(id: number): Promise<void> {
    await db.delete(contributions).where(eq(contributions.id, id));
  }

  async deleteContributionsPermanently(contributionIds: number[]): Promise<number> {
    let deletedCount = 0;
    
    for (const id of contributionIds) {
      try {
        await db.delete(contributions).where(eq(contributions.id, id));
        deletedCount++;
      } catch (error) {

      }
    }
    
    return deletedCount;
  }

  async cleanupDeletedContributions(): Promise<number> {
    // Supprimer définitivement toutes les contributions marquées comme "deleted"
    const deletedContributions = await db
      .delete(contributions)
      .where(eq(contributions.status, 'deleted'))
      .returning({ id: contributions.id });
    
    return deletedContributions.length;
  }
}

export const storage = new DatabaseStorage();
