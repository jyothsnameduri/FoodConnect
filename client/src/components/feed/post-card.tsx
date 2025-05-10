import { Link } from "wouter";
import { FoodPost } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, CalendarDays } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ClaimButton } from "@/components/post/claim-button";
import { useEffect, useState } from "react";

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

  // Mapbox reverse geocoding for location name
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  useEffect(() => {
    if (post.latitude && post.longitude) {
      setLocationLoading(true);
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${post.longitude},${post.latitude}.json?access_token=pk.eyJ1IjoibmFuaS0wMDciLCJhIjoiY21hYnppcDlrMjYwZzJ3c2JqOHdhYmVpbCJ9.f2Ok8ZFGgkuAJyIYlQZxNA&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data.features && data.features.length > 0) {
            setLocationName(data.features[0].place_name);
          } else {
            setLocationName(null);
          }
        })
        .catch(() => setLocationName(null))
        .finally(() => setLocationLoading(false));
    }
  }, [post.latitude, post.longitude]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl border border-[#F0F0F0] group flex flex-col justify-between">
      <div>
      <div className="relative">
        <img 
          src={defaultImage} 
          alt={post.title} 
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
        />
          <div className="absolute top-2 right-2 z-10">
          <span 
            className={`
                text-xs font-montserrat font-semibold px-3 py-1 rounded-full shadow-md
              ${post.type === 'donation' 
                  ? 'bg-[#4CAF50] text-white' 
                  : 'bg-[#42A5F5] text-white'}
            `}
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
          >
            {post.type === 'donation' ? 'Donation' : 'Request'}
            </span>
          </div>
      </div>

        <div className="p-5 flex flex-col gap-2">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-montserrat font-bold text-lg text-[#222] leading-tight truncate">
            <Link href={`/posts/${post.id}`} className="hover:text-[#4CAF50] transition-colors">
              {post.title}
            </Link>
          </h3>
        </div>
          <div className="flex items-center gap-2 text-[#4CAF50] text-sm font-semibold mt-1">
            <MapPin className="inline-block w-4 h-4 text-[#4CAF50]" />
            <span>Location</span>
          </div>
          {post.latitude && post.longitude && (
            <div className="bg-[#F5F5F5] rounded-md px-3 py-2 text-xs text-[#424242] font-opensans mb-1 flex items-center gap-2">
              <span className="truncate w-full" title={locationName || undefined}>
                {locationLoading ? 'Loading location...' : (locationName || `Lat: ${post.latitude}, Lng: ${post.longitude}`)}
              </span>
        </div>
          )}
          <div className="border-t border-[#E0E0E0] my-2" />
          <p className="font-opensans text-sm text-[#424242] line-clamp-2 mb-1">
          {post.description}
        </p>
          <div className="flex flex-row items-center gap-3 mt-2">
            <span className="inline-flex items-center bg-[#FFF3E0] text-[#FF9800] text-xs px-3 py-1 rounded-full font-semibold">
              <CalendarDays className="w-3 h-3 mr-1" />
              {calculateExpiryTime()}
            </span>
            <span className="flex items-center text-xs text-[#9E9E9E]">
          <Clock className="w-3 h-3 mr-1" />
              Posted {formattedDate}
            </span>
          </div>
        </div>
      </div>
      <div className="bg-[#FAFAFA] px-5 py-3 flex flex-col gap-2 border-t border-[#F0F0F0]">
        {/* Rich claimed/completed message */}
        {post.status === 'claimed' && post.updatedAt && (
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center text-base font-semibold text-blue-800 bg-blue-100 rounded-lg px-4 py-2 shadow-sm">
              <Clock className="w-4 h-4 mr-2 text-blue-500" />
              Claimed @ {format(new Date(post.updatedAt), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        )}
        {post.status === 'completed' && post.updatedAt && (
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center text-base font-semibold text-purple-800 bg-purple-100 rounded-lg px-4 py-2 shadow-sm">
              <Clock className="w-4 h-4 mr-2 text-purple-500" />
              Completed @ {format(new Date(post.updatedAt), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
        )}
        <div>
          <ClaimButton post={post} />
        </div>
      </div>
    </div>
  );
}