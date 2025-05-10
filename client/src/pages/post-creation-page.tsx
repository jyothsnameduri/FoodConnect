import { useState, useEffect } from "react";
import { useSearch, useLocation, Link } from "wouter";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { 
  foodPostTypes,
  foodCategories,
  dietaryOptions,
  insertFoodPostSchema
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, Loader2, Plus, X, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MapGL, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// If you see a type error for 'react-helmet', run: npm install --save-dev @types/react-helmet
// Or add a file react-helmet.d.ts with: declare module 'react-helmet';

// Create a schema that extends the insertFoodPostSchema for the form
const postFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description cannot exceed 500 characters"),
  quantity: z.string().min(1, "Quantity is required"),
  category: z.enum((foodCategories as unknown) as [string, ...string[]]),
  dietary: z.array(z.enum((dietaryOptions as unknown) as [string, ...string[]])).optional(),
  latitude: z.number({ required_error: "Latitude is required" }),
  longitude: z.number({ required_error: "Longitude is required" }),
  expiryDate: z.date({ required_error: "Expiry date is required" }),
  expiryTime: z.string(),
  // Image is handled separately
});

type PostFormValues = z.infer<typeof postFormSchema>;

// Add type for enums response
type EnumsResponse = {
  foodCategories: string[];
  dietaryOptions: string[];
  // add other enums if needed
};

const MAPBOX_TOKEN = 'pk.eyJ1IjoibmFuaS0wMDciLCJhIjoiY21hYnppcDlrMjYwZzJ3c2JqOHdhYmVpbCJ9.f2Ok8ZFGgkuAJyIYlQZxNA';

