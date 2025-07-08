import { Button } from "@/components/ui/button";
import { useAdminRole } from "@/hooks/useAdminRole";

export function DevRoleToggle() {
  const { isAdmin, toggleAdmin, isToggling } = useAdminRole();

  return (
    <Button
      onClick={toggleAdmin}
      disabled={isToggling}
      variant={isAdmin ? "destructive" : "default"}
      size="sm"
      className="min-w-[140px]"
    >
      {isToggling ? "Changement..." : (isAdmin ? "Devenir contributeur" : "Devenir admin")}
    </Button>
  );
}