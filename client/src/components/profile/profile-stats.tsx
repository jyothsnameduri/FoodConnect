import { Button } from "@/components/ui/button";
import { Check, MapPin, Star } from "lucide-react";

interface ProfileStatsProps {
  profile: {
    profileImage?: string;
    firstName?: string;
    lastName?: string;
    username: string;
    averageRating?: number;
    ratingCount: number;
    zipCode?: string;
    isTrusted?: boolean;
    donationCount: number;
    receivedCount: number;
  };
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  return (
    <div className="bg-[#F5F5F5] p-4 rounded-soft shadow-soft">
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
          <img 
            src={profile.profileImage || "/default-avatar.png"} 
            alt={`${profile.firstName || profile.username} profile`} 
            className="w-full h-full object-cover" 
          />
        </div>
        <Button 
          variant="link" 
          className="text-[#4CAF50] text-sm p-0 h-auto hover:no-underline hover:text-[#388E3C]"
        >
          Change photo
        </Button>
        <h3 className="font-montserrat font-semibold text-xl mt-4">{profile.firstName || profile.username} {profile.lastName}</h3>
        <div className="flex items-center mt-1">
          <Star className="text-[#FFC107] w-4 h-4 mr-1 fill-current" />
          <span className="text-[#9E9E9E]">{profile.averageRating?.toFixed(2) || "-"} ({profile.ratingCount} ratings)</span>
        </div>
        {/* Optionally show location if available */}
        {profile.zipCode && (
          <div className="flex items-center mt-2">
            <MapPin className="text-[#FF9800] w-4 h-4 mr-1" />
            <span className="text-[#9E9E9E]">{profile.zipCode}</span>
          </div>
        )}
        {profile.isTrusted && (
          <div className="bg-[#FFC107]/20 text-[#FFA000] px-3 py-1 rounded-full text-xs font-montserrat font-semibold mt-3 flex items-center">
            <Check className="w-3 h-3 mr-1" /> Trusted User
          </div>
        )}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-montserrat font-bold text-[#4CAF50]">{profile.donationCount}</div>
          <p className="text-sm text-[#9E9E9E]">Donations</p>
        </div>
        <div>
          <div className="text-2xl font-montserrat font-bold text-[#42A5F5]">{profile.receivedCount}</div>
          <p className="text-sm text-[#9E9E9E]">Received</p>
        </div>
      </div>
    </div>
  );
}
