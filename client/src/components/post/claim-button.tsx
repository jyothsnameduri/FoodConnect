import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { FoodPost } from "@shared/schema";

interface ClaimButtonProps {
  post: FoodPost;
}

export function ClaimButton({ post }: ClaimButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  // Check if user already has a pending claim for this post
  const { data: existingClaims, isLoading: claimsLoading } = useQuery({
    queryKey: ["/api/claims", { postId: post.id }],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/claims?postId=${post.id}`);
        return await res.json();
      } catch (error) {
        return [];
      }
    },
    enabled: !!user,
  });

  const hasExistingClaim = !!existingClaims?.some(
    (claim: any) => claim.claimerId === user?.id
  );

  const claimMutation = useMutation({
    mutationFn: async (note: string) => {
      const res = await apiRequest("POST", `/api/posts/${post.id}/claim`, {
        note,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Claim submitted",
        description: "Your claim has been sent to the owner for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      setOpen(false);
      navigate(`/claims/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit claim",
        variant: "destructive",
      });
    },
  });

  // Don't show claim button if the post belongs to the current user
  if (user?.id === post.userId) {
    return null;
  }

  // Don't show claim button if the post isn't available
  if (post.status !== "available") {
    return (
      <Button disabled className="w-full">
        Not Available
      </Button>
    );
  }

  // Show navigate to existing claim if user already has one
  if (hasExistingClaim) {
    const existingClaim = existingClaims.find(
      (claim: any) => claim.claimerId === user?.id
    );
    return (
      <Button
        className="w-full"
        onClick={() => navigate(`/claims/${existingClaim.id}`)}
      >
        View Your Claim
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Claim this item</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Claim this item</DialogTitle>
          <DialogDescription>
            Send a request to the owner to claim this food item. You can add a
            note explaining why you'd like to claim it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="claim-note">Note (optional)</Label>
            <Textarea
              id="claim-note"
              placeholder="Add a note for the owner..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={() => claimMutation.mutate(note)}
            disabled={claimMutation.isPending}
          >
            {claimMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Claim"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}