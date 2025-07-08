import { useState, useEffect, useMemo } from "react";
import { Search, Filter, MapPin, Package, ShoppingCart, Eye, Edit, Trash2, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { toast } from "@/components/ui/use-toast";
import type { StoreWithRating, ProductWithPrice, StoreProduct } from "@shared/schema";

interface AdminUnifiedSearchProps {
  onStoreEdit?: (store: StoreWithRating) => void;
  onProductEdit?: (product: ProductWithPrice) => void;
  onStoreDelete?: (storeId: number) => void;
  onProductDelete?: (productId: number) => void;
}

export function AdminUnifiedSearch({
  onStoreEdit,
  onProductEdit,
  onStoreDelete,
  onProductDelete
}: AdminUnifiedSearchProps) {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<"stores" | "products" | "relationships">("stores");
  const [selectedStore, setSelectedStore] = useState<StoreWithRating | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [brandFilter, setBrandFilter] = useState<string>("");

  // Fetch stores
  const { data: stores = [], isLoading: storesLoading } = useQuery<StoreWithRating[]>({
    queryKey: ["/api/stores"],
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<ProductWithPrice[]>({
    queryKey: ["/api/products"],
  });

  // Fetch store products when a store is selected
  const { data: storeProducts = [], isLoading: storeProductsLoading } = useQuery<StoreProduct[]>({
    queryKey: [`/api/stores/${selectedStore?.id}/products`],
    enabled: !!selectedStore,
  });

  // Filter stores based on search and filters
  const filteredStores = useMemo(() => {
    let filtered = stores;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchLower) ||
        store.city.toLowerCase().includes(searchLower) ||
        store.address.toLowerCase().includes(searchLower)
      );
    }

    if (brandFilter) {
      filtered = filtered.filter(store => store.brand === brandFilter);
    }

    return filtered;
  }, [stores, searchTerm, brandFilter]);

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      );
    }

    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    if (brandFilter && brandFilter !== "all") {
      filtered = filtered.filter(product => product.brand === brandFilter);
    }

    return filtered;
  }, [products, searchTerm, categoryFilter, brandFilter]);

  // Get unique categories and brands for filters
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const brands = [...new Set([
    ...stores.map(s => s.brand).filter(Boolean),
    ...products.map(p => p.brand).filter(Boolean)
  ])];

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setBrandFilter("");
    setSelectedStore(null);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche unifiée
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher des magasins, produits, adresses..."
              className="pl-10 bg-gray-700 border-gray-600 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Filtrer par marque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les marques</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTab === "products" && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Filtrer par catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(searchTerm || categoryFilter || brandFilter) && (
              <Button variant="outline" onClick={clearFilters} className="text-white border-gray-600">
                <Filter className="h-4 w-4 mr-2" />
                Effacer les filtres
              </Button>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-400">
            {selectedTab === "stores" && `${filteredStores.length} magasin(s) trouvé(s)`}
            {selectedTab === "products" && `${filteredProducts.length} produit(s) trouvé(s)`}
            {searchTerm && ` pour "${searchTerm}"`}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stores">
            <MapPin className="h-4 w-4 mr-2" />
            Magasins ({filteredStores.length})
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Produits ({filteredProducts.length})
          </TabsTrigger>
          <TabsTrigger value="relationships">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Relations
          </TabsTrigger>
        </TabsList>

        {/* Stores Tab */}
        <TabsContent value="stores" className="space-y-4">
          {storesLoading ? (
            <div className="text-center py-8">Chargement des magasins...</div>
          ) : filteredStores.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Aucun magasin trouvé
                </h3>
                <p className="text-gray-400">
                  Essayez de modifier vos critères de recherche.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredStores.map((store) => (
                <Card key={store.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {store.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {store.brand}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {store.city}, {store.postalCode}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          {store.address}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>⭐ {store.averageRating.toFixed(1)} ({store.ratingCount} avis)</span>
                          {store.phone && <span>📞 {store.phone}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/stores/${store.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStoreEdit?.(store)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onStoreDelete?.(store.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          {productsLoading ? (
            <div className="text-center py-8">Chargement des produits...</div>
          ) : filteredProducts.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="text-gray-400">
                  Essayez de modifier vos critères de recherche.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <img
                          src={product.imageUrl || `https://images.unsplash.com/photo-1506617420156-8e4536971650?w=80&h=80&fit=crop&crop=center&auto=format&q=${encodeURIComponent(product.name.toLowerCase())}`}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1506617420156-8e4536971650?w=80&h=80&fit=crop&crop=center&auto=format";
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {product.brand}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {product.category}
                            </Badge>
                            {product.unit && (
                              <span className="text-xs text-gray-400">
                                {product.unit}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-blue-400 font-semibold">
                              €{product.lowestPrice.toFixed(2)}
                            </span>
                            <span className="text-gray-400">
                              dans {product.storeCount} magasin(s)
                            </span>
                            <span className="text-yellow-400">
                              ⭐ {product.averageRating.toFixed(1)} ({product.ratingCount})
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onProductEdit?.(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onProductDelete?.(product.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Store Selection */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Sélectionner un magasin</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredStores.slice(0, 5).map((store) => (
                  <div
                    key={store.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedStore?.id === store.id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedStore(store)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{store.name}</h4>
                        <p className="text-sm text-gray-400">{store.city}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {store.brand}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Store Products */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Produits du magasin
                  {selectedStore && ` - ${selectedStore.name}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedStore ? (
                  <p className="text-gray-400 text-center py-8">
                    Sélectionnez un magasin pour voir ses produits
                  </p>
                ) : storeProductsLoading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : storeProducts.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    Aucun produit dans ce magasin
                  </p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {storeProducts.map((storeProduct) => (
                      <div key={storeProduct.id} className="flex items-center justify-between p-3 border border-gray-600 rounded-lg">
                        <div className="flex-1">
                          <h4 className="text-white font-medium">
                            {storeProduct.product?.name || 'Produit inconnu'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {storeProduct.product?.brand || 'Sans marque'}
                            </Badge>
                            <span className="text-sm text-gray-400">
                              {storeProduct.product?.category || 'Sans catégorie'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-blue-400 font-semibold">
                            €{storeProduct.price?.toFixed(2) || 'N/A'}
                          </span>
                          <div className="text-xs text-gray-400">
                            {storeProduct.isAvailable ? 'Disponible' : 'Indisponible'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}