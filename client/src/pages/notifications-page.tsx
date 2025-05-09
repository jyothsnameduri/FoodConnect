import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Helmet } from "react-helmet";

export default function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  
  // Fetch notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications");
      return await res.json();
    },
    enabled: !!user,
  });
  
  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${notificationId}/read`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });
  
  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/notifications/read-all");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });
  
  // Handle mark as read
  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };
  
  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };
  
  // Filter notifications
  const filteredNotifications = notifications?.filter((notification: any) => {
    if (filter === "unread") {
      return !notification.isRead;
    }
    return true;
  });
  
  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to view your notifications.
          </p>
          <Button asChild>
            <Link href="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Notifications | FoodShare</title>
        <meta 
          name="description" 
          content="View your FoodShare notifications for claims, messages, and updates."
        />
      </Helmet>
      
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Notifications</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilter("all")}
              className={filter === "all" ? "bg-primary/10" : ""}
            >
              All
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilter("unread")}
              className={filter === "unread" ? "bg-primary/10" : ""}
            >
              Unread
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending || !notifications?.some((n: any) => !n.isRead)}
            >
              Mark All as Read
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredNotifications?.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification: any) => (
              <NotificationCard 
                key={notification.id} 
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-medium mb-2">No Notifications</h3>
            <p className="text-muted-foreground mb-6">
              {filter === "unread" 
                ? "You have no unread notifications." 
                : "You don't have any notifications yet."}
            </p>
            {filter === "unread" && (
              <Button variant="outline" onClick={() => setFilter("all")}>
                View All Notifications
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

interface NotificationCardProps {
  notification: any;
  onMarkAsRead: (id: number) => void;
}

function NotificationCard({ notification, onMarkAsRead }: NotificationCardProps) {
  // Get link based on notification type
  const getNotificationLink = () => {
    switch (notification.relatedType) {
      case "claim":
        return `/claims/${notification.relatedId}`;
      case "post":
        return `/posts/${notification.relatedId}`;
      default:
        return "#";
    }
  };
  
  return (
    <Card className={notification.isRead ? "opacity-75" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{notification.title}</CardTitle>
          {!notification.isRead && (
            <Badge variant="default">New</Badge>
          )}
        </div>
        <CardDescription>
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{notification.message}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button asChild variant="outline">
          <Link href={getNotificationLink()}>View Details</Link>
        </Button>
        {!notification.isRead && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onMarkAsRead(notification.id)}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark as Read
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
