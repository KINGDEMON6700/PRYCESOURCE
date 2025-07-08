import { Home, Search, Map, Plus, User, Bell, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Vérifier si l'utilisateur est admin
  const { isAdmin } = useAdminRole();

  const navItems = [
    { icon: Home, label: "Accueil", path: "/" },
    { icon: Search, label: "Rechercher", path: "/search" },
    { icon: ShoppingCart, label: "Listes", path: "/shopping-list" },
    { icon: Map, label: "Carte", path: "/map" },
    { icon: User, label: "Profil", path: "/profile" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-600 px-3 sm:px-4 lg:px-6 py-3 z-50 shadow-2xl">
      <div className="flex justify-center items-center max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 sm:space-x-6 lg:space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link key={item.path} href={item.path}>
                <button className={`flex flex-col items-center space-y-1 p-3 sm:p-4 lg:p-5 rounded-xl transition-all duration-300 w-16 sm:w-18 lg:w-20 ${
                  isActive 
                    ? "text-white bg-blue-600 shadow-lg transform scale-105" 
                    : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                }`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 flex-shrink-0" />
                  <span className="text-xs sm:text-xs lg:text-sm font-semibold truncate w-full text-center">
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
