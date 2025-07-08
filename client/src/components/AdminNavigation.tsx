import { Shield, BarChart3, Store, Package, Settings, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

interface AdminNavigationProps {
  statsCount?: {
    stores: number;
    products: number;
    pendingContributions: number;
  };
}

export function AdminNavigation({ statsCount }: AdminNavigationProps) {
  const [location] = useLocation();

  const navItems = [
    { 
      icon: BarChart3, 
      label: "Dashboard", 
      path: "/admin",
      count: undefined
    },
    { 
      icon: Store, 
      label: "Magasins", 
      path: "/admin#stores",
      count: statsCount?.stores
    },
    { 
      icon: Package, 
      label: "Produits", 
      path: "/admin#products",
      count: statsCount?.products
    },
    { 
      icon: Users, 
      label: "Contributions", 
      path: "/admin#contributions",
      count: statsCount?.pendingContributions
    },
    { 
      icon: Settings, 
      label: "Paramètres", 
      path: "/admin#settings",
      count: undefined
    },
  ];

  return (
    <nav className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-sm bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg px-2 py-1 z-40">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || 
            (item.path === "/admin" && location === "/admin");
          
          return (
            <Link key={item.path} href={item.path}>
              <button className={`relative flex flex-col items-center space-y-1 p-3 transition-all rounded-md ${
                isActive 
                  ? "text-pryce-blue bg-blue-600/20 border border-blue-600/30" 
                  : "text-gray-400 hover:text-pryce-blue hover:bg-gray-700/50"
              }`}>
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{item.label}</span>
                {item.count && item.count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center bg-blue-600 text-white"
                  >
                    {item.count > 99 ? '99+' : item.count}
                  </Badge>
                )}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}