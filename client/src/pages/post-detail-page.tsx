import { useState } from "react";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { FoodPost, FoodPostImage } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ClaimButton } from "@/components/post/claim-button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Flag,
  Gift,
  Loader2, 
  MapPin, 
  MessageCircle,
  Share2, 
  Star, 
  User,
  X 
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { StatusTimeline } from "@/components/ui/status-timeline";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch post data
  const { data: post, isLoading, error } = useQuery<FoodPost>({
    queryKey: [`/api/posts/${id}`],
  });

  // Fetch post images
  const { data: images, isLoading: imagesLoading } = useQuery<FoodPostImage[]>({
    queryKey: [`/api/posts/${id}/images`],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${id}/images`);
      if (!res.ok) throw new Error('Failed to fetch post images');
      return res.json();
    },
    enabled: !!post,
  });

  // Format dates for display
  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return format(date, "EEE, MMM d, yyyy 'at' h:mm a");
  };

  // Calculate time until expiry
  const calculateExpiryTime = (expiryTime: string | Date) => {
    const expiryDate = typeof expiryTime === 'string' ? new Date(expiryTime) : expiryTime;
    const now = new Date();
    
    if (expiryDate < now) {
      return "Expired";
    }
    
    return `Expires ${formatDistanceToNow(expiryDate, { addSuffix: true })}`;
  };

  // Get status colors and text
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-[#4CAF50]/10 text-[#4CAF50]';
      case 'claimed':
        return 'bg-[#42A5F5]/10 text-[#42A5F5]';
      case 'completed':
        return 'bg-[#673AB7]/10 text-[#673AB7]';
      case 'expired':
        return 'bg-[#9E9E9E]/10 text-[#9E9E9E]';
      default:
        return 'bg-[#9E9E9E]/10 text-[#9E9E9E]';
    }
  };

  // Default image when no images are available
  const defaultImage = post?.type === 'donation' 
    ? "https://images.unsplash.com/photo-1592424002053-21f369ad7fdb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80"
    : "https://images.unsplash.com/photo-1546552768-9e3a5c5a8ffd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80";

  // Handle image navigation
  const nextImage = () => {
    if (images && images.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images && images.length > 0) {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    }
  };

  // The defaultImage variable is already defined above

  // Handle claiming a post
  const handleClaim = () => {
    toast({
      title: "Post claimed!",
      description: "You've successfully claimed this item. Contact details have been shared.",
    });
  };

  // Handle sharing a post
  const handleShare = () => {
    // In a real app, this would use the Web Share API or copy to clipboard
    toast({
      title: "Link copied!",
      description: "The link to this post has been copied to your clipboard.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#4CAF50]" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-montserrat font-bold text-[#424242] mb-4">
            Post Not Found
          </h1>
          <p className="text-[#9E9E9E] mb-8">
            The food post you're looking for doesn't exist or has been removed.
          </p>
          <Button 
            className="bg-[#4CAF50] text-white hover:bg-[#388E3C]"
            asChild
          >
            <Link href="/feed">
              Return to Feed
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} | FoodShare</title>
        <meta 
          name="description" 
          content={post.description.substring(0, 155)}
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-2 p-0 text-[#9E9E9E] hover:text-[#4CAF50] hover:bg-transparent"
            asChild
          >
            <Link href="/feed">
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back to Feed
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="relative bg-[#F5F5F5] rounded-soft overflow-hidden h-[300px] md:h-[400px]">
              {imagesLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#4CAF50]" />
                </div>
              ) : (
                <img 
                  src={images && images.length > 0 ? images[currentImageIndex].imageUrl : defaultImage} 
                  alt={post.title} 
                  className="w-full h-full object-cover" 
                />
              )}
              
              {images && images.length > 1 && (
                <>
                  <Button 
                    onClick={prevImage}
                    variant="ghost" 
                    size="icon" 
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-soft"
                  >
                    <ChevronLeft className="h-5 w-5 text-[#424242]" />
                  </Button>
                  <Button 
                    onClick={nextImage}
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-soft"
                  >
                    <ChevronRight className="h-5 w-5 text-[#424242]" />
                  </Button>
                  
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {images.map((_, index) => (
                      <div 
                        key={index} 
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Post information */}
            <div className="bg-white rounded-soft shadow-soft p-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="font-montserrat font-bold text-2xl text-[#424242]">
                  {post.title}
                </h1>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(post.status)}>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </Badge>
                  <Badge className={post.type === 'donation' 
                    ? 'bg-[#4CAF50]/10 text-[#4CAF50]' 
                    : 'bg-[#42A5F5]/10 text-[#42A5F5]'
                  }>
                    {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                  </Badge>
                </div>
              </div>
              
              {/* Status Timeline */}
              <StatusTimeline
                createdAt={post.createdAt}
                currentStatus={post.status}
                // claimedAt, pickedUpAt, completedAt, expiredAt can be added if available
              />
              
              <p className="text-[#424242] mb-6 whitespace-pre-line">
                {post.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start">
                  <Gift className="h-5 w-5 text-[#4CAF50] mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-montserrat font-semibold text-[#424242]">Quantity</h3>
                    <p className="text-[#9E9E9E]">{post.quantity}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-[#FF9800] mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-montserrat font-semibold text-[#424242]">Location</h3>
                    <p className="text-[#9E9E9E]">Location on map</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-[#673AB7] mr-3 mt-0.5" />
                  {/* Pickup window section removed */}
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-[#F44336] mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-montserrat font-semibold text-[#424242]">Expiry</h3>
                    <p className="text-[#9E9E9E]">
                      {post.expiryTime && formatDate(post.expiryTime)}
                      <br />
                      <span className={post.expiryTime && new Date(post.expiryTime) < new Date() ? 'text-[#F44336]' : ''}>
                        {post.expiryTime && calculateExpiryTime(post.expiryTime)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Dietary information */}
              {post.dietary && post.dietary.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-montserrat font-semibold text-[#424242] mb-2">Dietary Information</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.dietary.map((item) => (
                      <Badge key={item} variant="outline" className="bg-[#F5F5F5] text-[#424242] font-normal capitalize">
                        {item.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Category */}
              <div className="mb-6">
                <h3 className="font-montserrat font-semibold text-[#424242] mb-2">Category</h3>
                <Badge variant="outline" className="bg-[#F5F5F5] text-[#424242] font-normal capitalize">
                  {post.category.replace('_', ' ')}
                </Badge>
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {/* Replace the claim buttons with our new ClaimButton component */}
                {post.status === 'available' && (
                  <ClaimButton post={post} />
                )}
                
                <Button 
                  variant="outline" 
                  className="border-[#E0E0E0] text-[#424242]"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="border-[#E0E0E0] text-[#F44336]"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Report this post</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to report this post? If this post violates our community guidelines, it will be reviewed by our team.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-[#F44336] text-white hover:bg-[#D32F2F]"
                        onClick={() => {
                          toast({
                            title: "Report submitted",
                            description: "Thank you for helping keep our community safe. Our team will review this post.",
                          });
                        }}
                      >
                        Report
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
          
          {/* Right column: User info, map, etc. */}
          <div className="space-y-6">
            {/* User card */}
            <div className="bg-white rounded-soft shadow-soft p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-[#E0E0E0] overflow-hidden mr-4">
                  <User className="w-full h-full p-2 text-[#9E9E9E]" />
                </div>
                <div>
                  <h3 className="font-montserrat font-semibold text-[#424242]">
                    {post.userId === user?.id ? 'You' : 'User'}
                  </h3>
                  <div className="flex items-center text-[#FFC107]">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-[#9E9E9E] text-sm ml-1">(5.0)</span>
                  </div>
                </div>
              </div>
              
              {post.userId !== user?.id && (
                <Button 
                  className="w-full bg-[#4CAF50] text-white hover:bg-[#388E3C]"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              )}
            </div>
            
            {/* Map card */}
            <div className="bg-white rounded-soft shadow-soft p-6">
              <h3 className="font-montserrat font-semibold text-[#424242] mb-4">Location</h3>
              
              <div className="bg-[#F5F5F5] rounded-soft h-[200px] mb-4 relative overflow-hidden">
                {/* Placeholder for an actual map component */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="absolute inset-0 bg-repeat opacity-20" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBzdHJva2U9IiNDQ0MiIHN0cm9rZS13aWR0aD0iLjUiIGQ9Ik0uMjUuMjVoMTkuNXYxOS41SC4yNXoiLz48cGF0aCBmaWxsPSIjRUVFIiBkPSJNNSA1aDEwdjEwSDV6Ii8+PC9nPjwvc3ZnPg==')" }}></div>
                </div>
                
                <div 
                  className={`absolute left-1/2 top-1/2 w-8 h-8 flex items-center justify-center rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-md
                    ${post.type === 'donation' ? 'bg-[#4CAF50] text-white' : 'bg-[#42A5F5] text-white'}
                  `}
                >
                  <MapPin className="h-4 w-4" />
                </div>
              </div>
              
              <p className="text-[#9E9E9E] text-sm">
                Location on map
              </p>
            </div>
            
            {/* Similar posts card */}
            <div className="bg-white rounded-soft shadow-soft p-6">
              <h3 className="font-montserrat font-semibold text-[#424242] mb-4">Similar Items Nearby</h3>
              
              <div className="text-[#9E9E9E] text-center py-4">
                <p>Similar items will appear here.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}