export function CommunityImpact() {
  return (
    <section className="py-16 bg-[#4CAF50]/5 dark:bg-[#0f3460] transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#424242] dark:text-white mb-4 transition-colors duration-300">Our Community Impact</h2>
          <p className="font-opensans text-[#424242] dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
            Together, we're making a difference in our neighborhoods and the environment.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-soft shadow-soft dark:shadow-md transition-colors duration-300">
            <div className="text-3xl md:text-4xl font-montserrat font-bold text-[#4CAF50] dark:text-[#7bed9f] mb-2 transition-colors duration-300">
              12,580
            </div>
            <p className="font-opensans text-[#424242] dark:text-gray-300 transition-colors duration-300">Meals shared</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-soft shadow-soft dark:shadow-md transition-colors duration-300">
            <div className="text-3xl md:text-4xl font-montserrat font-bold text-[#FF9800] dark:text-[#fbbf24] mb-2 transition-colors duration-300">
              2,450
            </div>
            <p className="font-opensans text-[#424242] dark:text-gray-300 transition-colors duration-300">Active members</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-soft shadow-soft dark:shadow-md transition-colors duration-300">
            <div className="text-3xl md:text-4xl font-montserrat font-bold text-[#42A5F5] dark:text-[#60a5fa] mb-2 transition-colors duration-300">
              4.2
            </div>
            <p className="font-opensans text-[#424242] dark:text-gray-300 transition-colors duration-300">Tons of food waste prevented</p>
          </div>
        </div>
      </div>
    </section>
  );
}
