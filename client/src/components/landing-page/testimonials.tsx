import { Star, StarHalf } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  rating: number;
  text: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Rebecca M.',
    rating: 5,
    text: "I love sharing my garden's extra produce with neighbors. FoodShare has connected me with so many wonderful people in my community that I wouldn't have met otherwise.",
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
  },
  {
    id: '2',
    name: 'Michael P.',
    rating: 4.5,
    text: "As a restaurant owner, I hated throwing away perfectly good food at the end of the day. Now I can share it with families who appreciate it, and it's made a real difference in our community.",
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
  }
];

export function Testimonials() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#424242] dark:text-white mb-4 transition-colors duration-300">Community Voices</h2>
          <p className="font-opensans text-[#424242] dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
            Hear from our members who are sharing and connecting through FoodShare.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-[#F5F5F5] dark:bg-gray-800 p-6 rounded-soft shadow-soft dark:shadow-md transition-colors duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h3 className="font-montserrat font-semibold text-lg dark:text-white transition-colors duration-300">{testimonial.name}</h3>
                  <div className="flex text-[#FFC107] text-sm">
                    {[...Array(Math.floor(testimonial.rating))].map((_, i) => (
                      <Star key={i} className="fill-current h-4 w-4" />
                    ))}
                    {testimonial.rating % 1 !== 0 && (
                      <StarHalf className="fill-current h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>
              <p className="testimonial text-[#424242] dark:text-gray-300 transition-colors duration-300">
                "{testimonial.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
