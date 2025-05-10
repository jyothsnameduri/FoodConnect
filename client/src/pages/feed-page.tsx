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
    category: [] as string[],
    dietary: [] as string[],
    expiryWithin: 7,
    type: 'all' as 'all' | 'donation' | 'request'
  });
  
  // Function to update filters safely with type checking
  const updateFilters = (filters: {
    distance: number;
    category: string[];
    dietary: string[];
    expiryWithin?: number;
    type?: 'all' | 'donation' | 'request';
  }) => {
    setActiveFilters({
      ...activeFilters,
      distance: filters.distance,
      category: filters.category,
      dietary: filters.dietary,
      expiryWithin: filters.expiryWithin ?? activeFilters.expiryWithin,
      type: filters.type ?? activeFilters.type
    });
  };

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
        <div className="flex flex-row items-center justify-between mb-4 w-full gap-4">
          <div className="flex-1" />
          <h1 className="font-montserrat font-extrabold text-3xl md:text-5xl text-[#424242] text-center flex-1">
            Find Food
          </h1>
          <div className="flex flex-row items-center gap-4 flex-1 justify-end">
            <form onSubmit={handleSearch} className="relative flex w-full md:w-auto md:mr-2">
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
              variant="default"
              className="bg-[#4CAF50] text-white font-bold px-6 py-2 rounded-lg shadow-lg text-base hover:bg-[#388E3C] focus:ring-2 focus:ring-[#4CAF50] focus:outline-none transition-all duration-200"
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
              updateFilters(filters);
              setShowFilters(false);
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
          </div>

          <TabsContent value="feed" className="mt-0">
            <FeedView filters={activeFilters} />
          </TabsContent>

          <TabsContent value="map" className="mt-0">
            <MapView filters={activeFilters} />
          </TabsContent>
        </Tabs>
      </div>

      <CreatePostButton />
    </>
  );
}