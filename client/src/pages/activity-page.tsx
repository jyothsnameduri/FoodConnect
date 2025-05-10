import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { useState } from "react";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

export default function ActivityPage() {
  const { user } = useAuth();
  // State for managing rating display and filtering
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Fetch user's posts (donations made)
  const { data: myPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/posts?userId=${user?.id}`);
      return await res.json();
    },
    enabled: !!user,
  });

  // Fetch user's claims (donations received)
  const { data: myClaims, isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/claims", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/claims");
      return await res.json();
    },
    enabled: !!user,
  });

  // Fetch ratings received
  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ["/api/ratings", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/ratings?userId=${user?.id}`);
      return await res.json();
    },
    enabled: !!user,
  });

  // State for expanded rating details
  const [expandedRating, setExpandedRating] = useState<number | null>(null);

  // Function to sort and filter ratings
  const getSortedAndFilteredRatings = () => {
    if (!ratings) return [];
    
    // Apply filter if set
    let filteredRatings = ratingFilter !== null 
      ? ratings.filter((r: any) => r.rating === ratingFilter)
      : ratings;
    
    // Apply sorting
    return [...filteredRatings].sort((a: any, b: any) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOrder === 'highest') {
        return b.rating - a.rating;
      } else { // lowest
        return a.rating - b.rating;
      }
    });
  };
  
  // Get rating distribution
  const getRatingDistribution = () => {
    if (!ratings || ratings.length === 0) return [];
    
    const distribution = [0, 0, 0, 0, 0]; // 5 stars, 4 stars, 3 stars, 2 stars, 1 star
    
    ratings.forEach((r: any) => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[5 - r.rating]++;
      }
    });
    
    return distribution;
  };

  // Calculate stats
  const totalDonationsMade = myPosts?.filter((p: any) => p.type === "donation" && p.status === "completed").length || 0;
  const totalDonationsReceived = myClaims?.filter((c: any) => c.status === "completed").length || 0;
  const avgRating = ratings && ratings.length > 0 ? (ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length).toFixed(2) : null;

  // Calculate percentage for each star rating
  const ratingDistribution = getRatingDistribution();
  const totalRatingsCount = ratings?.length || 0;
  const ratingPercentages = ratingDistribution.map(count => 
    totalRatingsCount > 0 ? Math.round((count / totalRatingsCount) * 100) : 0
  );

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-10 text-center dark:text-white transition-colors duration-300">My Activity</h1>
      <div className="grid md:grid-cols-2 gap-10">
        {/* History Section */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-md rounded-xl dark:bg-gray-800 transition-colors duration-300">
          <CardHeader className="bg-gray-50 dark:bg-gray-900 rounded-t-xl border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <CardTitle className="text-xl dark:text-white">History</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Donations and pickups completed</CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <span className="text-xs text-gray-500 dark:text-gray-400">Total Donations Made</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-500">{totalDonationsMade}</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <span className="text-xs text-gray-500 dark:text-gray-400">Total Donations Received</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalDonationsReceived}</span>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1 transition-colors duration-300">Completed Donations</h3>
              {postsLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {myPosts?.filter((p: any) => p.status === "completed").map((p: any, idx: number) => (
                    <li key={p.id} className={`flex flex-col py-3 px-2 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} transition-colors duration-300`}>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{p.title}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">Completed on {format(new Date(p.updatedAt), 'PP')}</span>
                    </li>
                  ))}
                  {(!myPosts || myPosts.filter((p: any) => p.status === "completed").length === 0) && (
                    <li className="text-center text-gray-400 dark:text-gray-500 py-3">No completed donations yet.</li>
                  )}
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1 transition-colors duration-300">Completed Pickups</h3>
              {claimsLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                  {myClaims?.filter((c: any) => c.status === "completed").map((c: any, idx: number) => (
                    <li key={c.id} className={`flex flex-col py-3 px-2 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} transition-colors duration-300`}>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{c.post?.title || 'Donation'}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">Completed on {format(new Date(c.updatedAt), 'PP')}</span>
                    </li>
                  ))}
                  {(!myClaims || myClaims.filter((c: any) => c.status === "completed").length === 0) && (
                    <li className="text-center text-gray-400 dark:text-gray-500 py-3">No completed pickups yet.</li>
                  )}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reputation Section */}
        <Card className="border border-gray-200 dark:border-gray-700 shadow-md rounded-xl dark:bg-gray-800 transition-colors duration-300">
          <CardHeader className="bg-gray-50 dark:bg-gray-900 rounded-t-xl border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <CardTitle className="text-xl dark:text-white">Reputation</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">Your ratings and feedback</CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            {/* Enhanced Average Rating Section */}
            <div className="flex flex-col gap-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Average Rating:</span>
                {avgRating ? (
                  <span className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-6 w-6 ${i < Math.round(Number(avgRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                    ))}
                    <span className="ml-2 text-2xl font-bold text-yellow-600 dark:text-yellow-500">{avgRating}</span>
                    <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">({totalRatingsCount} {totalRatingsCount === 1 ? 'review' : 'reviews'})</span>
                  </span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">No ratings yet</span>
                )}
              </div>
              
              {/* Rating Distribution */}
              {ratings && ratings.length > 0 && (
                <div className="mt-2 space-y-2">
                  {[5, 4, 3, 2, 1].map((star, idx) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-sm w-8 dark:text-gray-300">{star} star</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 transition-colors duration-300">
                        <div 
                          className="bg-yellow-400 dark:bg-yellow-500 h-2.5 rounded-full transition-colors duration-300" 
                          style={{ width: `${ratingPercentages[idx]}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{ratingPercentages[idx]}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Enhanced Individual Ratings Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Individual Ratings</h3>
                {ratings && ratings.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select 
                      className="text-xs border border-gray-200 dark:border-gray-700 rounded p-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors duration-300"
                      value={ratingFilter === null ? 'all' : ratingFilter}
                      onChange={(e) => setRatingFilter(e.target.value === 'all' ? null : Number(e.target.value))}
                    >
                      <option value="all">All Ratings</option>
                      {[5, 4, 3, 2, 1].map(star => (
                        <option key={star} value={star}>{star} Stars</option>
                      ))}
                    </select>
                    <select
                      className="text-xs border border-gray-200 dark:border-gray-700 rounded p-1 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors duration-300"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'newest' | 'highest' | 'lowest')}
                    >
                      <option value="newest">Newest</option>
                      <option value="highest">Highest First</option>
                      <option value="lowest">Lowest First</option>
                    </select>
                  </div>
                )}
              </div>
              
              {ratingsLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                <ul className="space-y-4 mt-4">
                  {getSortedAndFilteredRatings().map((rating: any) => (
                    <li 
                      key={rating.id} 
                      className="p-3 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center mb-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < rating.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                            ))}
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{format(new Date(rating.createdAt), 'PP')}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{rating.fromUser?.name || 'Anonymous'}</p>
                        </div>
                        <button 
                          onClick={() => setExpandedRating(expandedRating === rating.id ? null : rating.id)}
                          className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
                        >
                          {expandedRating === rating.id ? 'Show Less' : 'Show More'}
                        </button>
                      </div>
                      
                      {expandedRating === rating.id && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{rating.comment || 'No comment provided.'}"</p>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                            <p>For donation: {rating.post?.title || 'Unknown'}</p>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                  {getSortedAndFilteredRatings().length === 0 && (
                    <li className="text-center text-gray-400 dark:text-gray-500 py-6">No ratings found with the selected filter.</li>
                  )}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}