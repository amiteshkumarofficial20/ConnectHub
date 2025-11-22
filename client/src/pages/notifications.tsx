import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, CheckCircle2, MessageSquare, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Notification } from '@shared/schema';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('PATCH', `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', '/api/notifications/mark-all-read', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const filteredNotifications = notifications?.filter(n => 
    filter === 'unread' ? !n.isRead : true
  ) || [];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'like': return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-orange-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-background to-muted/30">
      <div className="p-6 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10 dark:bg-primary/20">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="heading-notifications">Notifications</h1>
              <p className="text-sm text-muted-foreground">Stay updated with the latest activity</p>
            </div>
          </div>
          {filteredNotifications.some(n => !n.isRead) && (
            <Button
              variant="default"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              data-testid="button-mark-all-read"
              className="shadow-md-professional hover-glow"
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            data-testid="button-filter-all"
            className={filter === 'all' ? 'shadow-md-professional hover-glow' : 'hover-scale'}
          >
            All ({notifications?.length || 0})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
            data-testid="button-filter-unread"
            className={filter === 'unread' ? 'shadow-md-professional hover-glow' : 'hover-scale'}
          >
            Unread ({notifications?.filter(n => !n.isRead).length || 0})
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bell className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-semibold text-foreground mb-2">No notifications</p>
            <p className="text-muted-foreground">You're all caught up!</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            {filteredNotifications.map((notification, index) => (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer transition-smooth hover-scale ${
                  !notification.isRead ? 'bg-primary/5 border-primary/20 dark:bg-primary/10' : 'hover:bg-card'
                }`}
                onClick={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
                data-testid={`card-notification-${notification.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1 p-2 rounded-lg bg-muted/50">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{notification.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {notification.createdAt ? (
                        <>
                          {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                          {new Date(notification.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </>
                      ) : (
                        'Just now'
                      )}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    {!notification.isRead && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-xs text-primary font-medium">New</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
