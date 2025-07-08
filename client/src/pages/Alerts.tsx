import { PriceAlertSystem } from "@/components/PriceAlertSystem";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PageHeader } from "@/components/PageHeader";

export default function Alerts() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <PageHeader title="Alertes de prix" />
      
      <div className="p-4">
        <PriceAlertSystem />
      </div>

      <BottomNavigation />
    </div>
  );
}