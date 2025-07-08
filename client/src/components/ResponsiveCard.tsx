import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResponsiveCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
  padding?: "none" | "small" | "medium" | "large";
}

export function ResponsiveCard({
  title,
  children,
  className = "",
  headerAction,
  padding = "medium",
}: ResponsiveCardProps) {
  const paddingClasses = {
    none: "",
    small: "p-2 sm:p-3",
    medium: "p-3 sm:p-4 lg:p-5",
    large: "p-4 sm:p-6 lg:p-8",
  };

  return (
    <Card className={`w-full ${className}`}>
      {title && (
        <CardHeader className={`${paddingClasses[padding]} pb-2 sm:pb-3`}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg lg:text-xl">
              {title}
            </CardTitle>
            {headerAction}
          </div>
        </CardHeader>
      )}
      <CardContent className={`${title ? 'pt-0' : ''} ${paddingClasses[padding]}`}>
        {children}
      </CardContent>
    </Card>
  );
}