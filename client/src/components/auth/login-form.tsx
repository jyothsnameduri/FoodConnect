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

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { loginMutation } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };

  return (
    <div className="w-full auth-form">
      <h2 className="font-montserrat font-bold text-2xl text-[#424242] mb-6">Log In</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    placeholder="yourusername" 
                    autoComplete="username"
                    disabled={loginMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between mb-1">
                  <FormLabel className="font-opensans font-semibold text-[#424242]">Password</FormLabel>
                  <Link href="/forgot-password" className="text-sm text-[#4CAF50] hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input 
                    {...field} 
                    type="password" 
                    className="w-full px-4 py-2 border border-[#E0E0E0] rounded-soft focus:outline-none focus:border-[#4CAF50]" 
                    placeholder="••••••••" 
                    autoComplete="current-password"
                    disabled={loginMutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex items-center">
            <Checkbox 
              id="remember" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              className="mr-2 h-4 w-4 text-[#4CAF50]"
              disabled={loginMutation.isPending}
            />
            <label 
              htmlFor="remember" 
              className="font-opensans text-[#424242] cursor-pointer"
            >
              Remember me
            </label>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-[#4CAF50] text-white py-3 rounded-soft font-montserrat font-semibold hover:bg-[#388E3C] transition-colors"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
