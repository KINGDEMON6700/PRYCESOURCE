import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AdminRoleData {
  isAdmin: boolean;
  role: string;
}

export function useAdminRole() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query to get current admin role
  const { data: roleData, isLoading } = useQuery<AdminRoleData>({
    queryKey: ["/api/auth/role"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation to toggle admin role
  const toggleAdminMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/dev/toggle-admin"),
    onSuccess: (data: any) => {
      // Invalidate both role and user queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/role"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Rôle modifié",
        description: data.message,
        variant: "default",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de changer le rôle",
        variant: "destructive",
      });
    },
  });

  return {
    isAdmin: roleData?.isAdmin || false,
    role: roleData?.role || 'user',
    isLoading,
    toggleAdmin: toggleAdminMutation.mutate,
    isToggling: toggleAdminMutation.isPending,
  };
}