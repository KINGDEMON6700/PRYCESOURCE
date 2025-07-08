import { memo } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner = memo(({ size = "md", className = "" }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}></div>
    </div>
  );
});

LoadingSpinner.displayName = "LoadingSpinner";

export const LoadingState = memo(() => (
  <div className="flex items-center justify-center min-h-64">
    <div className="text-center">
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
    </div>
  </div>
));

LoadingState.displayName = "LoadingState";