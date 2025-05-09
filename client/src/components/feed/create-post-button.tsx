import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, X, Gift, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CreatePostButton() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleClick = () => {
    if (!user) {
      setShowAuthDialog(true);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <>
      <div className="fixed right-6 bottom-6 z-40 flex flex-col-reverse items-end space-y-reverse space-y-2">
        {isExpanded && (
          <>
            <Button
              className="rounded-full bg-[#4CAF50] text-white shadow-medium w-auto px-4 py-2 h-auto flex items-center"
              onClick={() => setIsExpanded(false)}
              asChild
            >
              <Link href="/posts/new?type=donation">
                <Gift className="mr-2 h-4 w-4" />
                Donate Food
              </Link>
            </Button>
            
            <Button
              className="rounded-full bg-[#42A5F5] text-white shadow-medium w-auto px-4 py-2 h-auto flex items-center"
              onClick={() => setIsExpanded(false)}
              asChild
            >
              <Link href="/posts/new?type=request">
                <Search className="mr-2 h-4 w-4" />
                Request Food
              </Link>
            </Button>
          </>
        )}
        
        <Button
          className={`rounded-full shadow-medium w-14 h-14 transition-all duration-300 ${
            isExpanded 
              ? "bg-[#FF9800] hover:bg-[#F57C00]" 
              : "bg-[#4CAF50] hover:bg-[#388E3C]"
          }`}
          onClick={handleClick}
        >
          {isExpanded ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </div>

      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign in required</AlertDialogTitle>
            <AlertDialogDescription>
              You need to be signed in to create a food post. Would you like to sign in or create an account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link href="/auth">
                <Button className="bg-[#4CAF50] text-white hover:bg-[#388E3C]">
                  Sign In / Register
                </Button>
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}