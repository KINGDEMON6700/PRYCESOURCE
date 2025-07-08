import { useState, useEffect } from "react";
import { Plus, Trash2, ShoppingCart, Check, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { ProductWithPrice, StoreWithRating } from "@shared/schema";

interface ShoppingListItem {
  id: string;
  productId: number;
  productName: string;
  productBrand?: string;
  quantity: number;
  bestPrice?: number;
  bestStore?: string;
  bestStoreId?: number;
  category?: string;
}

interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  totalBudget: number;
  createdAt: string;
}

export function ShoppingList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Load shopping lists from localStorage
  useEffect(() => {
    const savedLists = localStorage.getItem('pryce_shopping_lists');
    if (savedLists) {
      try {
        const parsedLists = JSON.parse(savedLists);
        setLists(parsedLists);
        if (parsedLists.length > 0) {
          setCurrentList(parsedLists[0]);
        }
      } catch (error) {
        // Handle invalid JSON
      }
    }
  }, []);

  // Save lists to localStorage whenever lists change
  useEffect(() => {
    localStorage.setItem('pryce_shopping_lists', JSON.stringify(lists));
  }, [lists]);

  // Search products for adding to list
  const { data: searchResults, isLoading: searchLoading } = useQuery<ProductWithPrice[]>({
    queryKey: ["/api/products/search", { q: searchQuery }],
    enabled: !!searchQuery.trim() && isAddProductDialogOpen,
  });

  const createNewList = () => {
    if (!newListName.trim()) return;
    
    const newList: ShoppingList = {
      id: Date.now().toString(),
      name: newListName,
      items: [],
      totalBudget: 0,
      createdAt: new Date().toISOString(),
    };
    
    setLists(prev => [newList, ...prev]);
    setCurrentList(newList);
    setNewListName("");
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Liste créée",
      description: `Liste "${newListName}" créée avec succès`,
    });
  };

  const addProductToList = async (product: ProductWithPrice) => {
    if (!currentList) return;
    
    // Check if product already in list
    const existingItem = currentList.items.find(item => item.productId === product.id);
    if (existingItem) {
      toast({
        title: "Produit déjà ajouté",
        description: "Ce produit est déjà dans votre liste",
        variant: "destructive",
      });
      return;
    }

    // Get best price info
    try {
      const priceResponse = await fetch(`/api/products/${product.id}/comparison`);
      const priceData = await priceResponse.json();
      
      let bestPrice = product.lowestPrice ? parseFloat(product.lowestPrice.toString()) : 0;
      let bestStore = "Aucun magasin";
      let bestStoreId = undefined;
      
      if (priceData.prices && priceData.prices.length > 0) {
        const sortedPrices = priceData.prices.sort((a: any, b: any) => a.price - b.price);
        bestPrice = sortedPrices[0].price;
        bestStore = sortedPrices[0].store.name;
        bestStoreId = sortedPrices[0].store.id;
      }

      const newItem: ShoppingListItem = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.name,
        productBrand: product.brand,
        quantity: selectedQuantity,
        bestPrice,
        bestStore,
        bestStoreId,
        category: product.category,
      };

      const updatedList = {
        ...currentList,
        items: [...currentList.items, newItem],
        totalBudget: currentList.totalBudget + (bestPrice * selectedQuantity),
      };

      setCurrentList(updatedList);
      setLists(prev => prev.map(list => list.id === currentList.id ? updatedList : list));
      setIsAddProductDialogOpen(false);
      setSearchQuery("");
      setSelectedQuantity(1);
      
      toast({
        title: "Produit ajouté",
        description: `${product.name} ajouté à votre liste`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le produit",
        variant: "destructive",
      });
    }
  };

  const removeItemFromList = (itemId: string) => {
    if (!currentList) return;
    
    const itemToRemove = currentList.items.find(item => item.id === itemId);
    if (!itemToRemove) return;
    
    const updatedList = {
      ...currentList,
      items: currentList.items.filter(item => item.id !== itemId),
      totalBudget: currentList.totalBudget - (itemToRemove.bestPrice! * itemToRemove.quantity),
    };
    
    setCurrentList(updatedList);
    setLists(prev => prev.map(list => list.id === currentList.id ? updatedList : list));
  };

  const deleteList = (listId: string) => {
    setLists(prev => prev.filter(list => list.id !== listId));
    if (currentList?.id === listId) {
      const remainingLists = lists.filter(list => list.id !== listId);
      setCurrentList(remainingLists.length > 0 ? remainingLists[0] : null);
    }
    
    toast({
      title: "Liste supprimée",
      description: "La liste a été supprimée",
    });
  };

  const findBestStores = () => {
    if (!currentList || currentList.items.length === 0) return;
    
    // Group items by best store and calculate totals
    const storeGroups = currentList.items.reduce((acc, item) => {
      if (!item.bestStoreId) return acc;
      
      if (!acc[item.bestStoreId]) {
        acc[item.bestStoreId] = {
          storeId: item.bestStoreId,
          storeName: item.bestStore!,
          items: [],
          total: 0,
        };
      }
      
      acc[item.bestStoreId].items.push(item);
      acc[item.bestStoreId].total += item.bestPrice! * item.quantity;
      
      return acc;
    }, {} as Record<number, any>);
    
    const sortedStores = Object.values(storeGroups).sort((a: any, b: any) => b.items.length - a.items.length);
    
    // Navigate to map with shopping list context
    navigate(`/map?shoppingList=${currentList.id}`);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Mes listes de courses
        </h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle liste
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Créer une nouvelle liste</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nom de la liste (ex: Courses du weekend)"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
              <div className="flex gap-2">
                <Button onClick={createNewList} disabled={!newListName.trim()}>
                  Créer
                </Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {lists.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-300 mb-4">Aucune liste de courses</p>
            <p className="text-sm text-gray-500 mb-4">Créez votre première liste pour commencer à comparer les prix</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer ma première liste
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* List selector */}
          {lists.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {lists.map((list) => (
                <Button
                  key={list.id}
                  variant={currentList?.id === list.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentList(list)}
                  className="whitespace-nowrap"
                >
                  {list.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteList(list.id);
                    }}
                    className="ml-2 p-0 h-4 w-4 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Button>
              ))}
            </div>
          )}

          {currentList && (
            <>
              {/* Current list */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">{currentList.name}</CardTitle>
                    <div className="flex gap-2">
                      <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" />
                            Ajouter
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-gray-700 max-w-[95vw] max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle className="text-white">Ajouter un produit</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Rechercher un produit..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="bg-gray-800 border-gray-600 text-white"
                            />
                            <div className="flex items-center gap-2">
                              <label className="text-white text-sm">Quantité:</label>
                              <Input
                                type="number"
                                min="1"
                                value={selectedQuantity}
                                onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                                className="bg-gray-800 border-gray-600 text-white w-20"
                              />
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                              {searchLoading ? (
                                <p className="text-gray-400 text-center py-4">Recherche...</p>
                              ) : searchResults?.length ? (
                                <div className="grid gap-2">
                                  {searchResults.map((product) => (
                                    <div
                                      key={product.id}
                                      onClick={() => addProductToList(product)}
                                      className="p-3 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                                    >
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <h4 className="text-white font-medium">{product.name}</h4>
                                          {product.brand && (
                                            <p className="text-sm text-gray-400">{product.brand}</p>
                                          )}
                                          <Badge variant="secondary" className="text-xs">
                                            {product.category}
                                          </Badge>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-blue-400 font-bold">
                                            {product.lowestPrice ? `${product.lowestPrice}€` : "Prix non dispo"}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {product.storeCount} magasin{product.storeCount > 1 ? 's' : ''}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : searchQuery ? (
                                <p className="text-gray-400 text-center py-4">Aucun produit trouvé</p>
                              ) : (
                                <p className="text-gray-400 text-center py-4">Tapez pour rechercher un produit</p>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {currentList.items.length > 0 && (
                        <Button
                          size="sm"
                          onClick={findBestStores}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          Optimiser
                        </Button>
                      )}
                    </div>
                  </div>
                  {currentList.items.length > 0 && (
                    <div className="text-sm text-gray-400">
                      {currentList.items.length} produit{currentList.items.length > 1 ? 's' : ''} • 
                      Budget estimé: <span className="text-green-400 font-bold">{currentList.totalBudget.toFixed(2)}€</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {currentList.items.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-2">Liste vide</p>
                      <p className="text-sm text-gray-500">Ajoutez des produits pour commencer</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentList.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{item.productName}</h4>
                            {item.productBrand && (
                              <p className="text-sm text-gray-400">{item.productBrand}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {item.category}
                              </Badge>
                              <span className="text-xs text-gray-500">Qté: {item.quantity}</span>
                            </div>
                          </div>
                          <div className="text-right mr-3">
                            <p className="text-blue-400 font-bold">
                              {item.bestPrice ? `${(item.bestPrice * item.quantity).toFixed(2)}€` : "N/A"}
                            </p>
                            <p className="text-xs text-gray-500">{item.bestStore}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemFromList(item.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}