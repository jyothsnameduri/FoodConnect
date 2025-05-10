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
    <div className="bg-[#F5F5F5] dark:bg-gray-800 p-4 rounded-soft shadow-soft transition-colors duration-300">
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 rounded-full overflow-hidden mb-4 bg-gray-200 dark:bg-gray-700 flex items-center justify-center transition-colors duration-300">
          {profile.profileImage ? (
            <img 
              src={profile.profileImage} 
              alt={`${profile.firstName || profile.username} profile`} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="text-3xl font-bold text-gray-400 dark:text-gray-500 transition-colors duration-300">
              {(profile.firstName?.[0] || profile.username?.[0] || '').toUpperCase()}
            </div>
          )}
        </div>
        <h3 className="font-montserrat font-semibold text-xl mt-4 dark:text-white transition-colors duration-300">{profile.firstName || profile.username} {profile.lastName}</h3>
        <div className="flex items-center mt-1">
          <Star className="text-[#FFC107] w-4 h-4 mr-1 fill-current" />
          <span className="text-[#9E9E9E] dark:text-gray-400 transition-colors duration-300">{profile.averageRating?.toFixed(2) || "-"} ({profile.ratingCount} ratings)</span>
        </div>
        {/* Optionally show location if available */}
        {profile.zipCode && (
          <div className="flex items-center mt-2">
            <MapPin className="text-[#FF9800] dark:text-[#FFB74D] w-4 h-4 mr-1 transition-colors duration-300" />
            <span className="text-[#9E9E9E] dark:text-gray-400 transition-colors duration-300">{profile.zipCode}</span>
          </div>
        )}
        {profile.isTrusted && (
          <div className="bg-[#FFC107]/20 dark:bg-[#FFC107]/10 text-[#FFA000] dark:text-[#FFD54F] px-3 py-1 rounded-full text-xs font-montserrat font-semibold mt-3 flex items-center transition-colors duration-300">
            <Check className="w-3 h-3 mr-1" /> Trusted User
          </div>
        )}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="text-2xl font-montserrat font-bold text-[#4CAF50] dark:text-[#6FCF7C] transition-colors duration-300">{profile.donationCount}</div>
          <p className="text-sm text-[#9E9E9E] dark:text-gray-400 transition-colors duration-300">Donations</p>
        </div>
        <div>
          <div className="text-2xl font-montserrat font-bold text-[#42A5F5] dark:text-[#60a5fa] transition-colors duration-300">{profile.receivedCount}</div>
          <p className="text-sm text-[#9E9E9E] dark:text-gray-400 transition-colors duration-300">Received</p>
        </div>
      </div>
    </div>
  );
}
