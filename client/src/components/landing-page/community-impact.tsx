export function CommunityImpact() {
  return (
    <section className="py-16 bg-[#4CAF50]/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#424242] mb-4">Our Community Impact</h2>
          <p className="font-opensans text-[#424242] max-w-2xl mx-auto">
            Together, we're making a difference in our neighborhoods and the environment.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-white p-6 rounded-soft shadow-soft">
            <div className="text-3xl md:text-4xl font-montserrat font-bold text-[#4CAF50] mb-2">
              12,580
            </div>
            <p className="font-opensans text-[#424242]">Meals shared</p>
          </div>
          
          <div className="bg-white p-6 rounded-soft shadow-soft">
            <div className="text-3xl md:text-4xl font-montserrat font-bold text-[#FF9800] mb-2">
              2,450
            </div>
            <p className="font-opensans text-[#424242]">Active members</p>
          </div>
          
          <div className="bg-white p-6 rounded-soft shadow-soft">
            <div className="text-3xl md:text-4xl font-montserrat font-bold text-[#42A5F5] mb-2">
              4.2
            </div>
            <p className="font-opensans text-[#424242]">Tons of food waste prevented</p>
          </div>
        </div>
      </div>
    </section>
  );
}
