import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, Check, Clock, Loader2, Package, ShoppingBag, User, Star, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { Notification } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export function NotificationsDropdown() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications for the current user
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/mark-all-read");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notifications as read.",
        variant: "destructive",
      });
    }
  });

  // Mark notification as read when dropdown is opened
  useEffect(() => {
    if (isOpen && notifications?.some(n => !n.isRead)) {
      markAllAsReadMutation.mutate();
    }
  }, [isOpen, notifications]);

  // Count unread notifications
  const unreadCount = notifications?.filter(notification => !notification.isRead).length || 0;

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'claim_created':
        return <ShoppingBag className="h-4 w-4 text-[#4CAF50]" />;
      case 'claim_approved':
        return <Check className="h-4 w-4 text-[#4CAF50]" />;
      case 'claim_rejected':
        return <X className="h-4 w-4 text-[#F44336]" />;
      case 'post_claimed':
        return <Package className="h-4 w-4 text-[#42A5F5]" />;
      case 'rating_received':
        return <Star className="h-4 w-4 text-[#FFC107]" />;
      default:
        return <Bell className="h-4 w-4 text-[#9E9E9E]" />;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-[#424242]" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-[0.35rem] py-[0.15rem] min-w-[1.2rem] min-h-[1.2rem] flex items-center justify-center bg-[#F44336] text-white border-0 text-[0.7rem]"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px] p-0">
        <div className="flex justify-between items-center p-3 bg-[#FAFAFA]">
          <h3 className="font-opensans font-semibold text-[#424242]">Notifications</h3>
          {notifications && notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="h-8 text-xs"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : null}
              Mark all as read
            </Button>
          )}
        </div>
        
        <div className="max-h-[350px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-[#9E9E9E]" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="text-center py-8 px-4 text-[#9E9E9E]">
              <Bell className="h-10 w-10 mx-auto mb-2 text-[#E0E0E0]" />
              <p>No notifications yet</p>
              <p className="text-sm mt-1">Check back later for updates</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} asChild>
                <Link 
                  href={notification.link || '#'}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer hover:bg-[#F5F5F5]",
                    !notification.isRead && "bg-[#E8F5E9]"
                  )}
                >
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[#F5F5F5] rounded-full">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#424242] whitespace-normal break-words">
                      {notification.content}
                    </p>
                    <div className="flex items-center mt-1 text-xs text-[#9E9E9E]">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        {notifications && notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/notifications" className="flex justify-center p-2 text-sm text-[#4CAF50]">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}