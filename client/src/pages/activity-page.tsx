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
  // Use a map to store individual ratings and comments for each claim
  const [ratingComments, setRatingComments] = useState<Record<number, string>>({});
  const [ratingValues, setRatingValues] = useState<Record<number, number>>({});
  const [rateClaimId, setRateClaimId] = useState<number | null>(null);

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

  // Track which claims are currently submitting ratings
  const [submittingClaims, setSubmittingClaims] = useState<Record<number, boolean>>({});

  // Submit rating mutation
  const submitRatingMutation = useMutation({
    mutationFn: async ({ claimId, rating, comment, toUserId }: { claimId: number, rating: number, comment: string, toUserId: number }) => {
      if (!user) throw new Error("User not authenticated");
      
      // Mark this claim as currently submitting
      setSubmittingClaims(prev => ({
        ...prev,
        [claimId]: true
      }));
      
      // Create a payload that matches the expected schema on the server
      const payload = {
        claimId: Number(claimId),
        fromUserId: Number(user.id),
        toUserId: Number(toUserId),
        rating: Number(rating),
        comment: comment || "",
        categories: [] // Include empty categories array as it's in the schema
      };
      
      console.log(`Submitting rating for claim ${claimId} with rating ${rating}`);
      
      try {
        const res = await apiRequest("POST", `/api/claims/${claimId}/rate`, payload);
        return {
          data: await res.json(),
          claimId
        };
      } catch (error) {
        // Make sure to clear the submitting state on error
        setSubmittingClaims(prev => ({
          ...prev,
          [claimId]: false
        }));
        throw error;
      }
    },
    onSuccess: (result) => {
      const { claimId } = result;
      
      // Update queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/ratings", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/claims", user?.id] });
      
      // Clear the submitting state for this claim
      setSubmittingClaims(prev => ({
        ...prev,
        [claimId]: false
      }));
      
      // Show success message
      alert(`Rating submitted successfully for claim ${claimId}`);
    },
    onError: (error, variables) => {
      // Clear the submitting state for this claim
      setSubmittingClaims(prev => ({
        ...prev,
        [variables.claimId]: false
      }));
      
      console.error(`Error submitting rating for claim ${variables.claimId}:`, error);
      alert(`Error submitting rating: ${error}`);
    }
  });

  // Calculate stats
  const totalDonationsMade = myPosts?.filter((p: any) => p.type === "donation" && p.status === "completed").length || 0;
  const totalDonationsReceived = myClaims?.filter((c: any) => c.status === "completed").length || 0;
  const avgRating = ratings && ratings.length > 0 ? (ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length).toFixed(2) : null;

  // Find completed, unrated claims for rating
  const unratedClaims = user ? myClaims?.filter((c: any) => 
    c.status === "completed" && !ratings?.some((r: any) => r.claimId === c.id && r.fromUserId === user.id)
  ) : [];

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-10 text-center">My Activity</h1>
      <div className="grid md:grid-cols-2 gap-10">
        {/* History Section */}
        <Card className="border border-gray-200 shadow-md rounded-xl">
          <CardHeader className="bg-gray-50 rounded-t-xl border-b border-gray-200">
            <CardTitle className="text-xl">History</CardTitle>
            <CardDescription className="text-gray-500">Donations and pickups completed</CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border">
                <span className="text-xs text-gray-500">Total Donations Made</span>
                <span className="text-2xl font-bold text-green-600">{totalDonationsMade}</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border">
                <span className="text-xs text-gray-500">Total Donations Received</span>
                <span className="text-2xl font-bold text-blue-600">{totalDonationsReceived}</span>
              </div>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-gray-700 border-b pb-1">Completed Donations</h3>
              {postsLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                <ul className="divide-y divide-gray-100">
                  {myPosts?.filter((p: any) => p.status === "completed").map((p: any, idx: number) => (
                    <li key={p.id} className={`flex flex-col py-3 px-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <span className="font-medium text-gray-800">{p.title}</span>
                      <span className="text-xs text-gray-400">Completed on {format(new Date(p.updatedAt), 'PP')}</span>
                    </li>
                  ))}
                  {(!myPosts || myPosts.filter((p: any) => p.status === "completed").length === 0) && (
                    <li className="text-center text-gray-400 py-3">No completed donations yet.</li>
                  )}
                </ul>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-700 border-b pb-1">Completed Pickups</h3>
              {claimsLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                <ul className="divide-y divide-gray-100">
                  {myClaims?.filter((c: any) => c.status === "completed").map((c: any, idx: number) => (
                    <li key={c.id} className={`flex flex-col py-3 px-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <span className="font-medium text-gray-800">{c.post?.title || 'Donation'}</span>
                      <span className="text-xs text-gray-400">Completed on {format(new Date(c.updatedAt), 'PP')}</span>
                    </li>
                  ))}
                  {(!myClaims || myClaims.filter((c: any) => c.status === "completed").length === 0) && (
                    <li className="text-center text-gray-400 py-3">No completed pickups yet.</li>
                  )}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reputation Section */}
        <Card className="border border-gray-200 shadow-md rounded-xl">
          <CardHeader className="bg-gray-50 rounded-t-xl border-b border-gray-200">
            <CardTitle className="text-xl">Reputation</CardTitle>
            <CardDescription className="text-gray-500">Your ratings and feedback</CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="font-semibold text-gray-700">Average Rating:</span>
              {avgRating ? (
                <span className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-6 w-6 ${i < Math.round(Number(avgRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                  <span className="ml-2 text-2xl font-bold text-yellow-600">{avgRating}</span>
                </span>
              ) : (
                <span className="text-gray-400">No ratings yet</span>
              )}
            </div>
            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-gray-700 border-b pb-1">Individual Ratings</h3>
              {ratingsLoading ? <Loader2 className="animate-spin mx-auto" /> : (
                <ul className="divide-y divide-gray-100">
                  {ratings?.length > 0 ? ratings.map((r: any, idx: number) => (
                    <li key={r.id} className={`py-3 px-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-5 w-5 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="font-semibold text-gray-700">{r.rating}</span>
                        <span className="text-xs text-gray-400 ml-2">{r.createdAt ? format(new Date(r.createdAt), 'PP') : ''}</span>
                      </div>
                      {r.comment && <div className="mt-1 text-sm text-gray-600 italic">"{r.comment}"</div>}
                    </li>
                  )) : <li className="text-center text-gray-400 py-3">No ratings yet.</li>}
                </ul>
              )}
            </div>
            {/* Rate after pickup */}
            {unratedClaims && unratedClaims.length > 0 && (
              <div className="mt-8 border-t pt-6">
                <h3 className="font-semibold mb-2 text-gray-700">Rate Your Recent Pickups</h3>
                <ul className="space-y-4">
                  {unratedClaims.map((c: any) => (
                    <li key={c.id} className="border rounded-lg p-4 flex flex-col gap-2 bg-gray-50">
                      <span className="font-medium text-gray-800">{c.post?.title || 'Donation'}</span>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              // Update rating for this specific claim
                              setRatingValues(prev => ({
                                ...prev,
                                [c.id]: i + 1
                              }));
                            }}
                            className={`focus:outline-none ${(ratingValues[c.id] || 5) > i ? 'text-yellow-400' : 'text-gray-300'}`}
                          >
                            <Star className="h-6 w-6" />
                          </button>
                        ))}
                        <span className="ml-2 text-lg">{ratingValues[c.id] || 5} Stars</span>
                      </div>
                      <Textarea
                        placeholder="Leave a comment (optional)"
                        value={ratingComments[c.id] || ""}
                        onChange={e => {
                          // Update comment for this specific claim
                          setRatingComments(prev => ({
                            ...prev,
                            [c.id]: e.target.value
                          }));
                        }}
                        rows={2}
                        className="bg-white border-gray-200"
                      />
                      <Button
                        onClick={() => {
                          if (!user) return;
                          // Determine toUserId - safely access properties
                          let toUserId = user?.id === c.claimerId ? c.post?.userId : c.claimerId;
                          
                          console.log(`Submitting rating for claim ${c.id}: ${ratingValues[c.id] || 5} stars`);
                          
                          submitRatingMutation.mutate({
                            claimId: c.id,
                            rating: ratingValues[c.id] || 5,
                            comment: ratingComments[c.id] || "",
                            toUserId
                          });
                        }}
                        disabled={submittingClaims[c.id] || !user}
                        className="self-end mt-2 w-full"
                      >
                        {submittingClaims[c.id] ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {submittingClaims[c.id] ? 'Submitting...' : 'Submit Rating'}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 