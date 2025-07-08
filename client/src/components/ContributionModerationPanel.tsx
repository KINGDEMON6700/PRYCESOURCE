import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  useContributionsAdmin,
  useApproveContribution,
  useRejectContribution,
  useBulkApproveContributions,
  useBulkRejectContributions,
  useUpdateContributionPriority,
  useAddAdminNotes
} from "@/hooks/useContributionsAdmin";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  MessageSquare,
  Calendar,
  User,
  MapPin,
  Package,
  Store
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ContributionModerationPanelProps {
  statusFilter?: string;
  priorityFilter?: string;
}

export function ContributionModerationPanel({ 
  statusFilter = "pending",
  priorityFilter 
}: ContributionModerationPanelProps) {
  const [selectedContributions, setSelectedContributions] = useState<number[]>([]);
  const [bulkActionReason, setBulkActionReason] = useState("");

  const { data: contributions, isLoading } = useContributionsAdmin(statusFilter, priorityFilter);
  const approveContribution = useApproveContribution();
  const rejectContribution = useRejectContribution();
  const bulkApprove = useBulkApproveContributions();
  const bulkReject = useBulkRejectContributions();
  const updatePriority = useUpdateContributionPriority();
  const addNotes = useAddAdminNotes();

  const handleSelectContribution = (id: number) => {
    setSelectedContributions(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedContributions.length === contributions?.length) {
      setSelectedContributions([]);
    } else {
      setSelectedContributions(contributions?.map((c: any) => c.id) || []);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedContributions.length === 0) return;
    
    try {
      await bulkApprove.mutateAsync(selectedContributions);
      setSelectedContributions([]);
    } catch (error) {

    }
  };

  const handleBulkReject = async () => {
    if (selectedContributions.length === 0) return;
    
    try {
      await bulkReject.mutateAsync({
        contributionIds: selectedContributions,
        reason: bulkActionReason
      });
      setSelectedContributions([]);
      setBulkActionReason("");
    } catch (error) {

    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      case 'pending': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-300">Chargement des contributions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions en masse */}
      {selectedContributions.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              Actions en masse ({selectedContributions.length} sélectionnées)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={handleBulkApprove}
                disabled={bulkApprove.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approuver tout
              </Button>
              <Button
                onClick={handleBulkReject}
                disabled={bulkReject.isPending}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter tout
              </Button>
            </div>
            
            {bulkReject.isPending && (
              <textarea
                value={bulkActionReason}
                onChange={(e) => setBulkActionReason(e.target.value)}
                placeholder="Raison du rejet (optionnel)..."
                className="w-full p-2 bg-gray-700 text-white rounded border-gray-600"
                rows={3}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* En-tête avec sélection globale */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={selectedContributions.length === contributions?.length && contributions?.length > 0}
            onChange={handleSelectAll}
            className="w-4 h-4"
          />
          <span className="text-gray-300">
            {contributions?.length || 0} contributions
          </span>
        </div>
      </div>

      {/* Liste des contributions */}
      <div className="space-y-4">
        {contributions?.map((contribution: any) => (
          <Card key={contribution.id} className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedContributions.includes(contribution.id)}
                    onChange={() => handleSelectContribution(contribution.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(contribution.priority)}>
                      {contribution.priority}
                    </Badge>
                    <Badge className={getStatusColor(contribution.status)}>
                      {contribution.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Calendar className="h-4 w-4" />
                  {contribution.createdAt && format(new Date(contribution.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="h-4 w-4" />
                  <span>Utilisateur: {contribution.userId}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-300">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Type: {contribution.type}</span>
                </div>
                
                {contribution.storeId && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Store className="h-4 w-4" />
                    <span>Magasin ID: {contribution.storeId}</span>
                  </div>
                )}
                
                {contribution.productId && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Package className="h-4 w-4" />
                    <span>Produit ID: {contribution.productId}</span>
                  </div>
                )}
                
                {contribution.latitude && contribution.longitude && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4" />
                    <span>
                      Position: {Number(contribution.latitude || 0).toFixed(4)}, {Number(contribution.longitude || 0).toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

              {/* Données de la contribution */}
              {contribution.data && (
                <div className="bg-gray-700 p-3 rounded">
                  <h4 className="text-white font-medium mb-2">Données:</h4>
                  <pre className="text-gray-300 text-sm overflow-auto">
                    {JSON.stringify(contribution.data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Notes admin */}
              {contribution.adminNotes && (
                <div className="bg-gray-700 p-3 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                    <span className="text-white font-medium">Notes admin:</span>
                  </div>
                  <p className="text-gray-300 text-sm">{contribution.adminNotes}</p>
                </div>
              )}

              {/* Actions individuelles */}
              {contribution.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveContribution.mutate(contribution.id)}
                    disabled={approveContribution.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approuver
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectContribution.mutate({ id: contribution.id })}
                    disabled={rejectContribution.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeter
                  </Button>
                  
                  <select
                    value={contribution.priority}
                    onChange={(e) => updatePriority.mutate({ 
                      id: contribution.id, 
                      priority: e.target.value 
                    })}
                    className="px-2 py-1 bg-gray-700 text-white rounded border-gray-600 text-sm"
                  >
                    <option value="low">Basse</option>
                    <option value="normal">Normale</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message si aucune contribution */}
      {contributions?.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="text-center py-8">
            <p className="text-gray-400">Aucune contribution trouvée pour les filtres sélectionnés.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}