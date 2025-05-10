import { Sprout, SearchCheck, Users } from "lucide-react";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#424242] dark:text-white mb-4 transition-colors duration-300">How FoodShare Works</h2>
          <p className="font-opensans text-[#424242] dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
            Our platform makes it easy to share food and reduce waste in three simple steps.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-[#F5F5F5] dark:bg-gray-800 p-6 rounded-soft shadow-soft dark:shadow-md text-center transition-colors duration-300">
            <div className="w-16 h-16 bg-[#4CAF50]/10 dark:bg-[#4CAF50]/20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
              <Sprout className="h-8 w-8 text-[#4CAF50] dark:text-[#7bed9f]" />
            </div>
            <h3 className="font-montserrat font-semibold text-xl mb-3 dark:text-white transition-colors duration-300">Donate</h3>
            <p className="font-opensans text-[#424242] dark:text-gray-300 transition-colors duration-300">
              List your surplus food items, homegrown produce, or prepared meals that you'd like to share.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="bg-[#F5F5F5] dark:bg-gray-800 p-6 rounded-soft shadow-soft dark:shadow-md text-center transition-colors duration-300">
            <div className="w-16 h-16 bg-[#42A5F5]/10 dark:bg-[#42A5F5]/20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
              <SearchCheck className="h-8 w-8 text-[#42A5F5] dark:text-[#60a5fa]" />
            </div>
            <h3 className="font-montserrat font-semibold text-xl mb-3 dark:text-white transition-colors duration-300">Connect</h3>
            <p className="font-opensans text-[#424242] dark:text-gray-300 transition-colors duration-300">
              Find food offerings in your neighborhood or connect with people who need what you're sharing.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="bg-[#F5F5F5] dark:bg-gray-800 p-6 rounded-soft shadow-soft dark:shadow-md text-center transition-colors duration-300">
            <div className="w-16 h-16 bg-[#FF9800]/10 dark:bg-[#FF9800]/20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
              <Users className="h-8 w-8 text-[#FF9800] dark:text-[#fbbf24]" />
            </div>
            <h3 className="font-montserrat font-semibold text-xl mb-3 dark:text-white transition-colors duration-300">Share</h3>
            <p className="font-opensans text-[#424242] dark:text-gray-300 transition-colors duration-300">
              Arrange pickup or delivery and build connections with others in your community.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
