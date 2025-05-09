import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProfileForm } from "@/components/profile/profile-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("profile-info");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#4CAF50]" />
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
                  <ProfileStats />
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
                      <div className="p-4 bg-[#F5F5F5] rounded-soft text-center">
                        <p className="text-[#424242]">Your donation and request history will appear here.</p>
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
