import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Bell, Check, Trash2, CheckCheck } from "lucide-react";
import { useNotifications, useUnreadNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from "@/hooks/useNotifications";
import { getTranslation } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";

interface NotificationCenterProps {
  language: "en" | "es";
}

export const NotificationCenter = ({ language }: NotificationCenterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const { data: unreadNotifications } = useUnreadNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const unreadCount = unreadNotifications?.length || 0;
  const locale = language === "es" ? es : enUS;

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Show browser notification for new unread notifications
  useEffect(() => {
    if (unreadNotifications && unreadNotifications.length > 0 && "Notification" in window && Notification.permission === "granted") {
      const latestNotification = unreadNotifications[0];
      if (latestNotification && !latestNotification.is_read) {
        new Notification(latestNotification.title, {
          body: latestNotification.message,
          icon: "/favicon.ico",
        });
      }
    }
  }, [unreadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead.mutateAsync(id);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification.mutateAsync(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "payment_reminder":
        return "💰";
      case "debt_alert":
        return "⚠️";
      case "savings_goal":
        return "🎯";
      default:
        return "📋";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{getTranslation(language, "notifications")}</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAllAsRead.mutate()} className="gap-1">
                <CheckCheck className="h-4 w-4" />
                {getTranslation(language, "markAllRead")}
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-4 space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 ${!notification.is_read ? "bg-primary/5 border-primary/20" : ""}`}
              >
                <div className="flex gap-3">
                  <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{notification.title}</p>
                      {!notification.is_read && (
                        <Badge variant="secondary" className="h-5 text-xs">
                          {getTranslation(language, "new")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    {notification.due_date && (
                      <p className="text-xs text-muted-foreground">
                        {getTranslation(language, "dueDate")}: {new Date(notification.due_date).toLocaleDateString(language === "es" ? "es-ES" : "en-US")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="gap-1"
                    >
                      <Check className="h-3 w-3" />
                      {getTranslation(language, "markRead")}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(notification.id)}
                    className="gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    {getTranslation(language, "delete")}
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>{getTranslation(language, "noNotifications")}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};