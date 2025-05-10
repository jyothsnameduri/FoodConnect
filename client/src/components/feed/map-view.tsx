import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FoodPost } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, MapPin } from "lucide-react";
import MapGL, { Marker } from 'react-map-gl';
import { Link } from "wouter";

const MAPBOX_TOKEN = 'pk.eyJ1IjoibmFuaS0wMDciLCJhIjoiY21hYnppcDlrMjYwZzJ3c2JqOHdhYmVpbCJ9.f2Ok8ZFGgkuAJyIYlQZxNA';

export function MapView({ filters }: { filters: any }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Build query params from filters
  const queryParams = new URLSearchParams();
  if (filters?.type && filters.type !== 'all') queryParams.set('type', filters.type);
  if (filters?.distance) queryParams.set('distance', filters.distance.toString());
  if (filters?.category && filters.category.length > 0) queryParams.set('category', filters.category.join(','));
  if (filters?.dietary && filters.dietary.length > 0) queryParams.set('dietary', filters.dietary.join(','));
  if (filters?.expiryWithin) queryParams.set('expiryWithin', filters.expiryWithin.toString());

  const apiUrl = `/api/posts?${queryParams.toString()}`;

  const { data: posts, isLoading, error } = useQuery<FoodPost[]>({
    queryKey: ["/api/posts", filters],
    queryFn: async () => {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch posts');
      return res.json();
    },
  });
  
  // Track which pin/card wrapper is hovered
  const [hoveredPostId, setHoveredPostId] = useState<number | null>(null);

  // Center the map on the first post, or use a default location
  const defaultLat = posts && posts.length > 0 ? posts[0].latitude : 20.5937;
  const defaultLng = posts && posts.length > 0 ? posts[0].longitude : 78.9629;

  const [viewport, setViewport] = useState({
    latitude: defaultLat,
    longitude: defaultLng,
    zoom: 4,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 500); // faster load for real map
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

  return (
    <div className="relative bg-[#F5F5F5] rounded-soft overflow-hidden h-[600px]">
      <MapGL
        width="100%"
        height="600px"
        latitude={viewport.latitude}
        longitude={viewport.longitude}
        zoom={viewport.zoom}
        mapboxApiAccessToken={MAPBOX_TOKEN}
        onViewportChange={setViewport}
        mapStyle="mapbox://styles/mapbox/streets-v11"
      >
        {posts.map((post) => (
          <Marker
            key={post.id}
            latitude={post.latitude}
            longitude={post.longitude}
            offsetLeft={-16}
            offsetTop={-32}
          >
            <div
              onMouseEnter={() => setHoveredPostId(post.id)}
              onMouseLeave={() => setHoveredPostId(null)}
              style={{ position: 'relative', display: 'inline-block' }}
            >
              <div
                title={post.title}
                className={`w-8 h-8 flex items-center justify-center rounded-full shadow-md cursor-pointer
                  ${post.type === 'donation' ? 'bg-[#4CAF50] text-white' : 'bg-[#42A5F5] text-white'}
                `}
              >
                <MapPin className="h-4 w-4" />
              </div>
              {hoveredPostId === post.id && (
                <Link
                  href={`/posts/${post.id}`}
                  className="absolute left-1/2 bottom-full mb-2 w-64 bg-white rounded-lg shadow-lg p-3 z-50 border border-gray-200 cursor-pointer hover:bg-[#F5F5F5] transition-colors"
                  style={{ transform: 'translateX(-50%)', textDecoration: 'none' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="font-semibold text-[#424242] text-base mb-1">{post.title}</div>
                  <div className="text-xs text-[#9E9E9E] mb-1 line-clamp-2">{post.description}</div>
                  <div className="flex justify-between text-xs text-[#757575] mb-1">
                    <span>Qty: {post.quantity}</span>
                    <span>{post.category.replace('_', ' ')}</span>
                  </div>
                  <div className="text-xs text-[#757575]">
                    Expiry: {post.expiryTime ? new Date(post.expiryTime).toLocaleString() : 'N/A'}
                  </div>
                  <div className="mt-2 text-center">
                    <span className="inline-block bg-[#4CAF50] text-white text-xs px-3 py-1 rounded-full font-semibold">View & Claim</span>
                  </div>
                </Link>
              )}
            </div>
          </Marker>
        ))}
      </MapGL>
    </div>
  );
}