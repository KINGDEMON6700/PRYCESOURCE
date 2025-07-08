import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";

export function registerBarcodeRoutes(app: Express) {
  // Search product by barcode
  app.get('/api/products/barcode/:barcode', async (req, res) => {
    try {
      const { barcode } = req.params;
      
      // Search for product with this barcode
      const products = await storage.getProducts();
      const product = products.find(p => p.barcode === barcode);
      
      if (!product) {
        return res.status(404).json({ 
          message: "Product not found", 
          barcode,
          suggestions: [] 
        });
      }
      
      // Get price comparison for the product
      const comparison = await storage.getPriceComparison(product.id);
      
      res.json({
        product,
        priceComparison: comparison,
        message: "Product found successfully"
      });
    } catch (error) {
      // Barcode search error occurred
      res.status(500).json({ message: "Failed to search by barcode" });
    }
  });

  // Get nearby stores with this product
  app.get('/api/products/barcode/:barcode/nearby', async (req, res) => {
    try {
      const { barcode } = req.params;
      const { latitude, longitude, radius = 10 } = req.query;
      
      // Find product by barcode
      const products = await storage.getProducts();
      const product = products.find(p => p.barcode === barcode);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Get nearby stores
      let stores;
      if (latitude && longitude) {
        stores = await storage.getStoresByLocation(
          parseFloat(latitude as string),
          parseFloat(longitude as string),
          parseFloat(radius as string)
        );
      } else {
        stores = await storage.getStores();
      }
      
      // Get stores that have this product
      const storeProducts = await storage.getProductStores(product.id);
      const storesWithProduct = stores.filter(store => 
        storeProducts.some(sp => sp.storeId === store.id)
      );
      
      // Get prices for each store
      const storesWithPrices = await Promise.all(
        storesWithProduct.map(async (store) => {
          const prices = await storage.getPricesByStore(store.id);
          const productPrice = prices.find(p => p.productId === product.id);
          
          return {
            ...store,
            price: productPrice ? parseFloat(productPrice.price.toString()) : null,
            isAvailable: productPrice ? productPrice.isAvailable : false,
            isPromotion: productPrice ? productPrice.isPromotion : false,
            lastUpdated: productPrice ? productPrice.lastUpdated : null
          };
        })
      );
      
      // Sort by price (available first, then by price)
      storesWithPrices.sort((a, b) => {
        if (a.isAvailable && !b.isAvailable) return -1;
        if (!a.isAvailable && b.isAvailable) return 1;
        if (a.price === null && b.price === null) return 0;
        if (a.price === null) return 1;
        if (b.price === null) return -1;
        return a.price - b.price;
      });
      
      res.json({
        product,
        stores: storesWithPrices,
        totalStores: storesWithPrices.length,
        searchRadius: radius
      });
    } catch (error) {
      // Nearby stores search error occurred
      res.status(500).json({ message: "Failed to find nearby stores" });
    }
  });

  // Report product with barcode (for contributing new products)
  app.post('/api/products/barcode/report', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { barcode, productName, brand, category, storeId, price, photoUrl } = req.body;
      
      if (!barcode || !productName) {
        return res.status(400).json({ message: "Barcode and product name are required" });
      }
      
      // Check if product with this barcode already exists
      const products = await storage.getProducts();
      const existingProduct = products.find(p => p.barcode === barcode);
      
      if (existingProduct) {
        return res.status(409).json({ 
          message: "Product with this barcode already exists",
          existingProduct
        });
      }
      
      // Create contribution for new product
      const contribution = await storage.createContribution({
        userId,
        type: 'new_product',
        data: {
          name: productName,
          brand: brand || '',
          category: category || 'Autre',
          barcode,
          imageUrl: photoUrl || null
        },
        storeId: storeId ? parseInt(storeId) : undefined,
        reportedPrice: price ? parseFloat(price) : undefined,
        comment: `Nouveau produit scanné via code-barres: ${barcode}`,
        status: 'pending',
        priority: 'normal'
      });
      
      res.status(201).json({
        message: "Product report submitted successfully",
        contribution,
        barcode
      });
    } catch (error) {
      // Barcode report error occurred
      res.status(500).json({ message: "Failed to report product" });
    }
  });
}