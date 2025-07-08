import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  User, 
  Store, 
  Package, 
  Euro,
  AlertTriangle,
  Filter,
  MoreVertical
} from "lucide-react";

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
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  store?: {
    id: number;
    name: string;
    brand: string;
  };
  product?: {
    id: number;
    name: string;
    brand?: string;
  };
  user?: {
    id: string;
    email: string;
  };
}

export function ContributionsManagement() {
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les contributions
  const { data: contributions = [], isLoading } = useQuery<Contribution[]>({
    queryKey: ["/api/contributions", statusFilter, typeFilter, priorityFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      
      const query = params.toString();
      return apiRequest("GET", `/api/contributions${query ? `?${query}` : ""}`);
    },
  });

  // Mutation pour approuver/rejeter une contribution
  const updateContributionMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: number; status: string; adminNotes?: string }) => {
      return await apiRequest("PUT", `/api/contributions/${id}`, {
        status,
        adminNotes: adminNotes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contributions"] });
      setSelectedContribution(null);
      setAdminNotes("");
      toast({
        title: "Contribution mise à jour",
        description: "Le statut de la contribution a été modifié avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la contribution.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (contribution: Contribution) => {
    updateContributionMutation.mutate({
      id: contribution.id,
      status: "approved",
      adminNotes: adminNotes || undefined,
    });
  };

  const handleReject = (contribution: Contribution) => {
    if (!adminNotes.trim()) {
      toast({
        title: "Notes requises",
        description: "Veuillez ajouter une note expliquant la raison du rejet.",
        variant: "destructive",
      });
      return;
    }
    
    updateContributionMutation.mutate({
      id: contribution.id,
      status: "rejected",
      adminNotes: adminNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approuvé</Badge>;
      case "rejected":
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Élevée</Badge>;
      case "normal":
        return <Badge variant="outline">Normale</Badge>;
      case "low":
        return <Badge variant="secondary">Faible</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "price_update":
        return <Euro className="h-4 w-4" />;
      case "new_store":
        return <Store className="h-4 w-4" />;
      case "new_product":
      case "new_product_and_add_to_store":
        return <Package className="h-4 w-4" />;
      case "add_product_to_store":
        return <Package className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "price_update":
        return "Modification de prix";
      case "new_store":
        return "Nouveau magasin";
      case "new_product":
        return "Nouveau produit";
      case "new_product_and_add_to_store":
        return "Nouveau produit + Ajout magasin";
      case "add_product_to_store":
        return "Ajout produit au catalogue";
      default:
        return type;
    }
  };

  const filteredContributions = contributions;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="price_update">Modification de prix</SelectItem>
                  <SelectItem value="new_store">Nouveau magasin</SelectItem>
                  <SelectItem value="new_product">Nouveau produit</SelectItem>
                  <SelectItem value="add_product_to_store">Ajout au catalogue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priorité</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="normal">Normale</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des contributions */}
      {filteredContributions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune contribution
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Aucune contribution ne correspond aux filtres sélectionnés.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredContributions.map((contribution) => (
            <Card key={contribution.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(contribution.type)}
                      <span className="font-medium">{getTypeLabel(contribution.type)}</span>
                      {getStatusBadge(contribution.status)}
                      {getPriorityBadge(contribution.priority)}
                    </div>

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {contribution.user?.email || contribution.userId}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(contribution.createdAt), { addSuffix: true, locale: fr })}
                        </span>
                        {contribution.store && (
                          <span className="flex items-center gap-1">
                            <Store className="h-3 w-3" />
                            {contribution.store.name}
                          </span>
                        )}
                        {contribution.product && (
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {contribution.product.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {contribution.comment && (
                      <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        {contribution.comment}
                      </p>
                    )}

                    {contribution.data && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {contribution.type === "price_update" && contribution.data.oldPrice && contribution.data.newPrice && (
                          <span>Prix: {contribution.data.oldPrice}€ → {contribution.data.newPrice}€</span>
                        )}
                        {contribution.type === "new_store" && contribution.data.name && (
                          <span>Magasin: {contribution.data.name} à {contribution.data.city}</span>
                        )}
                        {(contribution.type === "new_product" || contribution.type === "new_product_and_add_to_store") && contribution.data.product && (
                          <span>Produit: {contribution.data.product.name} ({contribution.data.product.category})</span>
                        )}
                      </div>
                    )}

                    {contribution.adminNotes && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm">
                        <span className="font-medium">Notes admin:</span> {contribution.adminNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedContribution(contribution);
                        setAdminNotes(contribution.adminNotes || "");
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de détails et actions */}
      <Dialog open={!!selectedContribution} onOpenChange={() => setSelectedContribution(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedContribution && getTypeIcon(selectedContribution.type)}
              Détails de la contribution
            </DialogTitle>
            <DialogDescription>
              Examiner et approuver/rejeter cette contribution
            </DialogDescription>
          </DialogHeader>

          {selectedContribution && (
            <div className="space-y-4">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {getTypeLabel(selectedContribution.type)}
                </div>
                <div>
                  <span className="font-medium">Statut:</span> {getStatusBadge(selectedContribution.status)}
                </div>
                <div>
                  <span className="font-medium">Priorité:</span> {getPriorityBadge(selectedContribution.priority)}
                </div>
                <div>
                  <span className="font-medium">Soumis le:</span> {new Date(selectedContribution.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Données de la contribution */}
              {selectedContribution.data && (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Données soumises:</h4>
                  <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(selectedContribution.data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Commentaire utilisateur */}
              {selectedContribution.comment && (
                <div>
                  <h4 className="font-medium mb-2">Commentaire utilisateur:</h4>
                  <p className="bg-gray-50 dark:bg-gray-800 p-3 rounded">{selectedContribution.comment}</p>
                </div>
              )}

              {/* Notes administratives */}
              <div className="space-y-2">
                <label className="font-medium">Notes administratives:</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Ajouter des notes internes sur cette contribution..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              {selectedContribution.status === "pending" && (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleApprove(selectedContribution)}
                    disabled={updateContributionMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {updateContributionMutation.isPending ? "Traitement..." : "Approuver"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(selectedContribution)}
                    disabled={updateContributionMutation.isPending}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {updateContributionMutation.isPending ? "Traitement..." : "Rejeter"}
                  </Button>
                </div>
              )}

              {selectedContribution.status !== "pending" && (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  Cette contribution a déjà été {selectedContribution.status === "approved" ? "approuvée" : "rejetée"}.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}