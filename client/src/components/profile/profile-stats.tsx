import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Check, MapPin, Star } from "lucide-react";

export function ProfileStats() {
  const { user } = useAuth();
  
  // In a real application, these values would come from user.metadata or a profile API
  const userStats = {
    name: "Sarah Johnson",
    rating: 4.9,
    ratingCount: 24,
    location: "Oakland, CA",
    isTrusted: true,
    donations: 18,
    received: 7,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80"
  };
  
  return (
    <div className="bg-[#F5F5F5] p-4 rounded-soft shadow-soft">
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
          <img 
            src={userStats.avatar} 
            alt={`${userStats.name} profile`} 
            className="w-full h-full object-cover" 
          />
        </div>
        <Button 
          variant="link" 
          className="text-[#4CAF50] text-sm p-0 h-auto hover:no-underline hover:text-[#388E3C]"
        >
          Change photo
        </Button>
        <h3 className="font-montserrat font-semibold text-xl mt-4">{userStats.name}</h3>
        <div className="flex items-center mt-1">
          <Star className="text-[#FFC107] w-4 h-4 mr-1 fill-current" />
          <span className="text-[#9E9E9E]">{userStats.rating} ({userStats.ratingCount} ratings)</span>
        </div>
        <div className="flex items-center mt-2">
          <MapPin className="text-[#FF9800] w-4 h-4 mr-1" />
          <span className="text-[#9E9E9E]">{userStats.location}</span>
        </div>
        {userStats.isTrusted && (
          <div className="bg-[#FFC107]/20 text-[#FFA000] px-3 py-1 rounded-full text-xs font-montserrat font-semibold mt-3 flex items-center">
            <Check className="w-3 h-3 mr-1" /> Trusted User
          </div>
        )}
      </div>
      
      <div className="mt-6 grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-montserrat font-bold text-[#4CAF50]">{userStats.donations}</div>
          <p className="text-sm text-[#9E9E9E]">Donations</p>
        </div>
        <div>
          <div className="text-2xl font-montserrat font-bold text-[#42A5F5]">{userStats.received}</div>
          <p className="text-sm text-[#9E9E9E]">Received</p>
        </div>
      </div>
    </div>
  );
}
