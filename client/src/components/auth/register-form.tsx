import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  zipCode: z.string().min(5, "ZIP/Postal code must be at least 5 characters"),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { registerMutation } = useAuth();
  const [passwordStrength, setPasswordStrength] = useState(0);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      confirmPassword: "",
      zipCode: "",
      agreeTerms: false,
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate({
      username: data.username,
      password: data.password,
      // Additional fields could be saved to user metadata in a real application
    });
  };

  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Contains number
    if (/[0-9]/.test(password)) strength += 1;
    
    // Contains special character
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    return Math.min(strength, 4);
  };

  const getStrengthText = (strength: number) => {
    if (strength === 0) return "Very Weak";
    if (strength === 1) return "Weak";
    if (strength === 2) return "Fair";
    if (strength === 3) return "Good";
    return "Strong";
  };

  const getStrengthColor = (strength: number) => {
    if (strength === 0) return "bg-red-500";
    if (strength === 1) return "bg-orange-500";
    if (strength === 2) return "bg-yellow-500";
    if (strength === 3) return "bg-blue-500";
    return "bg-[#4CAF50]";
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const strength = calculatePasswordStrength(e.target.value);
    setPasswordStrength(strength);
    form.setValue("password", e.target.value);
  };

  return (
    <div className="w-full auth-form">
      <h2 className="font-montserrat font-bold text-2xl text-[#424242] mb-6">Create Account</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-opensans font-semibold text-[#424242]">First Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]" 
                      placeholder="John"
                      disabled={registerMutation.isPending}
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
                  <FormLabel className="font-opensans font-semibold text-[#424242]">Last Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]" 
                      placeholder="Doe"
                      disabled={registerMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-opensans font-semibold text-[#424242]">Username</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]" 
                    placeholder="johndoe123"
                    autoComplete="username"
                    disabled={registerMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field: { onChange, ...field } }) => (
              <FormItem>
                <FormLabel className="font-opensans font-semibold text-[#424242]">Password</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="password" 
                    className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]" 
                    placeholder="••••••••"
                    autoComplete="new-password"
                    onChange={handlePasswordChange}
                    disabled={registerMutation.isPending}
                  />
                </FormControl>
                <div className="mt-1 h-1 bg-[#E0E0E0] rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getStrengthColor(passwordStrength)}`}
                    style={{ width: `${(passwordStrength / 4) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-[#9E9E9E] mt-1">
                  Password strength: {getStrengthText(passwordStrength)}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-opensans font-semibold text-[#424242]">Confirm Password</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="password" 
                    className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]" 
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={registerMutation.isPending}
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
              <FormItem>
                <FormLabel className="font-opensans font-semibold text-[#424242]">ZIP/Postal Code</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]" 
                    placeholder="90210"
                    disabled={registerMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="agreeTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1 mr-2 h-4 w-4 text-[#4CAF50]"
                    disabled={registerMutation.isPending}
                  />
                </FormControl>
                <div className="font-opensans text-[#424242] text-sm">
                  I agree to the <Link href="/terms" className="text-[#4CAF50] hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-[#4CAF50] hover:underline">Privacy Policy</Link>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-[#4CAF50] text-white py-3 rounded-soft font-montserrat font-semibold hover:bg-[#388E3C] transition-colors"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
