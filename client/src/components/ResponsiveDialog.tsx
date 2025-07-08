import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  fullScreen?: boolean;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className = "",
  fullScreen = false,
}: ResponsiveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`
          ${fullScreen 
            ? 'max-w-[100vw] max-h-[100vh] w-full h-full m-0 rounded-none sm:max-w-[95vw] sm:max-h-[95vh] sm:w-auto sm:h-auto sm:m-4 sm:rounded-lg' 
            : 'max-w-[95vw] max-h-[90vh] w-full sm:max-w-2xl'
          }
          overflow-hidden flex flex-col
          ${className}
        `}
      >
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-left">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm sm:text-base text-left">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1 -mx-1">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}