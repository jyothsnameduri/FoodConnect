import { useState } from "react";
import { Helmet } from "react-helmet";
import { FeedView } from "@/components/feed/feed-view";
import { MapView } from "@/components/feed/map-view";
import { CreatePostButton } from "@/components/feed/create-post-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterPanel } from "@/components/feed/filter-panel";
import { Link } from "wouter";

// We'll handle the react-helmet types by ignoring them for now
// In a production app, you'd install @types/react-helmet

export default function FeedPage() {
  const [activeView, setActiveView] = useState<"feed" | "map">("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filterType, setFilterType] = useState<"all" | "donations" | "requests">("all");
  
  // State for all filter values
  const [activeFilters, setActiveFilters] = useState({
    distance: 5,
    categories: [] as string[],
    dietary: [] as string[],
    expiryWithin: 7,
    type: 'all' as 'all' | 'donation' | 'request'
  });
  
  // Function to update filters safely with type checking
  const updateFilters = (filters: {
    distance: number;
    categories: string[];
    dietary: string[];
    expiryWithin?: number;
    type?: 'all' | 'donation' | 'request';
  }) => {
    setActiveFilters({
      ...activeFilters,
      distance: filters.distance,
      categories: filters.categories,
      dietary: filters.dietary,
      expiryWithin: filters.expiryWithin ?? activeFilters.expiryWithin,
      type: filters.type ?? activeFilters.type
    });
  };
  
  // State for filtered posts
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
    // Here you would trigger the actual search
  };

  return (
    <>
      <Helmet>
        <title>Find Food | FoodShare</title>
        <meta 
          name="description" 
          content="Browse available food donations and requests in your area. Connect with neighbors and reduce food waste."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="font-montserrat font-bold text-2xl md:text-3xl text-[#424242]">
            Find Food
          </h1>

          <div className="flex w-full md:w-auto">
            <form onSubmit={handleSearch} className="relative flex w-full md:w-auto">
              <Input
                type="text"
                placeholder="Search for food items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 w-full md:w-64 lg:w-80 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]"
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-[#9E9E9E] hover:text-[#4CAF50]"
              >
                <Search className="h-5 w-5" />
              </Button>
            </form>

            <Button
              variant="outline"
              className="ml-2 border border-[#E0E0E0] text-[#424242] hover:bg-[#F5F5F5]"
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </div>
        </div>

        {showFilters && 
          <FilterPanel 
            onClose={() => setShowFilters(false)} 
            onApplyFilters={(filters) => {
              // Use our type-safe update function
              updateFilters(filters);
              
              // Here you would fetch filtered posts from the API
              console.log("Fetching posts with filters:", filters);
              
              // Example of how to fetch filtered posts
              const queryParams = new URLSearchParams();
              
              if (filters.type && filters.type !== 'all') {
                queryParams.set('type', filters.type);
              }
              
              if (filters.distance) {
                queryParams.set('distance', filters.distance.toString());
              }
              
              if (filters.categories.length > 0) {
                queryParams.set('categories', filters.categories.join(','));
              }
              
              if (filters.dietary.length > 0) {
                queryParams.set('dietary', filters.dietary.join(','));
              }
              
              if (filters.expiryWithin) {
                queryParams.set('expiryWithin', filters.expiryWithin.toString());
              }
              
              // Build the API URL with query parameters
              const apiUrl = `/api/posts?${queryParams.toString()}`;
              console.log("Fetching from URL:", apiUrl);
              
              // Fetch the filtered posts
              fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                  console.log("Filtered posts received:", data);
                  setFilteredPosts(data);
                })
                .catch(error => {
                  console.error("Error fetching filtered posts:", error);
                });
            }}
          />}

        <Tabs 
          value={activeView}
          onValueChange={(value) => setActiveView(value as "feed" | "map")}
          className="w-full mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger 
                value="feed"
                className="font-montserrat font-semibold"
              >
                List View
              </TabsTrigger>
              <TabsTrigger 
                value="map"
                className="font-montserrat font-semibold"
              >
                Map View
              </TabsTrigger>
            </TabsList>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="border border-[#E0E0E0] text-[#4CAF50] font-montserrat font-semibold"
              >
                Filter: All
              </Button>
              <Button
                variant="outline"
                className="border border-[#E0E0E0] text-[#4CAF50] bg-[#4CAF50]/10 font-montserrat font-semibold"
              >
                Donations
              </Button>
              <Button
                variant="outline"
                className="border border-[#E0E0E0] text-[#42A5F5] font-montserrat font-semibold"
              >
                Requests
              </Button>
            </div>
          </div>

          <TabsContent value="feed" className="mt-0">
            <FeedView />
          </TabsContent>

          <TabsContent value="map" className="mt-0">
            <MapView />
          </TabsContent>
        </Tabs>
      </div>

      <CreatePostButton />
    </>
  );
}