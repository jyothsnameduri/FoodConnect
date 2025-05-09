import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  zipCode: z.string().min(5, "ZIP/Postal code must be at least 5 characters"),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // In a real application, these values would come from user.metadata or a profile API
  const defaultValues: ProfileFormValues = {
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.j@example.com",
    phone: "",
    zipCode: "94610",
    bio: "Urban gardener passionate about fresh food and sustainability."
  };
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });
  
  const onSubmit = (data: ProfileFormValues) => {
    setIsSubmitting(true);
    
    // In a real application, this would call an API to update the user's profile
    setTimeout(() => {
      // Simulate API call
      console.log("Profile updated:", data);
      setIsSubmitting(false);
    }, 1000);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-opensans font-semibold text-[#424242] mb-1">First Name</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-opensans font-semibold text-[#424242] mb-1">Last Name</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel className="font-opensans font-semibold text-[#424242] mb-1">Email</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel className="font-opensans font-semibold text-[#424242] mb-1">Phone (optional)</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="zipCode"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel className="font-opensans font-semibold text-[#424242] mb-1">ZIP/Postal Code</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem className="mb-6">
              <FormLabel className="font-opensans font-semibold text-[#424242] mb-1">Bio (optional)</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Tell the community a bit about yourself..."
                  className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]"
                  rows={3}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button 
            type="button" 
            variant="outline" 
            className="mr-3 px-4 py-2 border border-[#E0E0E0] text-[#424242] rounded-soft font-montserrat hover:bg-[#F5F5F5] transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="px-4 py-2 bg-[#4CAF50] text-white rounded-soft font-montserrat font-semibold hover:bg-[#388E3C] transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
