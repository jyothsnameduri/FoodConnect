import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  if (!isOpen) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };

  return (
    <div className="sm:hidden fixed inset-0 z-40 mt-[68px]">
      <div className="bg-black/50 h-full" onClick={onClose}></div>
      <div className="absolute top-0 right-0 w-4/5 h-screen bg-white shadow-medium overflow-y-auto">
        <div className="p-4 flex flex-col space-y-4">
          <Link 
            href="/" 
            className={`px-4 py-3 rounded-soft hover:bg-[#F5F5F5] ${location === '/' ? 'text-[#4CAF50]' : 'text-[#424242]'} font-opensans`}
            onClick={onClose}
          >
            Home
          </Link>
          <Link 
            href="/map" 
            className={`px-4 py-3 rounded-soft hover:bg-[#F5F5F5] ${location === '/map' ? 'text-[#4CAF50]' : 'text-[#424242]'} font-opensans`}
            onClick={onClose}
          >
            Map
          </Link>
          <Link 
            href="/activity" 
            className={`px-4 py-3 rounded-soft hover:bg-[#F5F5F5] ${location === '/activity' ? 'text-[#4CAF50]' : 'text-[#424242]'} font-opensans`}
            onClick={onClose}
          >
            My Activity
          </Link>
          <div className="border-t border-[#E0E0E0] my-2"></div>
          
          {user ? (
            <>
              <Link 
                href="/profile" 
                className="px-4 py-3 text-center text-[#4CAF50] border border-[#4CAF50] rounded-soft hover:bg-[#4CAF50] hover:text-white transition-colors"
                onClick={onClose}
              >
                Profile
              </Link>
              <Button 
                className="px-4 py-3 text-center bg-[#4CAF50] text-white rounded-soft hover:bg-[#388E3C] transition-colors"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Link 
                href="/auth?tab=login" 
                className="px-4 py-3 text-center text-[#4CAF50] border border-[#4CAF50] rounded-soft hover:bg-[#4CAF50] hover:text-white transition-colors"
                onClick={onClose}
              >
                Log In
              </Link>
              <Link 
                href="/auth?tab=signup" 
                className="px-4 py-3 text-center bg-[#4CAF50] text-white rounded-soft hover:bg-[#388E3C] transition-colors"
                onClick={onClose}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
