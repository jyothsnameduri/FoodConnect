import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Loader2, 
  CheckCircle2, 
  X, 
  MessageCircle,
  AlertTriangle,
  Star,
  ThumbsUp,
  ShoppingBag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { format, formatDistanceToNow } from "date-fns";

export function NotificationsDropdown() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Fetch notifications
  const {
    data: notifications,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications?limit=10");
      return await res.json();
    },
    enabled: !!user,
  });
  
  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${id}/read`);
      return await res.json();
    },
    onSuccess: () => {
      refetch();
    },
  });
  
  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/notifications/read-all");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Marked all as read",
        description: "All notifications have been marked as read.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notifications as read",
        variant: "destructive",
      });
    },
  });
  
  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Navigate based on type
    if (notification.type === "claim_created" || 
        notification.type === "claim_updated" ||
        notification.type === "claim_rated") {
      navigate(`/claims/${notification.resourceId}`);
    } else if (notification.type === "new_message") {
      navigate(`/claims/${notification.resourceId}`);
    } else if (notification.type === "post_updated") {
      navigate(`/posts/${notification.resourceId}`);
    }
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "claim_created":
        return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case "claim_updated":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "claim_rated":
        return <Star className="h-4 w-4 text-yellow-500" />;
      case "new_message":
        return <MessageCircle className="h-4 w-4 text-indigo-500" />;
      case "post_updated":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };
  
  // Get notification text from type and resourceId
  const getNotificationText = (notification: any) => {
    switch (notification.type) {
      case "claim_created":
        return "New claim on your post";
      case "claim_updated":
        return "A claim has been updated";
      case "claim_rated":
        return "Someone rated your exchange";
      case "new_message":
        return "New message received";
      case "post_updated":
        return "A post you claimed was updated";
      default:
        return notification.content || "New notification";
    }
  };
  
  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Mark all as read"
              )}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications?.length > 0 ? (
          <DropdownMenuGroup>
            {notifications.map((notification: any) => (
              <DropdownMenuItem
                key={notification.id}
                className={`py-3 px-4 cursor-pointer ${!notification.isRead ? 'bg-accent/50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3 items-start w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                      {getNotificationText(notification)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ) : (
          <div className="py-6 text-center text-muted-foreground">
            <p>No notifications</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}