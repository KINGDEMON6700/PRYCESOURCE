import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ResponsiveFormProps {
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ResponsiveForm({
  children,
  onSubmit,
  submitLabel = "Enregistrer",
  cancelLabel = "Annuler",
  onCancel,
  isLoading = false,
  className = "",
}: ResponsiveFormProps) {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 sm:space-y-6 ${className}`}>
      <div className="space-y-3 sm:space-y-4">
        {children}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto sm:flex-1 text-sm sm:text-base py-2.5 sm:py-2"
        >
          {isLoading ? "Chargement..." : submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto sm:flex-1 text-sm sm:text-base py-2.5 sm:py-2"
          >
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  );
}