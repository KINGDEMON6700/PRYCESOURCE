import { useQuery } from "@tanstack/react-query";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, LogOut, Award, TrendingUp, Users, History, Shield, User, AlertTriangle, Store, Package } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { DevRoleToggle } from "@/components/DevRoleToggle";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { StandardHeader } from "@/components/StandardHeader";
import type { Contribution } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch user contributions
  const { data: contributions, isLoading } = useQuery<Contribution[]>({
    queryKey: ["/api/contributions/my"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return false;
      }
      return failureCount < 3;
    },
  });



  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case "approved":
        return "Approuvé";
      case "pending":
        return "En attente";
      case "rejected":
        return "Rejeté";
      default:
        return status;
    }
  };

  const approvedContributions = contributions?.filter(c => c.status === "approved") || [];
  const pendingContributions = contributions?.filter(c => c.status === "pending") || [];

  return (
    <div className="max-w-sm mx-auto bg-gray-900 min-h-screen relative">
      <StandardHeader 
        title="Mon Profil"
        showBackButton={true}
      />
      
      <div className="pt-16 max-w-sm mx-auto w-full">
        {/* User Info Card */}
        <div className="p-2 sm:p-4">
        <Card className="bg-gray-800 border-gray-700 mb-4">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-blue-600 text-white font-bold text-base sm:text-xl">
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold text-white truncate">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || "Utilisateur"}
                </h2>
                <p className="text-gray-300 text-xs sm:text-sm">
                  {user?.role === "admin" ? "Administrateur" : "Contributeur"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20 bg-gray-900">
        {/* Stats Cards */}
        <div className="p-2 sm:p-4 grid grid-cols-2 gap-2 sm:gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="h-8 w-8 text-pryce-blue mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {approvedContributions.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Contributions approuvées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {contributions?.length || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total contributions
              </p>
            </CardContent>
          </Card>
        </div>



        {/* Recent Contributions */}
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Contributions récentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : contributions?.length ? (
                <div className="space-y-3">
                  {contributions.slice(0, 5).map((contribution) => (
                    <div key={contribution.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {contribution.type === "price" ? "Prix signalé" : 
                           contribution.type === "availability" ? "Disponibilité signalée" : 
                           "Prix et disponibilité"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(contribution.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(contribution.status)}>
                        {getStatusText(contribution.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Aucune contribution pour le moment
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Commencez à contribuer pour aider la communauté !
                  </p>
                </div>
              )}
            </CardContent>
          </Card>


        </div>

        {/* Actions */}
        <div className="p-4 space-y-3">
          <Card className="cursor-pointer hover:bg-gray-700/50 transition-all duration-200 bg-gray-800 border-gray-700 hover:border-gray-600/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-medium">Paramètres</span>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card 
              className="cursor-pointer hover:bg-gray-700/50 transition-all duration-200 bg-gray-800 border-gray-700 hover:border-blue-600/50"
              onClick={() => navigate("/admin")}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-medium">Administration</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card 
            className="cursor-pointer hover:bg-gray-700/50 transition-all duration-200 bg-gray-800 border-gray-700 hover:border-red-600/50"
            onClick={handleLogout}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <LogOut className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-medium">Se déconnecter</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
