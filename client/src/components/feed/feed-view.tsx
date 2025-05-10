import { useState } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { FoodPost } from "@shared/schema";
import { PostCard } from "./post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function FeedView({ filters }: { filters: any }) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 8;

  // Always fetch all posts (no filters in query string)
  const apiUrl = `/api/posts?limit=1000`;

  const { data: posts, isLoading, error }: UseQueryResult<FoodPost[]> = useQuery<FoodPost[]>({
    queryKey: ["/api/posts", 1000],
    queryFn: async () => {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Failed to fetch posts');
      return res.json();
    },
  });

  // Frontend filtering logic
  const filteredPosts = (posts || []).filter(post => {
    // Type filter
    if (filters?.type && filters.type !== 'all' && post.type !== filters.type) return false;
    // Category filter
    if (filters?.category && filters.category.length > 0 && !filters.category.includes(post.category)) return false;
    // Dietary filter
    if (filters?.dietary && filters.dietary.length > 0 && !filters.dietary.every((d: string) => post.dietary?.includes(d as typeof post.dietary[number]))) return false;
    // Expiry filter
    if (filters?.expiryWithin) {
      const now = new Date();
      const expiry = new Date(post.expiryTime);
      const expiryLimit = new Date(now.getTime() + filters.expiryWithin * 24 * 60 * 60 * 1000);
      if (expiry < now || expiry > expiryLimit) return false;
    }
    // Distance filter (not implemented, needs user location)
    return true;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="bg-white rounded-soft shadow-soft overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <div className="flex justify-between items-center mt-4">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-16 ml-2" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-montserrat font-semibold text-[#424242] mb-2">
          Error loading posts
        </h3>
        <p className="text-[#9E9E9E] mb-4">
          There was a problem fetching the latest posts. Please try again.
        </p>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-[#4CAF50] text-white hover:bg-[#388E3C]"
        >
          Refresh
        </Button>
      </div>
    );
  }

  if (!filteredPosts || filteredPosts.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-[#F5F5F5] rounded-soft">
        <h3 className="text-xl font-montserrat font-semibold text-[#424242] mb-2">
          No food posts available
        </h3>
        <p className="text-[#9E9E9E] mb-6 max-w-lg mx-auto">
          {user 
            ? "Be the first to share food in your community by creating a new post!" 
            : "Sign up to create your own food sharing post or check back later for new items."}
        </p>
        {user && (
          <Button 
            className="bg-[#4CAF50] text-white hover:bg-[#388E3C]"
            // onClick will be handled by the floating action button
          >
            Create Post
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {filteredPosts.length >= limit && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            className="mx-2 border border-[#E0E0E0] text-[#424242]"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            className="mx-2 border border-[#E0E0E0] text-[#424242]"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}