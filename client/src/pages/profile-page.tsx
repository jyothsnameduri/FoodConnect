import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileForm } from "@/components/profile/profile-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("profile-info");

  // Fetch user profile data
  const { data: profile, isLoading: profileLoading, error } = useQuery({
    queryKey: ["/api/users", user?.id, "profile"],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await apiRequest("GET", `/api/users/${user.id}/profile`);
      return await res.json();
    },
    enabled: !!user?.id,
  });

  if (isLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#4CAF50]" />
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Failed to load profile.
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Profile | FoodShare</title>
        <meta 
          name="description" 
          content="Manage your FoodShare profile, track your food sharing statistics, and update your account information."
        />
      </Helmet>
    
      <div className="bg-[#F5F5F5] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto bg-white rounded-soft shadow-medium overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-montserrat font-bold text-2xl text-[#424242]">My Profile</h2>
              </div>
              
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  <ProfileStats profile={profile} />
                </div>
                
                <div className="md:w-2/3">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="border-b border-[#E0E0E0] mb-6">
                      <TabsTrigger 
                        value="profile-info" 
                        className="px-4 py-2 text-[#4CAF50] font-montserrat font-semibold"
                      >
                        Profile Info
                      </TabsTrigger>
                      <TabsTrigger 
                        value="preferences" 
                        className="px-4 py-2 text-[#9E9E9E] font-montserrat hover:text-[#424242]"
                      >
                        Preferences
                      </TabsTrigger>
                      <TabsTrigger 
                        value="history" 
                        className="px-4 py-2 text-[#9E9E9E] font-montserrat hover:text-[#424242]"
                      >
                        History
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="profile-info">
                      <ProfileForm />
                    </TabsContent>
                    
                    <TabsContent value="preferences">
                      <div className="p-4 bg-[#F5F5F5] rounded-soft text-center">
                        <p className="text-[#424242]">Notification and account preferences will be available soon.</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="history">
                      <div className="p-4 bg-[#F5F5F5] rounded-soft">
                        <h3 className="font-semibold mb-2 text-[#424242]">Recent Donations Made</h3>
                        <ul className="mb-4">
                          {profile.recentDonations.length === 0 ? (
                            <li className="text-gray-400">No donations yet.</li>
                          ) : profile.recentDonations.map((d: any) => (
                            <li key={d.id} className="mb-2 text-[#388E3C]">{d.title} <span className="text-xs text-gray-400">({new Date(d.createdAt).toLocaleDateString()})</span></li>
                          ))}
                        </ul>
                        <h3 className="font-semibold mb-2 text-[#424242]">Recent Donations Received</h3>
                        <ul>
                          {profile.recentReceived.length === 0 ? (
                            <li className="text-gray-400">No pickups yet.</li>
                          ) : profile.recentReceived.map((c: any) => (
                            <li key={c.id} className="mb-2 text-[#42A5F5]">{c.postId ? `Claim for post #${c.postId}` : `Claim #${c.id}`} <span className="text-xs text-gray-400">({new Date(c.createdAt).toLocaleDateString()})</span></li>
                          ))}
                        </ul>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
