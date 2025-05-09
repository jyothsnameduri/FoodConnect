import { Link } from "wouter";
import { FoodPost } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: FoodPost;
}

export function PostCard({ post }: PostCardProps) {
  // Format dates for display
  const formattedDate = post.createdAt ? formatDistanceToNow(
    new Date(post.createdAt),
    { addSuffix: true }
  ) : 'Recently';

  // Calculate time until expiry
  const calculateExpiryTime = () => {
    if (!post.expiryTime) return "No expiry set";
    
    const expiryDate = new Date(post.expiryTime);
    const now = new Date();
    
    if (expiryDate < now) {
      return "Expired";
    }
    
    return `Expires ${formatDistanceToNow(expiryDate, { addSuffix: true })}`;
  };

  // Placeholder image when no images are available
  const defaultImage = post.type === 'donation' 
    ? "https://images.unsplash.com/photo-1592424002053-21f369ad7fdb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80"
    : "https://images.unsplash.com/photo-1546552768-9e3a5c5a8ffd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80";

  // Status colors and badges
  const getStatusColor = () => {
    switch (post.status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'claimed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-soft shadow-soft overflow-hidden transition-all duration-300 hover:shadow-medium">
      <div className="relative">
        <img 
          src={defaultImage} 
          alt={post.title} 
          className="w-full h-48 object-cover" 
        />
        <div className="absolute top-2 right-2">
          <span 
            className={`
              text-xs font-montserrat font-semibold px-2 py-1 rounded-full
              ${post.type === 'donation' 
                ? 'bg-[#4CAF50]/10 text-[#4CAF50]' 
                : 'bg-[#42A5F5]/10 text-[#42A5F5]'}
            `}
          >
            {post.type === 'donation' ? 'Donation' : 'Request'}
          </span>
        </div>
        {post.status !== 'available' && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 px-2 text-center">
            <span className={`text-xs font-montserrat font-semibold px-2 py-0.5 rounded-full ${getStatusColor()}`}>
              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-montserrat font-semibold text-lg">
            <Link href={`/posts/${post.id}`} className="hover:text-[#4CAF50] transition-colors">
              {post.title}
            </Link>
          </h3>
        </div>
        
        <div className="flex items-center text-[#9E9E9E] text-sm mt-1">
          <MapPin className="inline-block w-3 h-3 mr-1" /> 
          <span className="truncate">{post.address}</span>
        </div>
        
        <p className="font-opensans text-sm mt-2 text-[#424242] line-clamp-2">
          {post.description}
        </p>
        
        <div className="mt-2 text-xs text-[#9E9E9E] flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {calculateExpiryTime()}
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-xs text-[#9E9E9E]">
            Posted {formattedDate}
          </div>
          
          <Button 
            className={`
              px-3 py-1 text-sm rounded-soft text-white
              ${post.type === 'donation' 
                ? 'bg-[#4CAF50] hover:bg-[#388E3C]' 
                : 'bg-[#42A5F5] hover:bg-[#1976D2]'}
            `}
            asChild
          >
            <Link href={`/posts/${post.id}`}>
              {post.type === 'donation' ? 'Claim' : 'Respond'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}