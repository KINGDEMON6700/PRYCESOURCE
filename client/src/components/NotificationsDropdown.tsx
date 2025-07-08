import { useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export function NotificationsDropdown() {
  const [, navigate] = useLocation();

  // Récupérer les notifications utilisateur
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-white hover:bg-white/20 rounded-xl p-2 sm:p-3"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 min-w-0">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          <>
            <div className="p-2 text-sm font-semibold text-gray-900 dark:text-white border-b">
              Notifications ({unreadCount} non lues)
            </div>
            {notifications.slice(0, 5).map((notification: any) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => navigate("/profile")}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge className={
                      notification.type === 'success' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }>
                      {notification.title}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
            {notifications.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-center text-sm text-blue-600 dark:text-blue-400 cursor-pointer"
                  onClick={() => navigate("/profile")}
                >
                  Voir toutes les notifications
                </DropdownMenuItem>
              </>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucune notification</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}