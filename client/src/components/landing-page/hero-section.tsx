import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function HeroSection() {
  const { user } = useAuth();
  
  return (
    <section className="relative bg-gradient-to-r from-[#81C784]/10 to-[#4CAF50]/10 dark:from-[#1e293b] dark:to-[#0f172a] py-10 md:py-16 transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div className="md:w-1/2 space-y-6">
            <h1 className="font-montserrat font-bold text-3xl md:text-5xl text-[#424242] dark:text-white leading-tight transition-colors duration-300">
              Share Food, <span className="text-[#4CAF50] dark:text-[#7bed9f] transition-colors duration-300">Build Community</span>
            </h1>
            <p className="font-opensans text-base md:text-lg text-[#424242] dark:text-gray-300 max-w-lg transition-colors duration-300">
              Connect with neighbors to share surplus food, reduce waste, and strengthen your local community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                className="px-6 py-6 bg-[#4CAF50] hover:bg-[#388E3C] dark:bg-[#388E3C] dark:hover:bg-[#4CAF50] text-white rounded-soft font-montserrat font-semibold shadow-soft dark:shadow-md transition-colors duration-300"
                asChild
              >
                <Link href={user ? "/donate" : "/auth"}>
                  Donate Food
                </Link>
              </Button>
              <Button 
                className="px-6 py-6 bg-[#42A5F5] hover:bg-[#1976D2] dark:bg-[#1976D2] dark:hover:bg-[#42A5F5] text-white rounded-soft font-montserrat font-semibold shadow-soft dark:shadow-md transition-colors duration-300"
                asChild
              >
                <Link href={user ? "/find" : "/auth"}>
                  Find Food
                </Link>
              </Button>
            </div>
            <div className="pt-4 flex items-center text-[#9E9E9E] dark:text-gray-400 transition-colors duration-300">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5 mr-2"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="font-montserrat font-semibold">
                4,782 neighbors sharing in your area
              </span>
            </div>
          </div>
          
          <div className="md:w-1/2 rounded-soft overflow-hidden shadow-medium">
            <img 
              src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
              alt="Community members sharing food together" 
              className="w-full h-auto object-cover rounded-soft" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