export default function PostCreationPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const initialType = searchParams.get("type") === "request" ? "request" : "donation";

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const totalSteps = 2;

  const { toast } = useToast();

  // Get enum values from the server if needed
  const { data: enums } = useQuery<EnumsResponse>({
    queryKey: ["/api/enums"],
  });

  // Use the server enum values or fallback to constants
  const categories: string[] = Array.from(enums?.foodCategories ?? foodCategories);
  const dietary: string[] = Array.from(enums?.dietaryOptions ?? dietaryOptions);

  // Calculate today and tomorrow for date constraints
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  // Form definition
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      description: "",
      quantity: "",
      category: "meal",
      dietary: [],
      latitude: undefined,
      longitude: undefined,
      expiryDate: tomorrow,
      expiryTime: "23:59",
    },
  });

  // Add state for location search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Function to search Mapbox Geocoding API
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
      );
      const data = await res.json();
      setSearchResults(data.features || []);
    } catch (e) {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Check if adding these files exceeds the 3 image limit
      if (imageFiles.length + newFiles.length > 3) {
        toast({
          title: "Too many images",
          description: "You can upload a maximum of 3 images",
          variant: "destructive",
        });
        return;
      }

      setImageFiles(prev => [...prev, ...newFiles]);

      // Create URLs for preview
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...newUrls]);
    }
  };

  // Remove an image
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));

    // Clean up URL to prevent memory leaks
    URL.revokeObjectURL(imageUrls[index]);
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Create food post mutation
  const createPostMutation = useMutation({
    mutationFn: async (formData: any) => {
      try {
        // First, fetch the current user to get their ID
        const userResponse = await fetch("/api/user", {
          credentials: "include"
        });
        
        if (!userResponse.ok) {
          throw new Error("You must be logged in to create a post");
        }
        
        const currentUser = await userResponse.json();
        console.log("Current user:", currentUser);
        
        if (!currentUser || !currentUser.id) {
          throw new Error("Unable to get user information. Please log in again.");
        }
        
        console.log("Form data being submitted:", formData);
        
        // Helper function to sanitize string values by removing extra quotes
        const sanitizeString = (str: string): string => {
          if (!str) return '';
          // Remove any surrounding quotes
          return str.replace(/^"|^'|"$|'$/g, '').trim();
        };
        
        // Create a simplified payload with ONLY the fields expected by the server schema
        // This is critical to avoid validation errors
        
        // Combine expiryDate and expiryTime into a single Date object
        const expiryDate = new Date(formData.expiryDate || new Date());
        
        // Safely handle expiryTime - default to end of day if not provided
        let hours = 23;
        let minutes = 59;
        
        if (formData.expiryTime && typeof formData.expiryTime === 'string') {
          const timeParts = formData.expiryTime.split(':');
          if (timeParts.length === 2) {
            hours = parseInt(timeParts[0], 10) || 0;
            minutes = parseInt(timeParts[1], 10) || 0;
          }
        }
        
        expiryDate.setHours(hours, minutes, 0, 0);
        
        // Create a Date object for expiryTime and ensure it's properly formatted
        const expiryTime = new Date(expiryDate);
        
        // Format the date directly as a string in ISO format for consistent handling
        const expiryTimeIso = expiryTime.toISOString();
        
        // Create a payload with all required fields (do NOT include userId)
        const payload = {
          type: initialType,
          title: sanitizeString(formData.title),
          description: sanitizeString(formData.description),
          quantity: sanitizeString(formData.quantity),
          category: formData.category,
          dietary: Array.isArray(formData.dietary) ? formData.dietary : [],
          latitude: formData.latitude || 37.7749,
          longitude: formData.longitude || -122.4194,
          expiryTime: expiryTimeIso
          // Note: We're not sending status as it has a default value in the schema
        };
        
        console.log("Simplified payload:", payload);
        
        // Use standard JSON.stringify since we're already handling date conversion
        console.log("Final payload before stringify:", payload);
        
        // First create the post
        let response;
        try {
          // Make sure user is authenticated before making the request
          if (!currentUser || !currentUser.id) {
            throw new Error("You must be logged in to create a post");
          }
          
          // Use a more robust fetch with proper error handling
          response = await fetch("/api/posts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            credentials: "include" // Important for sending cookies/session data
          });
          
          console.log("Server response status:", response.status);
        } catch (fetchError) {
          const err = fetchError as Error;
          console.error("Network error during fetch:", err);
          throw new Error(`Network error: ${err.message || 'Failed to connect to server'}`);
        }

        if (!response.ok) {
          // Handle HTTP error responses
          if (response.status === 401) {
            throw new Error("You must be logged in to create a post");
          } else {
            const text = await response.text();
            console.log("Server error response:", text);
            
            try {
              const errorData = JSON.parse(text);
              
              // Handle validation errors more specifically
              if (errorData.error && Array.isArray(errorData.error)) {
                const errorMessages = errorData.error.map((err: any) => {
                  if (err.path && err.path.length > 0) {
                    return `${err.path.join('.')}: ${err.message}`;
                  }
                  return err.message || 'Unknown validation error';
                }).join('; ');
                
                throw new Error(`Validation error: ${errorMessages}`);
              } else if (errorData.error) {
                throw new Error(typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error));
              } else if (errorData.message) {
                throw new Error(errorData.message);
              } else {
                throw new Error("Failed to create post: Unknown server error");
              }
            } catch (parseError) {
              // If we can't parse the error as JSON, use the status text
              console.error("Error parsing server response:", parseError);
              throw new Error(`Server error: ${response.status} ${response.statusText || "Failed to create post"}`);
            }
          }
        }

        return await response.json();
      } catch (error) {
        console.error("Error in post creation:", error);
        throw error;
      }
    },
    onSuccess: async (data) => {
      // Invalidate the posts query to refetch posts
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });

      // Upload images if any
      if (imageFiles.length > 0) {
        try {
          console.log("Uploading images for post ID", data.id);
          
          // Upload each image one by one
          for (const file of imageFiles) {
            const formData = new FormData();
            formData.append("image", file);
            
            const response = await fetch(`/api/posts/${data.id}/images`, {
              method: "POST",
              body: formData,
              credentials: "include" // Important for sending cookies/session data
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Failed to upload image: ${errorText}`);
              throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`);
            }
            
            console.log("Image uploaded successfully");
          }
          
          // Invalidate the post's images query to refetch images
          queryClient.invalidateQueries({ queryKey: [`/api/posts/${data.id}/images`] });
          
          toast({
            title: "Images uploaded successfully!",
            description: `${imageFiles.length} image(s) have been uploaded with your post.`,
          });
        } catch (error) {
          console.error("Error uploading images:", error);
          toast({
            title: "Image upload issue",
            description: error instanceof Error ? error.message : "Failed to upload some images, but your post was created.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Post created successfully!",
        description: "Your food post has been published.",
      });

      // Redirect to the post or feed page
      setLocation("/feed");
    },
    onError: (error: Error) => {
      // Just use the error message directly since we've already formatted it properly in mutationFn
      console.error("Post creation error:", error);
      
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Convert form data to API format
  const convertFormToApiData = (values: PostFormValues) => {
    try {
      // Helper function to combine date and time
      const combineDateAndTime = (date: Date, timeStr: string) => {
        try {
          const newDate = new Date(date);
          const [hours, minutes] = timeStr.split(':').map(Number);
          newDate.setHours(hours, minutes, 0, 0); // Set seconds and milliseconds to 0
          return newDate;
        } catch (error) {
          console.error('Error combining date and time:', error);
          // Return current date + 1 day as fallback
          const fallback = new Date();
          fallback.setDate(fallback.getDate() + 1);
          return fallback;
        }
      };

      // Convert expiry date and time
      const expiryTime = values.expiryDate && values.expiryTime ? 
        combineDateAndTime(values.expiryDate, values.expiryTime) : new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create a payload that exactly matches the server's expected schema
      // Only include fields that are defined in the insertFoodPostSchema
      
      // Helper function to remove extra quotes from string values
      const sanitizeString = (str: string): string => {
        if (!str) return '';
        // Remove any surrounding quotes
        return str.replace(/^"|^'|"$|'$/g, '').trim();
      };
      
      return {
        type: initialType, // Use the type from URL parameter
        title: sanitizeString(values.title),
        description: sanitizeString(values.description),
        quantity: sanitizeString(values.quantity),
        category: values.category,
        dietary: Array.isArray(values.dietary) ? values.dietary : [],
        latitude: values.latitude || 37.7749,
        longitude: values.longitude || -122.4194,
        expiryTime: expiryTime.toISOString()
        // Date fields have been removed from the schema requirements
        // Note: We're not including status as it has a default value in the schema
      };
    } catch (error) {
      console.error('Error in convertFormToApiData:', error);
      throw new Error('Failed to process form data. Please check all fields and try again.');
    }
  };

  // Form submission
  const onSubmit = (values: PostFormValues) => {
    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }
    if (!values.title || !values.description || !values.quantity || !values.category || values.latitude === undefined || values.longitude === undefined) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields and select a pickup location on the map before submitting.",
        variant: "destructive",
      });
      return;
    }
    try {
      const apiData = convertFormToApiData(values);
      createPostMutation.mutate(apiData);
    } catch (error) {
      toast({
        title: "Form Error",
        description: error instanceof Error ? error.message : "Failed to process form data",
        variant: "destructive",
      });
    }
  };

  // Move to previous step
  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/auth");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#4CAF50]" />
      </div>
    );
  }

  // For added safety, don't render the form if user is not authenticated
  if (!user) return null;

  return (
    <>
      <Helmet>
        <title>{initialType === "donation" ? "Donate Food" : "Request Food"} | FoodShare</title>
        <meta 
          name="description" 
          content={initialType === "donation" 
            ? "Share your surplus food with neighbors in need. Create a food donation post in just a few steps." 
            : "Let your community know what food you're looking for. Create a food request in just a few steps."}
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              className="mb-2 p-0 text-[#9E9E9E] hover:text-[#4CAF50] hover:bg-transparent"
              asChild
            >
              <Link href="/feed">
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back to Feed
              </Link>
            </Button>
            <h1 className="font-montserrat font-bold text-2xl md:text-3xl text-[#424242]">
              {initialType === "donation" ? "Donate Food" : "Request Food"}
            </h1>
            <p className="text-[#9E9E9E] mt-2">
              {initialType === "donation" 
                ? "Share your surplus food with neighbors who can use it." 
                : "Let your community know what food you're looking for."}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    ${step > index + 1 
                      ? 'bg-[#4CAF50] text-white' 
                      : step === index + 1 
                        ? 'bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]' 
                        : 'bg-[#E0E0E0] text-[#9E9E9E]'}
                  `}>
                    {index + 1}
                  </div>
                  {index < totalSteps - 1 && (
                    <div className={`w-full h-1 mx-2 ${step > index + 1 ? 'bg-[#4CAF50]' : 'bg-[#E0E0E0]'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-[#9E9E9E]">
              <span>Basic Information</span>
              <span>Pickup & Expiry</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-opensans font-semibold text-[#424242]">
                          Title <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={initialType === "donation" 
                              ? "E.g. Homemade Cookies, Fresh Garden Tomatoes" 
                              : "E.g. Looking for bread, Need vegetables for soup"}
                            {...field}
                            className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]"
                            maxLength={100}
                            disabled={createPostMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-[#9E9E9E]">
                          {field.value?.length || 0}/100 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-opensans font-semibold text-[#424242]">
                          Description <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide details about the food (ingredients, when it was prepared, why you're sharing it, etc.)"
                            {...field}
                            className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]"
                            rows={4}
                            maxLength={500}
                            disabled={createPostMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-[#9E9E9E]">
                          {field.value?.length || 0}/500 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-opensans font-semibold text-[#424242]">
                          Quantity <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="E.g. 2 loaves, 5 servings, 1 kg"
                            {...field}
                            className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]"
                            disabled={createPostMutation.isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-opensans font-semibold text-[#424242]">
                          Food Category <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={createPostMutation.isPending}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category: string) => (
                              <SelectItem key={category} value={category}>
                                {category.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dietary"
                    render={() => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel className="font-opensans font-semibold text-[#424242]">
                            Dietary Information
                          </FormLabel>
                          <FormDescription>
                            Select all that apply
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {dietary.map((option: string) => (
                            <FormField
                              key={option}
                              control={form.control}
                              name="dietary"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={option}
                                    className="flex flex-row items-start space-x-2 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(option)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          return checked
                                            ? field.onChange([...current, option])
                                            : field.onChange(
                                                current.filter((value: string) => value !== option)
                                              );
                                        }}
                                        disabled={createPostMutation.isPending}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer capitalize">
                                      {option.replace('_', ' ')}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel className="font-opensans font-semibold text-[#424242] block mb-2">
                      Pickup Location <span className="text-red-500">*</span>
                    </FormLabel>
                    {/* Location Search Box */}
                    <div className="mb-2 relative z-20">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Search for a location..."
                        className="w-full px-3 py-2 border border-gray-300 rounded"
                      />
                      {isSearching && <div className="absolute left-0 right-0 bg-white border border-gray-200 rounded shadow mt-1 px-3 py-2">Searching...</div>}
                      {searchResults.length > 0 && (
                        <ul className="absolute left-0 right-0 bg-white border border-gray-200 rounded shadow mt-1 max-h-40 overflow-y-auto">
                          {searchResults.map((result: any) => (
                            <li
                              key={result.id}
                              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                              onClick={() => {
                                const [lng, lat] = result.center;
                                form.setValue('latitude', lat);
                                form.setValue('longitude', lng);
                                setSearchQuery(result.place_name);
                                setSearchResults([]);
                              }}
                            >
                              {result.place_name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div style={{ width: '100%', height: 300, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                      <MapGL
                        width="100%"
                        height="100%"
                        latitude={typeof form.watch('latitude') === 'number' ? form.watch('latitude') : 20.5937}
                        longitude={typeof form.watch('longitude') === 'number' ? form.watch('longitude') : 78.9629}
                        zoom={form.watch('latitude') && form.watch('longitude') ? 14 : 4}
                        mapboxApiAccessToken={MAPBOX_TOKEN}
                        onClick={e => {
                          const [lng, lat] = e.lngLat;
                          form.setValue('latitude', lat);
                          form.setValue('longitude', lng);
                          setSearchQuery(''); // clear search box if user clicks map
                        }}
                        mapStyle="mapbox://styles/mapbox/streets-v11"
                      >
                        {form.watch('latitude') && form.watch('longitude') && (
                          <Marker
                            latitude={typeof form.watch('latitude') === 'number' ? form.watch('latitude') : 20.5937}
                            longitude={typeof form.watch('longitude') === 'number' ? form.watch('longitude') : 78.9629}
                            offsetLeft={-16}
                            offsetTop={-32}
                          >
                            <div style={{ color: '#4CAF50', fontSize: 32 }}>📍</div>
                          </Marker>
                        )}
                      </MapGL>
                    </div>
                    {form.watch('latitude') && form.watch('longitude') && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span>Latitude: {form.watch('latitude')}</span><br />
                        <span>Longitude: {form.watch('longitude')}</span>
                      </div>
                    )}
                    <FormDescription>
                      Click on the map to select a pickup location. For safety, we recommend using a public location or general area instead of your exact home address.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  {initialType === 'request' && (
                    <>
                      {/* Pickup date/time fields have been removed */}
                    </>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="font-opensans font-semibold text-[#424242]">
                            Expiry Date <span className="text-red-500">*</span>
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal border border-[#E0E0E0] rounded-soft"
                                  disabled={createPostMutation.isPending}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < today}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiryTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-opensans font-semibold text-[#424242]">
                            Expiry Time <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]"
                              disabled={createPostMutation.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormLabel className="font-opensans font-semibold text-[#424242] block mb-2">
                      Photos (Optional)
                    </FormLabel>
                    <FormDescription className="mb-2">
                      Add up to 3 photos of the food. Clear images help others decide if they want your food.
                    </FormDescription>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative w-24 h-24 border border-[#E0E0E0] rounded-soft overflow-hidden">
                          <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600"
                            onClick={() => removeImage(index)}
                            disabled={createPostMutation.isPending}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      {imageUrls.length < 3 && (
                        <label className="flex items-center justify-center w-24 h-24 border border-dashed border-[#E0E0E0] rounded-soft cursor-pointer hover:border-[#4CAF50] transition-colors">
                          <div className="text-center">
                            <Plus className="h-6 w-6 mx-auto text-[#9E9E9E]" />
                            <span className="text-xs text-[#9E9E9E]">Add Photo</span>
                          </div>
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                            disabled={createPostMutation.isPending}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-[#E0E0E0]">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="border border-[#E0E0E0] text-[#424242]"
                    onClick={handlePrevStep}
                    disabled={createPostMutation.isPending}
                  >
                    Previous
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="border border-[#E0E0E0] text-[#424242]"
                    asChild
                  >
                    <Link href="/feed">
                      Cancel
                    </Link>
                  </Button>
                )}

                <Button
                  type="submit"
                  className={`${
                    initialType === "donation" 
                      ? "bg-[#4CAF50] hover:bg-[#388E3C]" 
                      : "bg-[#42A5F5] hover:bg-[#1976D2]"
                  } text-white`}
                  disabled={createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {step < totalSteps ? "Saving..." : "Creating Post..."}
                    </>
                  ) : (
                    step < totalSteps ? "Next" : "Create Post"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
}