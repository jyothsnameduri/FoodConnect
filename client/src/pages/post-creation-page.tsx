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

// Create a schema that extends the insertFoodPostSchema for the form
const postFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title cannot exceed 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description cannot exceed 500 characters"),
  quantity: z.string().min(1, "Quantity is required"),
  category: z.enum((foodCategories as unknown) as [string, ...string[]]),
  dietary: z.array(z.enum((dietaryOptions as unknown) as [string, ...string[]])).optional(),
  address: z.string().min(5, "Address is required"),
  // Removed pickup date/time fields
  expiryDate: z.date({ required_error: "Expiry date is required" }),
  expiryTime: z.string(),
  // Image is handled separately
});

type PostFormValues = z.infer<typeof postFormSchema>;

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
  const { data: enums } = useQuery({
    queryKey: ["/api/enums"],
  });

  // Use the server enum values or fallback to constants
  const categories = enums?.foodCategories || foodCategories;
  const dietary = enums?.dietaryOptions || dietaryOptions;

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
      address: "",
      // Only keeping expiry date/time fields
      expiryDate: tomorrow,
      expiryTime: "23:59",
    },
  });

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
        
        const payload = {
          userId: currentUser.id, // Add the user ID from the current user
          type: initialType,
          title: sanitizeString(formData.title),
          description: sanitizeString(formData.description),
          quantity: sanitizeString(formData.quantity),
          category: formData.category,
          dietary: Array.isArray(formData.dietary) ? formData.dietary : [],
          address: sanitizeString(formData.address),
          latitude: formData.latitude || 37.7749,
          longitude: formData.longitude || -122.4194,
          expiryTime: expiryDate // Add the combined date and time
          // Note: We're not sending status as it has a default value in the schema
        };
        
        console.log("Simplified payload:", payload);
        
        // Custom JSON serializer to handle Date objects properly
        const customStringify = (obj: any) => {
          return JSON.stringify(obj, (key, value) => {
            // Convert Date objects to ISO strings
            if (value instanceof Date) {
              return value.toISOString();
            }
            return value;
          });
        };
        
        console.log("Final payload before stringify:", payload);
        
        // First create the post
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: customStringify(payload),
          credentials: "include" // Important for sending cookies/session data
        });

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
    onSuccess: (data) => {
      // Invalidate the posts query to refetch posts
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });

      // Upload images if any
      if (imageFiles.length > 0) {
        // In a real implementation, you would upload the images here
        console.log("Uploading images for post ID", data.id);
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

      // Convert dates and times with validation
      const pickupStartTime = values.pickupStartDate && values.pickupStartTime ? 
        combineDateAndTime(values.pickupStartDate, values.pickupStartTime) : new Date();
      
      const pickupEndTime = values.pickupEndDate && values.pickupEndTime ? 
        combineDateAndTime(values.pickupEndDate, values.pickupEndTime) : new Date(pickupStartTime.getTime() + 8 * 60 * 60 * 1000);
      
      const expiryTime = values.expiryDate && values.expiryTime ? 
        combineDateAndTime(values.expiryDate, values.expiryTime) : new Date(pickupStartTime.getTime() + 24 * 60 * 60 * 1000);

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
        address: sanitizeString(values.address),
        latitude: 37.7749, // Default latitude
        longitude: -122.4194 // Default longitude
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

    // Validate required fields before submission
    if (!values.title || !values.description || !values.quantity || !values.category || !values.address) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create API data with proper formatting
      const apiData = convertFormToApiData(values);
      
      // Log the data being submitted for debugging
      console.log("Submitting post data:", apiData);
      
      // Submit the form data
      createPostMutation.mutate(apiData);
    } catch (error) {
      console.error("Error preparing form data:", error);
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
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                          {dietary.map((option) => (
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
                                                current.filter((value) => value !== option)
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

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-opensans font-semibold text-[#424242]">
                          Pickup Location <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter the address or general area for pickup"
                            {...field}
                            className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]"
                            disabled={createPostMutation.isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          For safety, we recommend using a public location or general area instead of your exact home address.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  {initialType === 'request' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="pickupStartDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="font-opensans font-semibold text-[#424242]">
                                Pickup Start Date <span className="text-red-500">*</span>
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
                          name="pickupStartTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-opensans font-semibold text-[#424242]">
                                Pickup Start Time <span className="text-red-500">*</span>
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="pickupEndDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="font-opensans font-semibold text-[#424242]">
                                Pickup End Date <span className="text-red-500">*</span>
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
                                    disabled={(date) => date < (form.getValues("pickupStartDate") || today)}
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
                          name="pickupEndTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-opensans font-semibold text-[#424242]">
                                Pickup End Time <span className="text-red-500">*</span>
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