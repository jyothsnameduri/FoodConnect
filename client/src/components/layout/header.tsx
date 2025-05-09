import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sprout, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <header className="bg-white shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="FoodShare Home">
          <div className="text-[#4CAF50] text-3xl">
            <Sprout className="h-8 w-8" />
          </div>
          <span className="font-montserrat font-bold text-xl text-[#424242]">FoodShare</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center space-x-6">
          <Link 
            href="/" 
            className={`font-opensans ${location === '/' ? 'text-[#4CAF50]' : 'text-[#424242] hover:text-[#4CAF50]'} transition-colors`}
          >
            Home
          </Link>
          <Link 
            href="/feed" 
            className={`font-opensans ${location === '/feed' ? 'text-[#4CAF50]' : 'text-[#424242] hover:text-[#4CAF50]'} transition-colors`}
          >
            Feed
          </Link>
          <Link 
            href="/map" 
            className={`font-opensans ${location === '/map' ? 'text-[#4CAF50]' : 'text-[#424242] hover:text-[#4CAF50]'} transition-colors`}
          >
            Map
          </Link>
          <Link 
            href="/activity" 
            className={`font-opensans ${location === '/activity' ? 'text-[#4CAF50]' : 'text-[#424242] hover:text-[#4CAF50]'} transition-colors`}
          >
            My Activity
          </Link>
          
          {user ? (
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="px-4 py-2 text-[#4CAF50] border border-[#4CAF50] rounded-soft hover:bg-[#4CAF50] hover:text-white transition-colors"
                asChild
              >
                <Link href="/profile">
                  Profile
                </Link>
              </Button>
              <Button 
                className="px-4 py-2 bg-[#4CAF50] text-white rounded-soft hover:bg-[#388E3C] transition-colors"
                onClick={() => logoutMutation.mutate()}
              >
                Log Out
              </Button>
            </div>
          ) : (
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="px-4 py-2 text-[#4CAF50] border border-[#4CAF50] rounded-soft hover:bg-[#4CAF50] hover:text-white transition-colors"
                asChild
              >
                <Link href="/auth?tab=login">
                  Log In
                </Link>
              </Button>
              <Button 
                className="px-4 py-2 bg-[#4CAF50] text-white rounded-soft hover:bg-[#388E3C] transition-colors"
                asChild
              >
                <Link href="/auth?tab=signup">
                  Sign Up
                </Link>
              </Button>
            </div>
          )}
        </nav>
        
        {/* Mobile Menu Button */}
        <button 
          onClick={toggleMobileMenu}
          className="sm:hidden text-[#424242] text-2xl p-2" 
          aria-label="Toggle menu"
        >
          {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Mobile Navigation */}
      <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} />
    </header>
  );
}
