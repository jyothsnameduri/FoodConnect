import { HeroSection } from "@/components/landing-page/hero-section";
import { HowItWorks } from "@/components/landing-page/how-it-works";
import { FeaturedItems } from "@/components/landing-page/featured-items";
import { CommunityImpact } from "@/components/landing-page/community-impact";
import { Testimonials } from "@/components/landing-page/testimonials";
import { CallToAction } from "@/components/landing-page/call-to-action";
import { FAQ } from "@/components/landing-page/faq";
import { Helmet } from "react-helmet";

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>FoodShare - Reducing food waste, building community</title>
        <meta 
          name="description" 
          content="Connect with neighbors to share surplus food, reduce waste, and build a stronger community with FoodShare's free platform."
        />
        <meta property="og:title" content="FoodShare - Reducing food waste, building community" />
        <meta 
          property="og:description" 
          content="Share food, make connections, and reduce waste in your local community with FoodShare."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://foodshare.community" />
      </Helmet>
      
      <main>
        <HeroSection />
        <HowItWorks />
        <FeaturedItems />
        <CommunityImpact />
        <Testimonials />
        <CallToAction />
        <FAQ />
      </main>
    </>
  );
}
