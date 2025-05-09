import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ClaimStatus } from "@shared/schema";
import { Loader2, AlertCircle } from "lucide-react";

// Function to get badge variant based on status
function getStatusBadgeVariant(status: ClaimStatus) {
  switch (status) {
    case "pending":
      return "outline";
    case "approved":
      return "secondary";
    case "rejected":
      return "destructive";
    case "cancelled":
      return "outline";
    case "completed":
      return "default";
    default:
      return "outline";
  }
}

// Function to get human-readable status
function getStatusText(status: ClaimStatus) {
  switch (status) {
    case "pending":
      return "Pending Approval";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    default:
      return status;
  }
}

export default function ClaimsPage() {
  const { user } = useAuth();
  
  // Fetch user's claims
  const { data: myClaims, isLoading: myClaimsLoading } = useQuery({
    queryKey: ["/api/claims"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/claims");
      return await res.json();
    },
    enabled: !!user,
  });
  
  // Fetch claims for user's posts
  const { data: postClaims, isLoading: postClaimsLoading } = useQuery({
    queryKey: ["/api/posts/claims"],
    queryFn: async () => {
      // This would ideally be a specific endpoint, but we'll aggregate claims for all user's posts
      const res = await apiRequest("GET", "/api/posts?userId=" + user?.id);
      const posts = await res.json();
      
      // For each post, fetch the claims
      const allClaims = await Promise.all(
        posts.map(async (post: any) => {
          try {
            const res = await apiRequest("GET", `/api/posts/${post.id}/claims`);
            const claims = await res.json();
            return claims.map((claim: any) => ({
              ...claim,
              post: {
                id: post.id,
                title: post.title,
                type: post.type,
              },
            }));
          } catch (error) {
            return [];
          }
        })
      );
      
      return allClaims.flat();
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to view your claims.
          </p>
          <Button asChild>
            <Link href="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const isLoading = myClaimsLoading || postClaimsLoading;
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">My Claims</h1>
      
      <Tabs defaultValue="my-claims" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="my-claims">Items I've Claimed</TabsTrigger>
          <TabsTrigger value="post-claims">Claims on My Posts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-claims">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : myClaims?.length > 0 ? (
            <div className="space-y-4">
              {myClaims.map((claim: any) => (
                <ClaimCard 
                  key={claim.id} 
                  claim={claim} 
                  type="my-claim"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <h3 className="text-xl font-medium mb-2">No Claims Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't claimed any items yet. Browse the available items and make a claim!
              </p>
              <Button asChild>
                <Link href="/feed">Browse Food Posts</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="post-claims">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : postClaims?.length > 0 ? (
            <div className="space-y-4">
              {postClaims.map((claim: any) => (
                <ClaimCard 
                  key={claim.id} 
                  claim={claim} 
                  type="post-claim"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <h3 className="text-xl font-medium mb-2">No Claims on Your Posts</h3>
              <p className="text-muted-foreground mb-6">
                No one has claimed any of your posted items yet.
              </p>
              <Button asChild>
                <Link href="/create">Create New Post</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ClaimCardProps {
  claim: any;
  type: 'my-claim' | 'post-claim';
}

function ClaimCard({ claim, type }: ClaimCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Mutation to update claim status
  const updateClaimMutation = useMutation({
    mutationFn: async ({ status }: { status: ClaimStatus }) => {
      const res = await apiRequest("PATCH", `/api/claims/${claim.id}`, {
        status,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/claims"] });
      toast({
        title: "Claim updated",
        description: "The claim status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update claim",
        variant: "destructive",
      });
    },
  });
  
  // Handle approve claim
  const handleApprove = () => {
    updateClaimMutation.mutate({ status: "approved" });
  };
  
  // Handle reject claim
  const handleReject = () => {
    updateClaimMutation.mutate({ status: "rejected" });
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle>
            {type === 'my-claim' ? 'Claim for ' : 'Claim by '}
            <span className="font-normal">
              {claim.post?.title || 'Loading...'}
            </span>
          </CardTitle>
          <Badge variant={getStatusBadgeVariant(claim.status as ClaimStatus)}>
            {getStatusText(claim.status as ClaimStatus)}
          </Badge>
        </div>
        <CardDescription>
          {type === 'my-claim' 
            ? 'Your request to claim this item' 
            : `A user wants to claim your ${claim.post?.type === 'donation' ? 'donation' : 'requested item'}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">Note:</p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {claim.message || "No note provided"}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Created on {format(new Date(claim.createdAt), 'PPp')}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {/* Show approval buttons for post owners with pending claims */}
        {type === 'post-claim' && claim.status === 'pending' && (
          <div className="flex w-full space-x-2 mb-2">
            <Button 
              variant="default" 
              className="flex-1" 
              onClick={handleApprove}
              disabled={updateClaimMutation.isPending}
            >
              {updateClaimMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Approve
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleReject}
              disabled={updateClaimMutation.isPending}
            >
              Reject
            </Button>
          </div>
        )}
        
        <Button asChild className="w-full">
          <Link href={`/claims/${claim.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}