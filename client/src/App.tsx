import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import FeedPage from "@/pages/feed-page";
import PostCreationPage from "@/pages/post-creation-page";
import PostDetailPage from "@/pages/post-detail-page";
import ClaimsPage from "@/pages/claims-page";
import ClaimDetailPage from "@/pages/claim-detail-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

function Router() {
  return (
    <>
      <Header />
      <Switch>
        <ProtectedRoute path="/posts/new">
          <PostCreationPage />
        </ProtectedRoute>
        <Route path="/posts/:id">
          <PostDetailPage />
        </Route>
        <ProtectedRoute path="/claims/:id">
          <ClaimDetailPage />
        </ProtectedRoute>
        <ProtectedRoute path="/claims">
          <ClaimsPage />
        </ProtectedRoute>
        <ProtectedRoute path="/profile">
          <ProfilePage />
        </ProtectedRoute>
        <Route path="/feed">
          <FeedPage />
        </Route>
        <Route path="/auth">
          <AuthPage />
        </Route>
        <Route path="/">
          <HomePage />
        </Route>
        <Route path="/donate">
          {() => (window.location.href = "/posts/new?type=donation")}
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
      <Footer />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;