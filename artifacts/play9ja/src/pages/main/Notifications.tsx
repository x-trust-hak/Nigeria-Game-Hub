import { useListNotifications, useMarkAllNotificationsRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, CheckCircle2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const markAllMutation = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleMarkAllRead = () => {
    markAllMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast({ title: "Notifications marked as read" });
      }
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-display font-bold tracking-tight">Notifications</h1>
        {notifications?.some(n => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markAllMutation.isPending}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : notifications?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center">
          <Bell className="w-12 h-12 mb-4 opacity-20" />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications?.map((notification) => (
            <Card key={notification.id} className={`rounded-2xl border-none shadow-sm ${!notification.isRead ? 'bg-primary/5' : 'bg-card'}`}>
              <div className="p-4 flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!notification.isRead ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{notification.title}</h3>
                    <span className="text-xs text-muted-foreground">{new Date(notification.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}