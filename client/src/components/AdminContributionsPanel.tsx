import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare, 
  User, 
  Store, 
  Package, 
  AlertTriangle, 
  FileText,
  Euro,
  CheckCheck,
  Plus,
  Shield,
  Eye,
  Trash2,
  Download,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  BarChart3,
  Target,
  Settings,
  ShoppingCart
} from "lucide-react";

// Composant pour afficher la comparaison de prix avec données réelles
function PriceComparisonDisplay({ storeId, productId, reportedPrice }: { 
  storeId: number; 
  productId: number; 
  reportedPrice: number;
}) {
  const { data: currentPrice } = useQuery({
    queryKey: [`/api/stores/${storeId}/products`, storeId],
    queryFn: async () => {
      const response = await fetch(`/api/stores/${storeId}/products`);
      if (!response.ok) return null;
      const products = await response.json();
      const productInStore = products.find((p: any) => p.productId === productId);
      return productInStore?.price || null;
    },
    enabled: !!(storeId && productId),
  });

  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      <div className="bg-orange-900/30 border border-orange-600 rounded p-2">
        <p className="text-xs font-medium text-orange-200 mb-1">Prix actuel</p>
        <p className="text-lg font-bold text-orange-100">
          {currentPrice ? `€${currentPrice}` : "Non renseigné"}
        </p>
      </div>
      <div className="bg-green-900/30 border border-green-600 rounded p-2">
        <p className="text-xs font-medium text-green-200 mb-1">Prix proposé</p>
        <p className="text-lg font-bold text-green-100">€{reportedPrice}</p>
      </div>
    </div>
  );
}

