import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sprout, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./mobile-menu";
import { useAuth } from "@/hooks/use-auth";
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-soft sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="FoodShare Home">
          <div className="text-[#4CAF50] dark:text-[#6FCF7C] text-3xl transition-colors duration-300">
            <Sprout className="h-8 w-8" />
          </div>
          <span className="font-montserrat font-bold text-xl text-[#424242] dark:text-white transition-colors duration-300">FoodShare</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden sm:flex space-x-6 items-center">
          <Link 
            href="/" 
            className={`text-base ${location === '/' ? 'text-[#4CAF50] dark:text-[#6FCF7C] font-semibold' : 'text-[#424242] dark:text-gray-300'} hover:text-[#4CAF50] dark:hover:text-[#6FCF7C] transition-colors`}
          >
            Home
          </Link>
          <Link 
            href="/feed" 
            className={`text-base ${location === '/feed' ? 'text-[#4CAF50] dark:text-[#6FCF7C] font-semibold' : 'text-[#424242] dark:text-gray-300'} hover:text-[#4CAF50] dark:hover:text-[#6FCF7C] transition-colors`}
          >
            Feed
          </Link>
          <Link 
            href="/activity" 
            className={`text-base ${location === '/activity' ? 'text-[#4CAF50] dark:text-[#6FCF7C] font-semibold' : 'text-[#424242] dark:text-gray-300'} hover:text-[#4CAF50] dark:hover:text-[#6FCF7C] transition-colors`}
          >
            My Activity
          </Link>
          
          <div className="ml-2 flex items-center">
            <ThemeToggle />
          </div>
          
          {user ? (
            <div className="flex space-x-3 items-center">
              {/* Add notifications dropdown */}
              <NotificationsDropdown />
              
              <Button 
                variant="outline" 
                className="px-4 py-2 text-[#4CAF50] dark:text-[#6FCF7C] border border-[#4CAF50] dark:border-[#6FCF7C] rounded-soft hover:bg-[#4CAF50] dark:hover:bg-[#6FCF7C] hover:text-white transition-colors"
                asChild
              >
                <Link href="/profile">
                  Profile
                </Link>
              </Button>
              <Button 
                className="px-4 py-2 bg-[#4CAF50] dark:bg-[#388E3C] text-white rounded-soft hover:bg-[#388E3C] dark:hover:bg-[#4CAF50] transition-colors"
                onClick={() => logoutMutation.mutate()}
              >
                Log Out
              </Button>
            </div>
          ) : (
            <div className="flex space-x-3 items-center">
              <Button 
                variant="outline" 
                className="px-4 py-2 text-[#4CAF50] dark:text-[#6FCF7C] border border-[#4CAF50] dark:border-[#6FCF7C] rounded-soft hover:bg-[#4CAF50] dark:hover:bg-[#6FCF7C] hover:text-white transition-colors"
                asChild
              >
                <Link href="/auth?tab=login">
                  Log In
                </Link>
              </Button>
              <Button 
                className="px-4 py-2 bg-[#4CAF50] dark:bg-[#388E3C] text-white rounded-soft hover:bg-[#388E3C] dark:hover:bg-[#4CAF50] transition-colors"
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
          className="sm:hidden text-[#424242] dark:text-white text-2xl p-2 transition-colors duration-300" 
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
