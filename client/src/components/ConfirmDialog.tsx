import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "default"
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-gray-800 border-gray-700 max-w-[95vw] sm:max-w-sm mx-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white text-lg">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 text-sm">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="space-x-2">
          <AlertDialogCancel 
            onClick={onClose}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={variant === "destructive" 
              ? "bg-red-600 hover:bg-red-700 text-white" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}