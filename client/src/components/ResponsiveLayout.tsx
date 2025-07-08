import { ReactNode } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import { StandardHeader } from "@/components/StandardHeader";

interface ResponsiveLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  fullWidth?: boolean;
  noPadding?: boolean;
}

export function ResponsiveLayout({
  children,
  title,
  showBackButton = false,
  onBack,
  fullWidth = false,
  noPadding = false,
}: ResponsiveLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <StandardHeader
        title={title}
        showBackButton={showBackButton}
        onBack={onBack}
      />

      {/* Main Content */}
      <main 
        className={`
          pt-16 pb-20 min-h-screen
          ${fullWidth ? 'w-full' : 'max-w-7xl mx-auto'}
          ${noPadding ? '' : 'px-2 sm:px-4 lg:px-6'}
        `}
      >
        <div className={`
          ${fullWidth ? 'w-full' : 'w-full max-w-none'}
          ${noPadding ? '' : 'space-y-4 sm:space-y-6'}
        `}>
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}