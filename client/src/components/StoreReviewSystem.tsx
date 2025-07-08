import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, MessageSquare, ThumbsUp, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { StoreRating } from "@shared/schema";

interface StoreReviewSystemProps {
  storeId: number;
  storeName: string;
}

interface StoreRatingWithUser extends StoreRating {
  user?: {
    id: string;
    email: string;
  };
}

export function StoreReviewSystem({ storeId, storeName }: StoreReviewSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  // Récupérer les avis du magasin
  const { data: ratings = [], isLoading } = useQuery<StoreRatingWithUser[]>({
    queryKey: [`/api/stores/${storeId}/ratings`],
  });

  // Mutation pour créer un nouvel avis
  const createRatingMutation = useMutation({
    mutationFn: async (ratingData: { rating: number; comment: string }) => {
      const response = await apiRequest("POST", `/api/stores/${storeId}/ratings`, {
        rating: ratingData.rating,
        comment: ratingData.comment || null
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'avis');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stores/${storeId}/ratings`] });
      queryClient.invalidateQueries({ queryKey: [`/api/stores/${storeId}`] });
      setIsDialogOpen(false);
      setNewRating(0);
      setNewComment("");
      toast({
        title: "Avis ajouté",
        description: "Votre avis a été publié avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter votre avis. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = () => {
    if (newRating === 0) {
      toast({
        title: "Note requise",
        description: "Veuillez donner une note avant de publier votre avis.",
        variant: "destructive",
      });
      return;
    }

    createRatingMutation.mutate({
      rating: newRating,
      comment: newComment.trim(),
    });
  };

  const renderStars = (rating: number, interactive = false, size = "w-5 h-5") => {
    return Array.from({ length: 5 }, (_, index) => {
      const starIndex = index + 1;
      const isFilled = interactive ? 
        (hoveredRating > 0 ? starIndex <= hoveredRating : starIndex <= newRating) :
        starIndex <= rating;
      
      return (
        <Star
          key={index}
          className={`${size} cursor-pointer transition-colors ${
            isFilled ? "text-yellow-500 fill-current" : "text-gray-400"
          }`}
          onClick={interactive ? () => setNewRating(starIndex) : undefined}
          onMouseEnter={interactive ? () => setHoveredRating(starIndex) : undefined}
          onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
        />
      );
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length 
    : 0;

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardContent className="p-6">
        {/* Header avec statistiques */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Avis clients</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {renderStars(averageRating)}
                <span className="text-white font-semibold">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-gray-400">
                  ({ratings.length} avis)
                </span>
              </div>
            </div>
          </div>

          {user && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Laisser un avis
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 max-w-[95vw] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Votre avis sur {storeName}
                  </DialogTitle>
                  <p className="text-gray-400 text-sm">
                    Partagez votre expérience pour aider les autres utilisateurs
                  </p>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Système de notation */}
                  <div>
                    <label className="text-white font-medium mb-3 block">
                      Note générale
                    </label>
                    <div className="flex items-center space-x-1">
                      {renderStars(0, true, "w-8 h-8")}
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      {newRating === 0 && "Cliquez sur les étoiles pour noter"}
                      {newRating === 1 && "Très décevant"}
                      {newRating === 2 && "Décevant"}
                      {newRating === 3 && "Correct"}
                      {newRating === 4 && "Très bien"}
                      {newRating === 5 && "Excellent"}
                    </p>
                  </div>

                  {/* Commentaire */}
                  <div>
                    <label className="text-white font-medium mb-3 block">
                      Commentaire (optionnel)
                    </label>
                    <Textarea
                      placeholder="Partagez votre expérience dans ce magasin..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
                      maxLength={500}
                    />
                    <p className="text-gray-400 text-sm mt-1">
                      {newComment.length}/500 caractères
                    </p>
                  </div>

                  {/* Boutons */}
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => setIsDialogOpen(false)}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSubmitReview}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={createRatingMutation.isPending}
                    >
                      {createRatingMutation.isPending ? "Publication..." : "Publier"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Liste des avis */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ratings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium mb-2">Aucun avis pour le moment</p>
              <p className="text-sm">
                Soyez le premier à partager votre expérience dans ce magasin !
              </p>
            </div>
          ) : (
            ratings.map((rating) => (
              <div key={rating.id} className="border-b border-gray-800 pb-4 last:border-b-0">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-white font-medium">
                          {rating.user?.email?.split('@')[0] || 'Utilisateur'}
                        </span>
                        <div className="flex items-center space-x-1">
                          {renderStars(rating.rating, false, "w-4 h-4")}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        {formatDate(rating.createdAt)}
                      </div>
                    </div>
                    
                    {rating.comment && (
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {rating.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message pour les utilisateurs non connectés */}
        {!user && (
          <div className="mt-6 p-4 bg-blue-600/10 border border-blue-600/20 rounded-lg">
            <p className="text-blue-400 text-sm">
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Connectez-vous pour laisser un avis sur ce magasin.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}