// Composant pour afficher les modifications de magasin avec données réelles
function StoreUpdateDisplay({ storeId, updateData }: { 
  storeId: number; 
  updateData: any;
}) {
  const { data: currentStore } = useQuery({
    queryKey: [`/api/stores/${storeId}`, storeId],
    queryFn: async () => {
      const response = await fetch(`/api/stores/${storeId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!storeId,
  });

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      name: "Nom",
      address: "Adresse", 
      city: "Ville",
      phone: "Téléphone",
      openingHours: "Heures d'ouverture"
    };
    return labels[field] || field;
  };

  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      <div className="bg-orange-900/30 border border-orange-600 rounded p-2">
        <p className="text-xs font-medium text-orange-200 mb-1">Informations actuelles</p>
        <div className="text-sm text-orange-100">
          {updateData.field && currentStore && (
            <div>
              <span className="font-medium">{getFieldLabel(updateData.field)}:</span>{" "}
              {currentStore[updateData.field] || "Non renseigné"}
            </div>
          )}
        </div>
      </div>
      <div className="bg-green-900/30 border border-green-600 rounded p-2">
        <p className="text-xs font-medium text-green-200 mb-1">Corrections proposées</p>
        <div className="text-sm text-green-100">
          {updateData.field && (
            <div>
              <span className="font-medium">{getFieldLabel(updateData.field)}:</span>{" "}
              {updateData.suggestedValue}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface Contribution {
  id: number;
  userId: string;
  storeId?: number;
  productId?: number;
  type: string;
  reportedPrice?: number;
  reportedAvailability?: boolean;
  data?: any;
  comment?: string;
  status: string;
  priority: string;
  severity?: string;
  isResolved?: boolean;
  adminResponse?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  store?: {
    id: number;
    name: string;
    brand: string;
    address?: string;
    city?: string;
  };
  product?: {
    id: number;
    name: string;
    brand?: string;
    category?: string;
  };
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export function AdminContributionsPanel() {
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [selectedContributions, setSelectedContributions] = useState<number[]>([]);
  const [adminNotes, setAdminNotes] = useState("");
  const [adminResponse, setAdminResponse] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Render contribution content based on type
  const renderContributionContent = (contribution: any) => {
    // Handle "both" type contributions by showing the comment and data
    if (contribution.type === "both") {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            <span className="font-medium text-white">Signalement général</span>
          </div>
          
          {contribution.comment && (
            <div className="text-sm text-gray-300 mb-2">
              <span className="font-medium text-white">Message :</span> {contribution.comment}
            </div>
          )}
          
          {contribution.data && Object.keys(contribution.data).length > 0 && (
            <div className="bg-gray-900 rounded p-3 space-y-1">
              <div className="text-xs font-medium text-gray-400 mb-1">Détails :</div>
              {Object.entries(contribution.data).map(([key, value]) => (
                <div key={key} className="text-sm text-gray-300">
                  <span className="font-medium text-white capitalize">{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    switch (contribution.type) {
      case "price_update":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="h-4 w-4 text-yellow-400" />
              <span className="font-medium text-white">Correction de prix</span>
            </div>
            
            {contribution.product && (
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <Package className="h-4 w-4" />
                <span>{contribution.product.name}</span>
                {contribution.product.brand && <span className="text-gray-400">- {contribution.product.brand}</span>}
              </div>
            )}
            
            {contribution.store && (
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                <Store className="h-4 w-4" />
                <span>{contribution.store.name}</span>
                <span className="text-gray-400">({contribution.store.city})</span>
              </div>
            )}

            {contribution.reportedPrice !== null && contribution.reportedPrice !== undefined && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-900/30 border border-red-600 rounded p-2">
                  <p className="text-xs font-medium text-red-200 mb-1">Prix actuel</p>
                  <p className="text-lg font-bold text-red-100">Non trouvé</p>
                </div>
                <div className="bg-green-900/30 border border-green-600 rounded p-2">
                  <p className="text-xs font-medium text-green-200 mb-1">Prix proposé</p>
                  <p className="text-lg font-bold text-green-100">{contribution.reportedPrice}€</p>
                </div>
              </div>
            )}
            
            {contribution.reportedAvailability !== null && contribution.reportedAvailability !== undefined && (
              <div className="bg-red-900/30 border border-red-600 rounded p-3">
                <p className="text-xs font-medium text-red-200 mb-1">Disponibilité signalée</p>
                <p className="text-lg font-bold text-red-100">
                  {contribution.reportedAvailability ? "Disponible" : "Non disponible"}
                </p>
              </div>
            )}
          </div>
        );

      case "new_store":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Store className="h-4 w-4 text-green-400" />
              <span className="font-medium text-white">Nouveau magasin</span>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              {contribution.data?.suggestedName && (
                <div><span className="font-medium text-white">Nom :</span> {contribution.data.suggestedName}</div>
              )}
              {contribution.data?.suggestedAddress && (
                <div><span className="font-medium text-white">Adresse :</span> {contribution.data.suggestedAddress}</div>
              )}
              {contribution.data?.suggestedBrand && (
                <div><span className="font-medium text-white">Enseigne :</span> {contribution.data.suggestedBrand}</div>
              )}
            </div>
          </div>
        );

      case "new_product":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-green-400" />
              <span className="font-medium text-white">Nouveau produit</span>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              {contribution.data?.suggestedName && (
                <div><span className="font-medium text-white">Nom :</span> {contribution.data.suggestedName}</div>
              )}
              {contribution.data?.suggestedBrand && (
                <div><span className="font-medium text-white">Marque :</span> {contribution.data.suggestedBrand}</div>
              )}
              {contribution.data?.suggestedCategory && (
                <div><span className="font-medium text-white">Catégorie :</span> {contribution.data.suggestedCategory}</div>
              )}
            </div>
          </div>
        );

      case "add_product_to_store":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-white">Ajouter produit au magasin</span>
            </div>
            <div className="space-y-2 text-sm text-gray-300">
              {contribution.data?.productName && (
                <div><span className="font-medium text-white">Produit :</span> {contribution.data.productName}</div>
              )}
              {contribution.data?.storeName && (
                <div><span className="font-medium text-white">Magasin :</span> {contribution.data.storeName}</div>
              )}
              {contribution.data?.price && (
                <div><span className="font-medium text-white">Prix suggéré :</span> €{contribution.data.price}</div>
              )}
              {contribution.store && (
                <div><span className="font-medium text-white">Magasin :</span> {contribution.store.name} ({contribution.store.brand})</div>
              )}
            </div>
          </div>
        );

      case "bug_report":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="font-medium text-white">Signalement de bug</span>
            </div>
            {contribution.data?.steps && (
              <div className="text-sm text-gray-300">
                <span className="font-medium text-white">Étapes :</span>
                <p className="text-gray-300 mt-1">{contribution.data.steps}</p>
              </div>
            )}
          </div>
        );

      case "feature_request":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-400" />
              <span className="font-medium text-white">Demande de fonctionnalité</span>
            </div>
            {contribution.data?.featureDescription && (
              <div className="text-sm text-gray-300">
                <span className="font-medium text-white">Description :</span>
                <p className="text-gray-300 mt-1">{contribution.data.featureDescription}</p>
              </div>
            )}
          </div>
        );

      case "availability":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="font-medium text-white">Signalement de disponibilité</span>
            </div>
            
            {contribution.product && (
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <Package className="h-4 w-4" />
                <span>{contribution.product.name}</span>
                {contribution.product.brand && <span className="text-gray-400">- {contribution.product.brand}</span>}
              </div>
            )}
            
            {contribution.store && (
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                <Store className="h-4 w-4" />
                <span>{contribution.store.name}</span>
                <span className="text-gray-400">({contribution.store.city})</span>
              </div>
            )}

            {contribution.reportedAvailability !== null && contribution.reportedAvailability !== undefined && (
              <div className={`border rounded p-3 ${
                contribution.reportedAvailability 
                  ? 'bg-green-900/30 border-green-600' 
                  : 'bg-red-900/30 border-red-600'
              }`}>
                <p className={`text-xs font-medium mb-1 ${
                  contribution.reportedAvailability 
                    ? 'text-green-200' 
                    : 'text-red-200'
                }`}>
                  Disponibilité signalée
                </p>
                <p className={`text-lg font-bold ${
                  contribution.reportedAvailability 
                    ? 'text-green-100' 
                    : 'text-red-100'
                }`}>
                  {contribution.reportedAvailability ? "Disponible" : "Non disponible"}
                </p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-white">Autre signalement</span>
            </div>
          </div>
        );
    }
  };

  // Fetch all contributions (filtering happens client-side via tabs)
  const { data: contributions = [], isLoading, error } = useQuery<Contribution[]>({
    queryKey: ["/api/admin/contributions"],
    queryFn: async () => {
      const response = await fetch("/api/admin/contributions", {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user, // Only fetch if user is authenticated
  });

  // Filter contributions based on active tab only
  const filteredContributions = useMemo(() => {
    if (!contributions || !Array.isArray(contributions)) {
      // Données de contributions récupérées
      return [];
    }

    return contributions.filter((contribution) => {
      // Exclure les contributions supprimées de tous les onglets
      if (contribution.status === "deleted") return false;
      
      switch (activeTab) {
        case "pending":
          return contribution.status === "pending";
        case "support":
          return ["bug_report", "feature_request", "support"].includes(contribution.type);
        case "content":
          return ["new_store", "new_product", "store_update", "add_product_to_store"].includes(contribution.type);
        case "prices":
          return ["price_update", "availability"].includes(contribution.type);
        case "approved":
          return contribution.status === "approved";
        case "all":
        default:
          return true;
      }
    });
  }, [contributions, activeTab]);

  // Approve contribution mutation
  const approveContributionMutation = useMutation({
    mutationFn: async ({ id, adminNotes, adminResponse }: { id: number; adminNotes?: string; adminResponse?: string }) => {
      return apiRequest("PATCH", `/api/admin/contributions/${id}/approve`, {
        adminNotes,
        adminResponse,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contributions"] });
      toast({ title: "Contribution approuvée", description: "La contribution a été approuvée avec succès." });
      setSelectedContribution(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'approuver la contribution.", variant: "destructive" });
    },
  });

  // Reject contribution mutation
  const rejectContributionMutation = useMutation({
    mutationFn: async ({ id, adminNotes, adminResponse }: { id: number; adminNotes?: string; adminResponse?: string }) => {
      return apiRequest("PATCH", `/api/admin/contributions/${id}/reject`, {
        adminNotes,
        adminResponse,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contributions"] });
      toast({ title: "Contribution rejetée", description: "La contribution a été rejetée." });
      setSelectedContribution(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de rejeter la contribution.", variant: "destructive" });
    },
  });

  // Update contribution mutation (for support/bug reports)
  const updateContributionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PUT", `/api/admin/contributions/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contributions"] });
      toast({ title: "Contribution mise à jour", description: "La contribution a été mise à jour avec succès." });
      setSelectedContribution(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour la contribution.", variant: "destructive" });
    },
  });

  // Bulk reject mutation
  const bulkRejectMutation = useMutation({
    mutationFn: async ({ contributionIds, reason }: { contributionIds: number[]; reason?: string }) => {
      return apiRequest("POST", "/api/admin/contributions/bulk-reject", { contributionIds, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contributions"] });
      toast({ title: "Contributions rejetées", description: `${selectedContributions.length} contributions ont été rejetées.` });
      setSelectedContributions([]);
      setBulkRejectReason("");
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de rejeter les contributions en masse.", variant: "destructive" });
    },
  });

  // Delete contribution mutation
  const deleteContributionMutation = useMutation({
    mutationFn: async (contributionIds: number[]) => {
      return apiRequest("DELETE", "/api/admin/contributions/bulk-delete", { contributionIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contributions"] });
      toast({ title: "Contributions supprimées", description: `${selectedContributions.length} contributions ont été supprimées définitivement.` });
      setSelectedContributions([]);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer les contributions.", variant: "destructive" });
    },
  });



  const getTypeIcon = (type: string) => {
    switch (type) {
      case "price_update": return <Euro className="h-4 w-4" />;
      case "availability": return <Package className="h-4 w-4" />;
      case "new_product": return <Package className="h-4 w-4" />;
      case "new_store": return <Store className="h-4 w-4" />;
      case "store_update": return <Settings className="h-4 w-4" />;
      case "add_product_to_store": return <ShoppingCart className="h-4 w-4" />;
      case "bug_report": return <Bug className="h-4 w-4" />;
      case "feature_request": return <Lightbulb className="h-4 w-4" />;
      case "support": return <HelpCircle className="h-4 w-4" />;
      case "both": return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "price_update": return "Mise à jour prix";
      case "availability": return "Disponibilité";
      case "new_product": return "Nouveau produit";
      case "new_store": return "Nouveau magasin";
      case "store_update": return "Modification magasin";
      case "add_product_to_store": return "Ajout produit au catalogue";
      case "bug_report": return "Signalement de bug";
      case "feature_request": return "Demande de fonctionnalité";
      case "support": return "Support technique";
      case "both": return "Signalement général";
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "normal": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "low": return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const handleApproveContribution = async () => {
    if (!selectedContribution) return;
    await approveContributionMutation.mutateAsync({
      id: selectedContribution.id,
      adminNotes,
      adminResponse,
    });
  };

  const handleRejectContribution = async () => {
    if (!selectedContribution) return;
    await rejectContributionMutation.mutateAsync({
      id: selectedContribution.id,
      adminNotes,
      adminResponse,
    });
  };

  const handleMarkResolved = async () => {
    if (!selectedContribution) return;
    await updateContributionMutation.mutateAsync({
      id: selectedContribution.id,
      data: {
        isResolved: true,
        adminResponse,
        adminNotes,
      },
    });
  };

  // Selection management
  const handleSelectContribution = (id: number) => {
    setSelectedContributions(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedContributions.length === filteredContributions.length) {
      setSelectedContributions([]);
    } else {
      setSelectedContributions(filteredContributions.map(c => c.id));
    }
  };

  // Bulk actions
  const handleBulkReject = async () => {
    if (selectedContributions.length === 0) return;
    await bulkRejectMutation.mutateAsync({
      contributionIds: selectedContributions,
      reason: bulkRejectReason || "Rejeté par l'administrateur"
    });
  };

  const handleBulkDelete = async () => {
    if (selectedContributions.length === 0) return;
    await deleteContributionMutation.mutateAsync(selectedContributions);
  };

  const openContributionDetails = (contribution: Contribution) => {
    setSelectedContribution(contribution);
    setAdminNotes(contribution.adminNotes || "");
    setAdminResponse(contribution.adminResponse || "");
  };

  const getContributionStats = () => {
    const total = contributions.length;
    const pending = contributions.filter(c => c.status === "pending").length;
    const approved = contributions.filter(c => c.status === "approved").length;
    const rejected = contributions.filter(c => c.status === "rejected").length;
    const support = contributions.filter(c => ["bug_report", "feature_request", "support"].includes(c.type)).length;
    const unresolved = contributions.filter(c => ["bug_report", "feature_request", "support"].includes(c.type) && !c.isResolved).length;

    return { total, pending, approved, rejected, support, unresolved };
  };

  const stats = getContributionStats();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
            <div className="text-sm text-gray-400">Total</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
            <div className="text-sm text-gray-400">En attente</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.approved}</div>
            <div className="text-sm text-gray-400">Approuvées</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
            <div className="text-sm text-gray-400">Rejetées</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.support}</div>
            <div className="text-sm text-gray-400">Support</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{stats.unresolved}</div>
            <div className="text-sm text-gray-400">Non résolus</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions en masse */}
      {selectedContributions.length > 0 && (
        <Card className="bg-gray-800 border-gray-700 border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <CheckCheck className="h-5 w-5" />
              Actions en masse ({selectedContributions.length} sélectionnée{selectedContributions.length > 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="bulk-reject-reason">Raison du rejet (optionnel)</Label>
                <Input
                  id="bulk-reject-reason"
                  value={bulkRejectReason}
                  onChange={(e) => setBulkRejectReason(e.target.value)}
                  placeholder="Ex: Signalement non pertinent, données insuffisantes..."
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 items-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-orange-400 border-orange-400 hover:bg-orange-400/10">
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter tout
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rejeter les contributions</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir rejeter {selectedContributions.length} contribution{selectedContributions.length > 1 ? 's' : ''} ? Cette action peut être annulée plus tard.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkReject} className="bg-orange-600 hover:bg-orange-700">
                        Rejeter
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer définitivement</AlertDialogTitle>
                      <AlertDialogDescription>
                        Attention ! Vous allez supprimer définitivement {selectedContributions.length} contribution{selectedContributions.length > 1 ? 's' : ''}. Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
                        Supprimer définitivement
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton de sélection globale */}
      {filteredContributions.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <Button
              variant="outline"
              onClick={handleSelectAll}
              className="w-full text-white border-gray-600 hover:bg-gray-700"
            >
              {selectedContributions.length === filteredContributions.length 
                ? "Désélectionner tout" 
                : "Sélectionner tout"}
              ({filteredContributions.length} contributions)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 bg-gray-800 h-auto p-2 gap-1">
          <TabsTrigger value="all" className="text-xs sm:text-sm px-2 py-2">Toutes</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs sm:text-sm px-2 py-2">En attente</TabsTrigger>
          <TabsTrigger value="support" className="text-xs sm:text-sm px-2 py-2">Support</TabsTrigger>
          <TabsTrigger value="content" className="text-xs sm:text-sm px-2 py-2">Contenu</TabsTrigger>
          <TabsTrigger value="prices" className="text-xs sm:text-sm px-2 py-2">Prix</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs sm:text-sm px-2 py-2">Approuvées</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredContributions.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Aucune contribution trouvée pour les filtres sélectionnés.</p>
              </CardContent>
            </Card>
          ) : (
            filteredContributions.map((contribution) => (
              <Card key={contribution.id} className={`bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors ${selectedContributions.includes(contribution.id) ? 'ring-2 ring-orange-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox de sélection */}
                    <Checkbox
                      checked={selectedContributions.includes(contribution.id)}
                      onCheckedChange={() => handleSelectContribution(contribution.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header with type, status, and badges */}
                      <div className="flex items-center gap-2 mb-3">
                        {getTypeIcon(contribution.type)}
                        <span className="font-medium text-white">{getTypeLabel(contribution.type)}</span>
                        <Badge className={getStatusColor(contribution.status)}>
                          {contribution.status}
                        </Badge>
                        <Badge className={getPriorityColor(contribution.priority)}>
                          {contribution.priority}
                        </Badge>
                        {contribution.severity && (
                          <Badge className={getSeverityColor(contribution.severity)}>
                            {contribution.severity}
                          </Badge>
                        )}
                        {contribution.isResolved && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Résolu
                          </Badge>
                        )}
                      </div>

                      {/* Informations essentielles - Produit et Magasin */}
                      <div className="bg-gray-800/50 rounded-lg p-3 mb-3 border border-gray-700">
                        <div className="grid grid-cols-1 gap-2">
                          {/* Produit */}
                          {contribution.product && (
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-blue-400" />
                              <span className="font-semibold text-blue-200">Produit:</span>
                              <span className="text-white font-medium">{contribution.product.name}</span>
                              {contribution.product.brand && (
                                <span className="text-gray-300">({contribution.product.brand})</span>
                              )}
                              {contribution.product.category && (
                                <Badge variant="outline" className="text-xs">
                                  {contribution.product.category}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Magasin */}
                          {contribution.store && (
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-green-400" />
                              <span className="font-semibold text-green-200">Magasin:</span>
                              <span className="text-white font-medium">{contribution.store.name}</span>
                              <span className="text-gray-300">({contribution.store.brand})</span>
                              {contribution.store.city && (
                                <span className="text-gray-400">- {contribution.store.city}</span>
                              )}
                            </div>
                          )}

                          {/* Affichage avant/après selon le type */}
                          {contribution.type === "price_update" && contribution.reportedPrice !== null && (
                            <PriceComparisonDisplay 
                              storeId={contribution.storeId}
                              productId={contribution.productId}
                              reportedPrice={contribution.reportedPrice}
                            />
                          )}

                          {contribution.type === "availability" && contribution.reportedAvailability !== null && (
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <div className="bg-gray-900/30 border border-gray-600 rounded p-2">
                                <p className="text-xs font-medium text-gray-200 mb-1">Disponibilité actuelle</p>
                                <p className="text-lg font-bold text-gray-100">Inconnue</p>
                              </div>
                              <div className={`border rounded p-2 ${
                                contribution.reportedAvailability 
                                  ? 'bg-green-900/30 border-green-600' 
                                  : 'bg-red-900/30 border-red-600'
                              }`}>
                                <p className={`text-xs font-medium mb-1 ${
                                  contribution.reportedAvailability 
                                    ? 'text-green-200' 
                                    : 'text-red-200'
                                }`}>
                                  Disponibilité signalée
                                </p>
                                <p className={`text-lg font-bold ${
                                  contribution.reportedAvailability 
                                    ? 'text-green-100' 
                                    : 'text-red-100'
                                }`}>
                                  {contribution.reportedAvailability ? "Disponible" : "Non disponible"}
                                </p>
                              </div>
                            </div>
                          )}

                          {contribution.type === "new_store" && (
                            <div className="mt-3">
                              <div className="bg-blue-900/30 border border-blue-600 rounded p-3">
                                <p className="text-xs font-medium text-blue-200 mb-1">Nouveau magasin proposé</p>
                                <div className="space-y-1 text-sm text-blue-100">
                                  {contribution.data?.suggestedName && (
                                    <div><span className="font-medium">Nom:</span> {contribution.data.suggestedName}</div>
                                  )}
                                  {contribution.data?.suggestedAddress && (
                                    <div><span className="font-medium">Adresse:</span> {contribution.data.suggestedAddress}</div>
                                  )}
                                  {contribution.data?.suggestedBrand && (
                                    <div><span className="font-medium">Enseigne:</span> {contribution.data.suggestedBrand}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {contribution.type === "new_product" && (
                            <div className="mt-3">
                              <div className="bg-purple-900/30 border border-purple-600 rounded p-3">
                                <p className="text-xs font-medium text-purple-200 mb-1">Nouveau produit proposé</p>
                                <div className="space-y-1 text-sm text-purple-100">
                                  {contribution.data?.suggestedName && (
                                    <div><span className="font-medium">Nom:</span> {contribution.data.suggestedName}</div>
                                  )}
                                  {contribution.data?.suggestedBrand && (
                                    <div><span className="font-medium">Marque:</span> {contribution.data.suggestedBrand}</div>
                                  )}
                                  {contribution.data?.suggestedCategory && (
                                    <div><span className="font-medium">Catégorie:</span> {contribution.data.suggestedCategory}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {contribution.type === "store_update" && contribution.storeId && (
                            <StoreUpdateDisplay 
                              storeId={contribution.storeId}
                              updateData={contribution.data}
                            />
                          )}
                        </div>
                      </div>

                      {/* User info */}
                      {contribution.user && (
                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-300">
                          <User className="h-4 w-4" />
                          <span>{contribution.user.email}</span>
                          {contribution.user.firstName && (
                            <span className="text-gray-400">({contribution.user.firstName} {contribution.user.lastName})</span>
                          )}
                        </div>
                      )}



                      {/* Comment if available */}
                      {contribution.comment && (
                        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 mt-0.5 text-blue-400" />
                            <div>
                              <p className="text-sm font-medium text-blue-200 mb-1">Commentaire utilisateur :</p>
                              <p className="text-sm text-blue-100 italic">"{contribution.comment}"</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Admin response if available */}
                      {contribution.adminResponse && (
                        <div className="bg-green-900/20 border border-green-600 rounded-lg p-3 mb-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-400" />
                            <div>
                              <p className="text-sm font-medium text-green-200 mb-1">Réponse administrateur :</p>
                              <p className="text-sm text-green-100">{contribution.adminResponse}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Créé {formatDistanceToNow(new Date(contribution.createdAt), { addSuffix: true, locale: fr })}</span>
                        </div>
                        {contribution.reviewedAt && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Révisé {formatDistanceToNow(new Date(contribution.reviewedAt), { addSuffix: true, locale: fr })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openContributionDetails(contribution)}
                        className="ml-4 shrink-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Contribution Details Dialog */}
      <Dialog open={!!selectedContribution} onOpenChange={() => setSelectedContribution(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedContribution && getTypeIcon(selectedContribution.type)}
              Détails de la contribution #{selectedContribution?.id}
            </DialogTitle>
            <DialogDescription>
              Examiner et traiter cette contribution
            </DialogDescription>
          </DialogHeader>

          {selectedContribution && (
            <div className="space-y-6">
              {/* User Information */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm">Informations utilisateur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{selectedContribution.user?.email}</span>
                  </div>
                  {selectedContribution.user?.firstName && (
                    <div>
                      <strong>Nom:</strong> {selectedContribution.user.firstName} {selectedContribution.user.lastName}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Store Information */}
              {selectedContribution.store && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Informations magasin
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <strong>Nom:</strong> {selectedContribution.store.name}
                    </div>
                    <div>
                      <strong>Marque:</strong> {selectedContribution.store.brand}
                    </div>
                    {selectedContribution.store.address && (
                      <div>
                        <strong>Adresse:</strong> {selectedContribution.store.address}
                      </div>
                    )}
                    {selectedContribution.store.city && (
                      <div>
                        <strong>Ville:</strong> {selectedContribution.store.city}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Product Information */}
              {selectedContribution.product && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Informations produit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <strong>Nom:</strong> {selectedContribution.product.name}
                    </div>
                    {selectedContribution.product.brand && (
                      <div>
                        <strong>Marque:</strong> {selectedContribution.product.brand}
                      </div>
                    )}
                    {selectedContribution.product.category && (
                      <div>
                        <strong>Catégorie:</strong> {selectedContribution.product.category}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Contribution Details */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm">Détails de la contribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Type:</strong> {getTypeLabel(selectedContribution.type)}
                    </div>
                    <div>
                      <strong>Statut:</strong> 
                      <Badge className={`ml-2 ${getStatusColor(selectedContribution.status)}`}>
                        {selectedContribution.status}
                      </Badge>
                    </div>
                    <div>
                      <strong>Priorité:</strong>
                      <Badge className={`ml-2 ${getPriorityColor(selectedContribution.priority)}`}>
                        {selectedContribution.priority}
                      </Badge>
                    </div>
                    {selectedContribution.severity && (
                      <div>
                        <strong>Sévérité:</strong>
                        <Badge className={`ml-2 ${getSeverityColor(selectedContribution.severity)}`}>
                          {selectedContribution.severity}
                        </Badge>
                      </div>
                    )}
                    {selectedContribution.reportedPrice !== undefined && selectedContribution.reportedPrice !== null && (
                      <div>
                        <strong>Prix signalé:</strong> €{selectedContribution.reportedPrice}
                      </div>
                    )}
                    {selectedContribution.reportedAvailability !== undefined && selectedContribution.reportedAvailability !== null && (
                      <div>
                        <strong>Disponibilité:</strong> {selectedContribution.reportedAvailability ? "Disponible" : "Non disponible"}
                      </div>
                    )}
                    <div>
                      <strong>Créé le:</strong> {new Date(selectedContribution.createdAt).toLocaleString('fr-FR')}
                    </div>
                    {selectedContribution.reviewedAt && (
                      <div>
                        <strong>Révisé le:</strong> {new Date(selectedContribution.reviewedAt).toLocaleString('fr-FR')}
                      </div>
                    )}
                  </div>

                  {selectedContribution.comment && (
                    <div>
                      <strong>Commentaire:</strong>
                      <p className="mt-1 p-3 bg-gray-900 rounded text-gray-300 italic">
                        "{selectedContribution.comment}"
                      </p>
                    </div>
                  )}

                  {selectedContribution.data && (
                    <div>
                      <strong>Données structurées:</strong>
                      <pre className="mt-1 p-3 bg-gray-900 rounded text-xs text-gray-300 overflow-x-auto">
                        {JSON.stringify(selectedContribution.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedContribution.adminResponse && (
                    <div>
                      <strong>Réponse admin précédente:</strong>
                      <p className="mt-1 p-3 bg-blue-900/20 border border-blue-600 rounded text-blue-200">
                        {selectedContribution.adminResponse}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Actions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm">Actions administrateur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="admin-response">Réponse à l'utilisateur</Label>
                    <Textarea
                      id="admin-response"
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder="Réponse visible par l'utilisateur..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="admin-notes">Notes internes</Label>
                    <Textarea
                      id="admin-notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Notes privées pour l'équipe admin..."
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            {selectedContribution?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleRejectContribution}
                  disabled={rejectContributionMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
                <Button
                  onClick={handleApproveContribution}
                  disabled={approveContributionMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
              </>
            )}

            {["bug_report", "feature_request", "support"].includes(selectedContribution?.type || "") && 
             !selectedContribution?.isResolved && (
              <Button
                onClick={handleMarkResolved}
                disabled={updateContributionMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Marquer comme résolu
              </Button>
            )}

            <Button variant="outline" onClick={() => setSelectedContribution(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}