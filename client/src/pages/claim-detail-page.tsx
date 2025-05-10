import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClaimStatus, PostStatus } from "@shared/schema";
import { Loader2, ChevronLeft, MessageCircle, Star } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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

export default function ClaimDetailPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const claimId = location.split('/')[2];
  const [message, setMessage] = useState("");
  const [handoverCode, setHandoverCode] = useState("");
  
  // Fetch claim details
  const { data: claim, isLoading: claimLoading } = useQuery({
    queryKey: ["/api/claims", claimId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/claims/${claimId}`);
      return await res.json();
    },
  });
  
  // Fetch post details
  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["/api/posts", claim?.postId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/posts/${claim.postId}`);
      return await res.json();
    },
    enabled: !!claim?.postId,
  });
  
  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/claims", claimId, "messages"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/claims/${claimId}/messages`);
      return await res.json();
    },
    enabled: !!claimId,
  });
  
  // Fetch ratings
  const { data: ratings, isLoading: ratingsLoading } = useQuery({
    queryKey: ["/api/claims", claimId, "ratings"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/claims/${claimId}/ratings`);
      return await res.json();
    },
    enabled: !!claimId,
  });
  
  // Mutations
  
  // Update claim status
  const updateClaimMutation = useMutation({
    mutationFn: async ({ status }: { status: ClaimStatus }) => {
      const res = await apiRequest("PATCH", `/api/claims/${claimId}`, {
        status,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims", claimId] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", claim?.postId] });
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
  
  // Delete claim
  const deleteClaimMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/claims/${claimId}`);
    },
    onSuccess: () => {
      toast({
        title: "Claim deleted",
        description: "Your claim has been deleted successfully.",
      });
      navigate("/claims");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete claim",
        variant: "destructive",
      });
    },
  });
  
  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/claims/${claimId}/messages`, {
        content,
      });
      return await res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/claims", claimId, "messages"] });
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });
  
  // Generate handover code
  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/claims/${claimId}/handover-code`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Handover code generated",
        description: "Share this code with the claimer when you hand over the item.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate handover code",
        variant: "destructive",
      });
    },
  });
  
  // Verify handover code
  const verifyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", `/api/claims/${claimId}/verify-handover`, {
        code,
      });
      return await res.json();
    },
    onSuccess: () => {
      // Update claim to completed
      updateClaimMutation.mutate({ status: "completed" });
      setHandoverCode("");
      toast({
        title: "Handover verified",
        description: "The handover has been verified and the claim is now complete.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Invalid handover code",
        variant: "destructive",
      });
    },
  });
  
  // Submit rating
  const submitRatingMutation = useMutation({
    mutationFn: async ({ rating, comment, toUserId }: { rating: number; comment: string; toUserId: number }) => {
      if (!user) throw new Error("User not authenticated");
      
      // Create a payload that matches the expected schema on the server
      // Include all required fields with correct data types
      const payload = {
        claimId: Number(claimId),
        fromUserId: Number(user.id),
        toUserId: Number(toUserId),
        rating: Number(rating),
        comment: comment || "",
        categories: [] // Include empty categories array as it's in the schema
      };
      
      console.log('Submitting rating with payload:', payload);
      
      const res = await apiRequest("POST", `/api/claims/${claimId}/rate`, payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims", claimId, "ratings"] });
      toast({
        title: "Rating submitted",
        description: "Thank you for providing your feedback.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    },
  });
  
  if (claimLoading || (claim && postLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!claim) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Claim not found</h2>
          <p className="text-muted-foreground mb-6">
            The claim you're looking for does not exist or you don't have permission to view it.
          </p>
          <Button asChild>
            <Link href="/claims">Back to My Claims</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const isPostOwner = user?.id === post?.userId;
  const isClaimOwner = user?.id === claim.claimerId;
  const canCancel = isClaimOwner && claim.status === "pending";
  const canDelete = isClaimOwner && (claim.status === "pending" || claim.status === "rejected");
  const canApproveReject = isPostOwner && claim.status === "pending";
  const canComplete = (isPostOwner || isClaimOwner) && 
                     (claim.status === "approved" || claim.status === "in_progress");
  const canGenerateCode = isPostOwner && 
                         (claim.status === "approved" || claim.status === "in_progress");
  const canVerifyCode = isClaimOwner && 
                       (claim.status === "approved" || claim.status === "in_progress");
  const hasRated = ratings?.some(rating => rating.fromUserId === user?.id);
  const canRate = (isPostOwner || isClaimOwner) && 
                 claim.status === "completed" && 
                 !hasRated;
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/claims">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Claims
          </Link>
        </Button>
        
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Claim Details</h1>
          <Badge variant={getStatusBadgeVariant(claim.status as ClaimStatus)}>
            {getStatusText(claim.status as ClaimStatus)}
          </Badge>
        </div>
        
        {post && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Food Post Information</CardTitle>
                <CardDescription>
                  Details about the food item being claimed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Title</h3>
                    <p>{post.title}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p>{post.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium">Type</h3>
                      <p className="capitalize">{post.type}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Category</h3>
                      <p className="capitalize">{post.category.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Quantity</h3>
                      <p>{post.quantity}</p>
                    </div>
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p>Location on map</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/posts/${post.id}`}>View Full Post</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
        
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Claim Information</CardTitle>
              <CardDescription>
                Details about this claim request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Claim Note</h3>
                  <p>{claim.note || "No note provided"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Created At</h3>
                    <p>{format(new Date(claim.createdAt), 'PPP')}</p>
                  </div>
                  {claim.updatedAt && (
                    <div>
                      <h3 className="font-medium">Last Updated</h3>
                      <p>{format(new Date(claim.updatedAt), 'PPP pp')}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-2">
              <div className="flex space-x-2 w-full">
                {canApproveReject && (
                  <>
                    <Button 
                      className="flex-1"
                      onClick={() => updateClaimMutation.mutate({ status: "approved" })}
                      disabled={updateClaimMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button 
                      className="flex-1"
                      variant="destructive"
                      onClick={() => updateClaimMutation.mutate({ status: "rejected" })}
                      disabled={updateClaimMutation.isPending}
                    >
                      Reject
                    </Button>
                  </>
                )}
                
                {canCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="flex-1" variant="outline">Cancel Claim</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will cancel your claim request. You can submit a new request later if you change your mind.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Go back</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => updateClaimMutation.mutate({ status: "cancelled" })}
                        >
                          Yes, cancel my claim
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="flex-1" variant="destructive">Delete Claim</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your claim. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Go back</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteClaimMutation.mutate()}
                        >
                          Yes, delete claim
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              
              {(claim.status === "approved" || claim.status === "in_progress") && (
                <div className="flex space-x-2 w-full">
                  {canGenerateCode && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex-1" variant="outline">
                          Generate Handover Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Handover Code</DialogTitle>
                          <DialogDescription>
                            Share this code with the claimer when you hand over the item.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          {generateCodeMutation.isPending ? (
                            <div className="flex justify-center">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : generateCodeMutation.isSuccess ? (
                            <div className="text-center">
                              <div className="text-3xl font-bold tracking-wider mb-4">
                                {generateCodeMutation.data.code}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                This code will expire after use or in 24 hours.
                              </p>
                            </div>
                          ) : (
                            <p className="text-center">
                              Click the button below to generate a handover code.
                            </p>
                          )}
                        </div>
                        <DialogFooter>
                          {!generateCodeMutation.isSuccess && (
                            <Button
                              onClick={() => generateCodeMutation.mutate()}
                              disabled={generateCodeMutation.isPending}
                            >
                              Generate Code
                            </Button>
                          )}
                          <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {canVerifyCode && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="flex-1">
                          Verify Handover
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Verify Handover</DialogTitle>
                          <DialogDescription>
                            Enter the handover code provided by the post owner to confirm you've received the item.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="handoverCode">Handover Code</Label>
                              <Input
                                id="handoverCode"
                                value={handoverCode}
                                onChange={(e) => setHandoverCode(e.target.value)}
                                placeholder="Enter code"
                                className="text-center text-lg"
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => verifyCodeMutation.mutate(handoverCode)}
                            disabled={verifyCodeMutation.isPending || !handoverCode}
                          >
                            {verifyCodeMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              "Verify Code"
                            )}
                          </Button>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              )}
              
              {canComplete && (
                <Button 
                  className="w-full mt-2"
                  onClick={() => updateClaimMutation.mutate({ status: "completed" })}
                  disabled={updateClaimMutation.isPending}
                >
                  Mark as Completed
                </Button>
              )}
              
              {canRate && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-2" variant="outline">
                      <Star className="h-4 w-4 mr-2" />
                      Rate {isPostOwner ? "Claimer" : "Donor"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Submit Rating</DialogTitle>
                      <DialogDescription>
                        Rate your experience with the {isPostOwner ? "claimer" : "donor"}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <RatingForm onSubmit={({ rating, comment }) => {
                        if (!user) return;
                        let toUserId = user.id === post.userId ? claim.claimerId : post.userId;
                        console.log(`Submitting rating from user ${user.id} to user ${toUserId} for claim ${claimId}`);
                        submitRatingMutation.mutate({ rating, comment, toUserId });
                      }} />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardFooter>
          </Card>
        </div>
        
        {/* Messages Section */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Messages</CardTitle>
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardDescription>
                Communicate with the {isPostOwner ? "claimer" : "post owner"} about this claim
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {messagesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages?.length > 0 ? (
                  messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.senderId === user?.id
                          ? "bg-primary text-primary-foreground ml-8"
                          : "bg-muted mr-8"
                      }`}
                    >
                      <div className="text-sm opacity-70 mb-1">
                        {format(new Date(msg.createdAt), "PPp")}
                      </div>
                      <p>{msg.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full space-y-2">
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
                <Button
                  className="w-full"
                  onClick={() => sendMessageMutation.mutate(message)}
                  disabled={!message || sendMessageMutation.isPending}
                >
                  {sendMessageMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Ratings Section (if claim is completed) */}
        {claim.status === "completed" && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ratings & Feedback</CardTitle>
                  <Star className="h-5 w-5 text-yellow-400" />
                </div>
                <CardDescription>
                  See what others thought about this exchange
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ratingsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : ratings?.length > 0 ? (
                  <div className="space-y-4">
                    {ratings.map((rating: any) => (
                      <div key={rating.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="font-medium">
                              {rating.fromUserId === post?.userId ? "Post Owner's Rating" : "Claimer's Rating"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i: number) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < rating.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {rating.comment && <p className="text-sm">{rating.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No ratings yet.
                  </div>
                )}
              </CardContent>
              {canRate && (
                <CardFooter>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        <Star className="h-4 w-4 mr-2" />
                        Rate {isPostOwner ? "Claimer" : "Donor"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Submit Rating</DialogTitle>
                        <DialogDescription>
                          Rate your experience with the {isPostOwner ? "claimer" : "donor"}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <RatingForm onSubmit={({ rating, comment }) => {
                          if (!user) return;
                          let toUserId = user.id === post.userId ? claim.claimerId : post.userId;
                          submitRatingMutation.mutate({ rating, comment, toUserId });
                        }} />
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

interface RatingFormProps {
  onSubmit: (data: { rating: number; comment: string }) => void;
}

function RatingForm({ onSubmit }: RatingFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rating">Rating</Label>
        <div className="flex items-center justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-8 w-8 cursor-pointer ${
                i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
              onClick={() => setRating(i + 1)}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="comment">Comment (optional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          className="min-h-[120px]"
        />
      </div>
      <Button
        onClick={() => onSubmit({ rating, comment })}
        className="w-full"
      >
        Submit Rating
      </Button>
    </div>
  );
}