import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function CallToAction() {
  return (
    <section className="py-16 bg-gradient-to-r from-[#4CAF50] to-[#388E3C] dark:from-[#0f3460] dark:to-[#1e293b] text-white transition-colors duration-300">
      <div className="container mx-auto px-4 text-center">
        <h2 className="font-montserrat font-bold text-2xl md:text-4xl mb-6">Ready to join our food-sharing community?</h2>
        <p className="font-opensans text-lg mb-8 max-w-2xl mx-auto">
          Sign up today to start sharing or finding food in your neighborhood.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            className="px-8 py-6 bg-white dark:bg-gray-800 text-[#4CAF50] dark:text-[#7bed9f] font-montserrat font-semibold rounded-soft hover:bg-[#F5F5F5] dark:hover:bg-gray-700 shadow-soft transition-colors duration-300"
            asChild
          >
            <Link href="/auth">
              Create Account
            </Link>
          </Button>
          <Button 
            className="px-8 py-6 bg-transparent border-2 border-white text-white font-montserrat font-semibold rounded-soft hover:bg-white/10 dark:hover:bg-white/20 transition-colors duration-300"
            variant="outline"
            asChild
          >
            <Link href="/browse">
              Browse as Guest
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
