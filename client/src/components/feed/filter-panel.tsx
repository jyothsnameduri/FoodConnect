import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { foodCategories, dietaryOptions } from "@shared/schema";

interface FilterPanelProps {
  onClose: () => void;
  onApplyFilters: (filters: {
    distance: number;
    category: string[];
    dietary: string[];
    expiryWithin?: number; // Days until expiry
    type?: 'all' | 'donation' | 'request';
  }) => void;
}

export function FilterPanel({ onClose, onApplyFilters }: FilterPanelProps) {
  // Get enum values from the server if needed
  const { data: enums } = useQuery({
    queryKey: ["/api/enums"],
  });

  // Filter state
  const [distance, setDistance] = useState<number>(5);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [expiryWithin, setExpiryWithin] = useState<number>(7); // Default to 7 days
  const [postType, setPostType] = useState<'all' | 'donation' | 'request'>('all');

  // Category toggle handler
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Dietary toggle handler
  const toggleDietary = (option: string) => {
    setSelectedDietary(prev => 
      prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option]
    );
  };

  // Reset filters
  const resetFilters = () => {
    setDistance(5);
    setSelectedCategories([]);
    setSelectedDietary([]);
  };

  // Apply filters
  const applyFilters = () => {
    // Call the parent component's filter handler with all filter values
    onApplyFilters({
      distance,
      category: selectedCategories,
      dietary: selectedDietary,
      expiryWithin,
      type: postType
    });
    
    // Log for debugging
    console.log("Applied filters:", { 
      distance, 
      category: selectedCategories, 
      dietary: selectedDietary,
      expiryWithin,
      type: postType
    });
    
    onClose();
  };

  // Format distance for display
  const formatDistance = (miles: number) => {
    return miles === 1 ? "1 mile" : `${miles} miles`;
  };

  // Use enum values from server or fallback to schema constants
  const categories = enums?.foodCategories || foodCategories;
  const dietary = enums?.dietaryOptions || dietaryOptions;

  return (
    <div className="bg-white rounded-soft shadow-medium p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-montserrat font-semibold text-lg text-[#424242]">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-5 w-5 text-[#9E9E9E]" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Distance Filter */}
        <div>
          <Label className="font-opensans font-semibold text-[#424242] mb-2 block">
            Distance: {formatDistance(distance)}
          </Label>
          <Slider
            defaultValue={[distance]}
            max={10}
            min={0.5}
            step={0.5}
            onValueChange={(value) => setDistance(value[0])}
            className="my-4"
          />
          <div className="flex justify-between text-xs text-[#9E9E9E]">
            <span>0.5 miles</span>
            <span>10 miles</span>
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <Label className="font-opensans font-semibold text-[#424242] mb-2 block">
            Food Category
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={selectedCategories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                />
                <label
                  htmlFor={`category-${category}`}
                  className="text-sm font-opensans text-[#424242] cursor-pointer capitalize"
                >
                  {category.replace('_', ' ')}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Dietary Filter */}
        <div>
          <Label className="font-opensans font-semibold text-[#424242] mb-2 block">
            Dietary Preferences
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {dietary.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`dietary-${option}`}
                  checked={selectedDietary.includes(option)}
                  onCheckedChange={() => toggleDietary(option)}
                />
                <label
                  htmlFor={`dietary-${option}`}
                  className="text-sm font-opensans text-[#424242] cursor-pointer capitalize"
                >
                  {option.replace('_', ' ')}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 space-x-3">
        <Button
          variant="outline"
          className="border border-[#E0E0E0] text-[#424242]"
          onClick={resetFilters}
        >
          Clear All
        </Button>
        <Button
          className="bg-[#4CAF50] text-white hover:bg-[#388E3C]"
          onClick={applyFilters}
        >
          Apply Filters
        </Button>
      </div>
    </div>
  );
}