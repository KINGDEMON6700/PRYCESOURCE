import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Trash2, Edit2, Check, X, ShoppingCart, Share2 } from "lucide-react";
import { StandardHeader } from "@/components/StandardHeader";
import { BottomNavigation } from "@/components/BottomNavigation";
import { SearchWithAutocomplete } from "@/components/SearchWithAutocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ProductWithPrice } from "@shared/schema";

interface ShoppingListItem {
  id: string;
  productId: number;
  productName: string;
  productBrand?: string;
  quantity: number;
  unit?: string;
  completed: boolean;
  notes?: string;
  estimatedPrice?: number;
}

interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: string;
  totalEstimatedPrice: number;
  completedItems: number;
}

export default function ShoppingListPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Get shopping lists from localStorage
  const { data: shoppingLists, refetch } = useQuery<ShoppingList[]>({
    queryKey: ["/api/shopping-lists"],
    queryFn: () => {
      const saved = localStorage.getItem("pryce_shopping_lists");
      return saved ? JSON.parse(saved) : [];
    },
  });

  // Save to localStorage
  const saveToStorage = (lists: ShoppingList[]) => {
    localStorage.setItem("pryce_shopping_lists", JSON.stringify(lists));
    queryClient.invalidateQueries({ queryKey: ["/api/shopping-lists"] });
  };

  // Create new list
  const createListMutation = useMutation({
    mutationFn: async (name: string) => {
      const newList: ShoppingList = {
        id: `list_${Date.now()}`,
        name,
        items: [],
        createdAt: new Date().toISOString(),
        totalEstimatedPrice: 0,
        completedItems: 0,
      };
      
      const currentLists = shoppingLists || [];
      const updatedLists = [...currentLists, newList];
      saveToStorage(updatedLists);
      
      return newList;
    },
    onSuccess: (newList) => {
      setSelectedList(newList.id);
      setIsCreateDialogOpen(false);
      setNewListName("");
      toast({
        title: "Liste créée",
        description: `"${newList.name}" a été créée avec succès.`,
      });
    },
  });

  // Add item to list
  const addItemMutation = useMutation({
    mutationFn: async ({ listId, product, quantity = 1 }: { 
      listId: string; 
      product: ProductWithPrice; 
      quantity?: number;
    }) => {
      const currentLists = shoppingLists || [];
      const listIndex = currentLists.findIndex(list => list.id === listId);
      
      if (listIndex === -1) throw new Error("Liste non trouvée");
      
      const newItem: ShoppingListItem = {
        id: `item_${Date.now()}`,
        productId: product.id,
        productName: product.name,
        productBrand: product.brand,
        quantity,
        unit: product.unit,
        completed: false,
        estimatedPrice: product.lowestPrice > 0 ? product.lowestPrice * quantity : undefined,
      };
      
      const updatedLists = [...currentLists];
      updatedLists[listIndex].items.push(newItem);
      updatedLists[listIndex].totalEstimatedPrice = updatedLists[listIndex].items
        .reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
      
      saveToStorage(updatedLists);
      return newItem;
    },
    onSuccess: () => {
      toast({
        title: "Produit ajouté",
        description: "Le produit a été ajouté à votre liste.",
      });
    },
  });

  // Toggle item completion
  const toggleItemMutation = useMutation({
    mutationFn: async ({ listId, itemId }: { listId: string; itemId: string }) => {
      const currentLists = shoppingLists || [];
      const listIndex = currentLists.findIndex(list => list.id === listId);
      const list = currentLists[listIndex];
      const itemIndex = list.items.findIndex(item => item.id === itemId);
      
      const updatedLists = [...currentLists];
      updatedLists[listIndex].items[itemIndex].completed = !updatedLists[listIndex].items[itemIndex].completed;
      updatedLists[listIndex].completedItems = updatedLists[listIndex].items
        .filter(item => item.completed).length;
      
      saveToStorage(updatedLists);
    },
  });

  // Delete item
  const deleteItemMutation = useMutation({
    mutationFn: async ({ listId, itemId }: { listId: string; itemId: string }) => {
      const currentLists = shoppingLists || [];
      const listIndex = currentLists.findIndex(list => list.id === listId);
      
      const updatedLists = [...currentLists];
      updatedLists[listIndex].items = updatedLists[listIndex].items.filter(item => item.id !== itemId);
      updatedLists[listIndex].totalEstimatedPrice = updatedLists[listIndex].items
        .reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
      updatedLists[listIndex].completedItems = updatedLists[listIndex].items
        .filter(item => item.completed).length;
      
      saveToStorage(updatedLists);
    },
  });

  // Update item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ listId, itemId, quantity }: { 
      listId: string; 
      itemId: string; 
      quantity: number;
    }) => {
      const currentLists = shoppingLists || [];
      const listIndex = currentLists.findIndex(list => list.id === listId);
      const list = currentLists[listIndex];
      const itemIndex = list.items.findIndex(item => item.id === itemId);
      
      const updatedLists = [...currentLists];
      const item = updatedLists[listIndex].items[itemIndex];
      item.quantity = quantity;
      
      if (item.estimatedPrice) {
        const unitPrice = item.estimatedPrice / (item.quantity || 1);
        item.estimatedPrice = unitPrice * quantity;
      }
      
      updatedLists[listIndex].totalEstimatedPrice = updatedLists[listIndex].items
        .reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
      
      saveToStorage(updatedLists);
    },
  });

  // Delete list
  const deleteListMutation = useMutation({
    mutationFn: async (listId: string) => {
      const currentLists = shoppingLists || [];
      const updatedLists = currentLists.filter(list => list.id !== listId);
      saveToStorage(updatedLists);
    },
    onSuccess: () => {
      setSelectedList(null);
      toast({
        title: "Liste supprimée",
        description: "La liste a été supprimée avec succès.",
      });
    },
  });

  const currentList = shoppingLists?.find(list => list.id === selectedList);

  // Auto-select first list if none selected
  useEffect(() => {
    if (!selectedList && shoppingLists && shoppingLists.length > 0) {
      setSelectedList(shoppingLists[0].id);
    }
  }, [shoppingLists, selectedList]);

  const shareList = () => {
    if (!currentList) return;
    
    const listText = `🛒 Liste: ${currentList.name}\n\n` +
      currentList.items.map((item, index) => 
        `${index + 1}. ${item.productName}${item.productBrand ? ` (${item.productBrand})` : ''} - ${item.quantity}${item.unit ? ` ${item.unit}` : ''}`
      ).join('\n') +
      `\n\n💰 Prix estimé: ${currentList.totalEstimatedPrice.toFixed(2)}€\n\n📱 Créé avec Pryce`;

    if (navigator.share) {
      navigator.share({
        title: `Liste de courses: ${currentList.name}`,
        text: listText,
      });
    } else {
      navigator.clipboard.writeText(listText);
      toast({
        title: "Liste copiée",
        description: "La liste a été copiée dans le presse-papiers.",
      });
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-gray-900 min-h-screen relative">
      <StandardHeader 
        title="Listes de courses"
        showBackButton={true}
      />

      <div className="pt-16 pb-20">
        {/* Lists selector */}
        {shoppingLists && shoppingLists.length > 0 && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-white font-semibold">Mes listes</h2>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Nouvelle liste</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Nom de la liste..."
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => newListName.trim() && createListMutation.mutate(newListName.trim())}
                        disabled={!newListName.trim() || createListMutation.isPending}
                        className="flex-1"
                      >
                        Créer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {shoppingLists.map((list) => (
                <Button
                  key={list.id}
                  variant={selectedList === list.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedList(list.id)}
                  className="whitespace-nowrap"
                >
                  {list.name} ({list.items.length})
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Add products search */}
        {currentList && (
          <div className="p-4 border-b border-gray-700">
            <SearchWithAutocomplete
              placeholder="Ajouter un produit..."
              showRecentSearches={false}
              onProductSelect={(product) => 
                addItemMutation.mutate({ listId: currentList.id, product })
              }
            />
          </div>
        )}

        {/* List content */}
        {currentList ? (
          <div className="p-4">
            {/* List header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">{currentList.name}</h3>
                <p className="text-gray-400 text-sm">
                  {currentList.completedItems}/{currentList.items.length} terminés
                  {currentList.totalEstimatedPrice > 0 && (
                    ` • ~${currentList.totalEstimatedPrice.toFixed(2)}€`
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={shareList}
                  className="h-8 w-8 p-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteListMutation.mutate(currentList.id)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Items */}
            {currentList.items.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Votre liste est vide</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Utilisez la recherche ci-dessus pour ajouter des produits
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {currentList.items.map((item) => (
                  <Card 
                    key={item.id} 
                    className={`bg-gray-800 border-gray-700 transition-opacity ${
                      item.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => 
                            toggleItemMutation.mutate({ 
                              listId: currentList.id, 
                              itemId: item.id 
                            })
                          }
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-white font-medium ${
                              item.completed ? 'line-through' : ''
                            }`}>
                              {item.productName}
                            </h4>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingItem(
                                  editingItem === item.id ? null : item.id
                                )}
                                className="h-6 w-6 p-0"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => 
                                  deleteItemMutation.mutate({ 
                                    listId: currentList.id, 
                                    itemId: item.id 
                                  })
                                }
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {item.productBrand && (
                            <p className="text-gray-400 text-xs">{item.productBrand}</p>
                          )}
                          
                          <div className="flex items-center justify-between mt-1">
                            {editingItem === item.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const quantity = parseInt(e.target.value) || 1;
                                    updateQuantityMutation.mutate({
                                      listId: currentList.id,
                                      itemId: item.id,
                                      quantity
                                    });
                                  }}
                                  className="w-16 h-6 text-xs bg-gray-700 border-gray-600"
                                />
                                <span className="text-xs text-gray-400">{item.unit || 'unité(s)'}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingItem(null)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">
                                {item.quantity} {item.unit || 'unité(s)'}
                              </span>
                            )}
                            
                            {item.estimatedPrice && (
                              <span className="text-xs text-blue-400">
                                ~{item.estimatedPrice.toFixed(2)}€
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // No lists
          <div className="p-8 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Aucune liste de courses</h3>
            <p className="text-gray-400 mb-4">
              Créez votre première liste pour commencer à organiser vos achats
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer ma première liste
            </Button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}