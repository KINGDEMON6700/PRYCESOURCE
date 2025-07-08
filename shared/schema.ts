import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  real,
  integer,
  boolean,
  decimal,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"), // user, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Store categories table
export const storeCategories = pgTable("store_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  label: varchar("label").notNull(),
  color: varchar("color").notNull(), // CSS classes for styling
  iconName: varchar("icon_name").notNull(), // Lucide icon name
  description: text("description"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stores table
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  categoryId: integer("category_id").references(() => storeCategories.id).notNull(),
  address: text("address").notNull(),
  city: varchar("city").notNull(),
  postalCode: varchar("postal_code").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  phone: varchar("phone"),
  openingHours: jsonb("opening_hours"), // { monday: "8:00-20:00", ... }
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  brand: varchar("brand"),
  category: varchar("category").notNull(),
  description: text("description"),
  unit: varchar("unit"), // kg, l, pièce, etc.
  barcode: varchar("barcode"),
  imageUrl: varchar("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prices table
export const prices = pgTable("prices", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isPromotion: boolean("is_promotion").default(false),
  promotionEndDate: timestamp("promotion_end_date"),
  isAvailable: boolean("is_available").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  source: varchar("source").default("scraping"), // scraping, user, admin
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User contributions table  
export const contributions = pgTable("contributions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  storeId: integer("store_id").references(() => stores.id),
  productId: integer("product_id").references(() => products.id),
  type: varchar("type").notNull(), // "price_update", "availability", "new_product", "new_store", "store_update", "add_product_to_store", "bug_report", "feature_request", "support"
  reportedPrice: decimal("reported_price", { precision: 10, scale: 2 }),
  reportedAvailability: boolean("reported_availability"),
  data: jsonb("data"), // Flexible data storage for various contribution types
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  photoUrl: varchar("photo_url"),
  comment: text("comment"),
  status: varchar("status").default("pending"), // "pending", "approved", "rejected"
  priority: varchar("priority").default("normal"), // "low", "normal", "high", "urgent"
  sourceType: varchar("source_type").default("manual"), // "manual", "api", "scraping", "bulk_import"
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"), // Internal admin notes
  adminResponse: text("admin_response"), // Response visible to user
  isResolved: boolean("is_resolved").default(false), // For support tickets
  severity: varchar("severity").default("low"), // "low", "medium", "high", "critical" - for bug reports
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Many-to-many relationship between stores and products
export const storeProducts = pgTable("store_products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  isAvailable: boolean("is_available").default(true),
  lastChecked: timestamp("last_checked").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  storeProductUnique: unique().on(table.storeId, table.productId),
}));

// Store ratings table
export const storeRatings = pgTable("store_ratings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product ratings table
export const productRatings = pgTable("product_ratings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Brand configuration table
export const brandConfigs = pgTable("brand_configs", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  displayName: varchar("display_name").notNull(),
  color: varchar("color").notNull(),
  logoUrl: varchar("logo_url"),
  imageUrl: varchar("image_url"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Price votes table - for users to vote on price accuracy
export const priceVotes = pgTable("price_votes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  priceId: integer("price_id").references(() => prices.id),
  storeId: integer("store_id").references(() => stores.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  voteType: varchar("vote_type").notNull(), // "correct", "incorrect", "outdated"
  suggestedPrice: decimal("suggested_price", { precision: 10, scale: 2 }),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique("user_price_vote").on(table.userId, table.storeId, table.productId)
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  contributions: many(contributions),
  storeRatings: many(storeRatings),
  productRatings: many(productRatings),
  priceVotes: many(priceVotes),
}));

export const storeCategoriesRelations = relations(storeCategories, ({ many }) => ({
  stores: many(stores),
}));

export const storesRelations = relations(stores, ({ many, one }) => ({
  category: one(storeCategories, {
    fields: [stores.categoryId],
    references: [storeCategories.id],
  }),
  prices: many(prices),
  contributions: many(contributions),
  ratings: many(storeRatings),
  storeProducts: many(storeProducts),
}));

export const productsRelations = relations(products, ({ many }) => ({
  prices: many(prices),
  contributions: many(contributions),
  ratings: many(productRatings),
  storeProducts: many(storeProducts),
}));

export const storeProductsRelations = relations(storeProducts, ({ one }) => ({
  store: one(stores, {
    fields: [storeProducts.storeId],
    references: [stores.id],
  }),
  product: one(products, {
    fields: [storeProducts.productId],
    references: [products.id],
  }),
}));

export const pricesRelations = relations(prices, ({ one, many }) => ({
  store: one(stores, {
    fields: [prices.storeId],
    references: [stores.id],
  }),
  product: one(products, {
    fields: [prices.productId],
    references: [products.id],
  }),
  votes: many(priceVotes),
}));

export const priceVotesRelations = relations(priceVotes, ({ one }) => ({
  user: one(users, {
    fields: [priceVotes.userId],
    references: [users.id],
  }),
  price: one(prices, {
    fields: [priceVotes.priceId],
    references: [prices.id],
  }),
  store: one(stores, {
    fields: [priceVotes.storeId],
    references: [stores.id],
  }),
  product: one(products, {
    fields: [priceVotes.productId],
    references: [products.id],
  }),
}));

export const contributionsRelations = relations(contributions, ({ one }) => ({
  user: one(users, {
    fields: [contributions.userId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [contributions.storeId],
    references: [stores.id],
  }),
  product: one(products, {
    fields: [contributions.productId],
    references: [products.id],
  }),
  reviewer: one(users, {
    fields: [contributions.reviewedBy],
    references: [users.id],
  }),
}));

export const storeRatingsRelations = relations(storeRatings, ({ one }) => ({
  user: one(users, {
    fields: [storeRatings.userId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [storeRatings.storeId],
    references: [stores.id],
  }),
}));

export const productRatingsRelations = relations(productRatings, ({ one }) => ({
  user: one(users, {
    fields: [productRatings.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [productRatings.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertStoreSchema = createInsertSchema(stores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceSchema = createInsertSchema(prices).omit({
  id: true,
  createdAt: true,
});

export const insertContributionSchema = createInsertSchema(contributions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
});

export const insertStoreProductSchema = createInsertSchema(storeProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastChecked: true,
});

export const insertStoreRatingSchema = createInsertSchema(storeRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductRatingSchema = createInsertSchema(productRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStoreCategorySchema = createInsertSchema(storeCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrandConfigSchema = createInsertSchema(brandConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPriceVoteSchema = createInsertSchema(priceVotes).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type StoreCategory = typeof storeCategories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Price = typeof prices.$inferSelect;
export type Contribution = typeof contributions.$inferSelect;
export type StoreRating = typeof storeRatings.$inferSelect;
export type ProductRating = typeof productRatings.$inferSelect;
export type StoreProduct = typeof storeProducts.$inferSelect;

export type InsertStore = z.infer<typeof insertStoreSchema>;
export type InsertStoreCategory = z.infer<typeof insertStoreCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertPrice = z.infer<typeof insertPriceSchema>;
export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type InsertStoreRating = z.infer<typeof insertStoreRatingSchema>;
export type InsertProductRating = z.infer<typeof insertProductRatingSchema>;
export type InsertStoreProduct = z.infer<typeof insertStoreProductSchema>;
export type BrandConfig = typeof brandConfigs.$inferSelect;
export type InsertBrandConfig = z.infer<typeof insertBrandConfigSchema>;
export type PriceVote = typeof priceVotes.$inferSelect;
export type InsertPriceVote = z.infer<typeof insertPriceVoteSchema>;

// Store with ratings
export interface StoreWithRating extends Store {
  averageRating: number;
  ratingCount: number;
  distance?: number;
  averageDiscount?: number;
}

// Product with price info
export interface ProductWithPrice extends Product {
  lowestPrice: number;
  storeCount: number;
  averageRating: number;
  ratingCount: number;
}

// Price comparison data
export interface PriceComparison {
  product: Product;
  prices: Array<{
    store: Store;
    price: number;
    isPromotion: boolean;
    isAvailable: boolean;
    distance?: number;
  }>;
}
