import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FoodPost } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, MapPin } from "lucide-react";

export function MapView() {
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const { data: posts, isLoading, error } = useQuery<FoodPost[]>({
    queryKey: ["/api/posts"],
  });
  
  // Map would be initialized here with a useEffect
  useEffect(() => {
    // This is a placeholder for actual map initialization
    // In a real implementation, you would initialize a map library like Google Maps or Leaflet
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !mapLoaded) {
    return (
      <div className="bg-[#F5F5F5] rounded-soft overflow-hidden h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
          <Skeleton className="h-6 w-40 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#F5F5F5] rounded-soft overflow-hidden h-[600px] flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-montserrat font-semibold text-[#424242] mb-2">
            Error loading map
          </h3>
          <p className="text-[#9E9E9E] mb-4 max-w-md">
            There was a problem loading the map. Please check your internet connection and try again.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-[#4CAF50] text-white hover:bg-[#388E3C]"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="bg-[#F5F5F5] rounded-soft overflow-hidden h-[600px] flex items-center justify-center">
        <div className="text-center p-6">
          <MapPin className="h-12 w-12 text-[#9E9E9E] mx-auto mb-4" />
          <h3 className="text-xl font-montserrat font-semibold text-[#424242] mb-2">
            No food posts in this area
          </h3>
          <p className="text-[#9E9E9E] mb-4 max-w-md">
            There are no food posts available in the current map area. Try zooming out or searching in a different location.
          </p>
        </div>
      </div>
    );
  }

  // In a real implementation, you would render a map with markers for each post
  // This is a placeholder that mimics what a map might look like
  return (
    <div className="relative bg-[#F5F5F5] rounded-soft overflow-hidden h-[600px]">
      {/* Map placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="absolute inset-0 bg-repeat opacity-20" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBzdHJva2U9IiNDQ0MiIHN0cm9rZS13aWR0aD0iLjUiIGQ9Ik0uMjUuMjVoMTkuNXYxOS41SC4yNXoiLz48cGF0aCBmaWxsPSIjRUVFIiBkPSJNNSA1aDEwdjEwSDV6Ii8+PC9nPjwvc3ZnPg==')" }}></div>
      </div>
      
      {/* Map markers */}
      {posts.slice(0, 10).map((post, index) => (
        <div 
          key={post.id}
          className={`absolute w-8 h-8 flex items-center justify-center rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer shadow-md
            ${post.type === 'donation' ? 'bg-[#4CAF50] text-white' : 'bg-[#42A5F5] text-white'}
          `}
          style={{
            // Generate random positions for the demo
            left: `${20 + (index * 7) % 80}%`,
            top: `${15 + (index * 11) % 70}%`,
            zIndex: 10,
          }}
          title={post.title}
        >
          <MapPin className="h-4 w-4" />
        </div>
      ))}
      
      {/* Map controls */}
      <div className="absolute top-4 right-4 bg-white rounded-soft shadow-soft p-2 flex flex-col space-y-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <span className="text-[#424242] font-bold">+</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <span className="text-[#424242] font-bold">−</span>
        </Button>
      </div>
      
      {/* Location button */}
      <div className="absolute bottom-4 right-4">
        <Button 
          className="bg-white text-[#424242] hover:bg-gray-100 shadow-soft"
          size="sm"
        >
          <MapPin className="mr-2 h-4 w-4" />
          Use my location
        </Button>
      </div>
      
      <div className="absolute bottom-4 left-4 bg-white rounded-soft shadow-soft p-3">
        <p className="text-sm text-[#9E9E9E]">
          {posts.length} items in this area
        </p>
      </div>
    </div>
  );
}