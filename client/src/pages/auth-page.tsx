import { useEffect, useState } from "react";
import { useLocation, useSearch, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";

export default function AuthPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signup" || tab === "login") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Redirect to home if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <>
      <Helmet>
        <title>Login or Register | FoodShare</title>
        <meta 
          name="description" 
          content="Join the FoodShare community to start sharing food, reducing waste, and building meaningful connections with your neighbors."
        />
      </Helmet>
    
      <div className="min-h-screen py-12 bg-[#F5F5F5]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto bg-white rounded-soft shadow-medium overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Left side: Form */}
              <div className="w-full md:w-1/2 p-6 md:p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="login" className="font-montserrat font-semibold">Log In</TabsTrigger>
                    <TabsTrigger value="signup" className="font-montserrat font-semibold">Sign Up</TabsTrigger>
                  </TabsList>
                  <TabsContent value="login">
                    <LoginForm />
                  </TabsContent>
                  <TabsContent value="signup">
                    <RegisterForm />
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Right side: Hero Image & Info */}
              <div 
                className="w-full md:w-1/2 bg-[#4CAF50] p-8 md:p-12 text-white flex flex-col justify-center"
                style={{
                  backgroundImage: 'linear-gradient(rgba(76, 175, 80, 0.85), rgba(56, 142, 60, 0.95)), url(https://images.unsplash.com/photo-1544378382-5e394490fb8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <h1 className="font-montserrat font-bold text-3xl md:text-4xl mb-6">
                  Join our food-sharing community
                </h1>
                <p className="font-opensans text-lg mb-8">
                  Connect with neighbors, share surplus food, and help build a more sustainable, connected community.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-white/20 p-2 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-gift">
                        <polyline points="20 12 20 22 4 22 4 12"></polyline>
                        <rect x="2" y="7" width="20" height="5"></rect>
                        <line x1="12" y1="22" x2="12" y2="7"></line>
                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-montserrat font-semibold text-xl">Share Food</h3>
                      <p className="font-opensans">Reduce waste by sharing your excess food with neighbors in need.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-white/20 p-2 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-users">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-montserrat font-semibold text-xl">Connect</h3>
                      <p className="font-opensans">Build relationships with people in your community who share your values.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-white/20 p-2 rounded-full mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-shield">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-montserrat font-semibold text-xl">Safe & Secure</h3>
                      <p className="font-opensans">Our community guidelines and rating system ensure a positive experience.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
