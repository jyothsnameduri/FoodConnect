import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { Link } from "wouter";

interface FoodItem {
  id: string;
  title: string;
  type: 'donation' | 'request';
  distance: string;
  description: string;
  image: string;
  user: {
    name: string;
    avatar: string;
  }
}

const featuredItems: FoodItem[] = [
  {
    id: '1',
    title: 'Garden Vegetables',
    type: 'donation',
    distance: '0.8 miles away',
    description: 'Fresh tomatoes, lettuce, and carrots from my backyard garden.',
    image: 'https://images.unsplash.com/photo-1592424002053-21f369ad7fdb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80',
    user: {
      name: 'Maria S.',
      avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    }
  },
  {
    id: '2',
    title: 'Homemade Bread',
    type: 'donation',
    distance: '1.2 miles away',
    description: 'Baked too much sourdough bread today. 3 loaves available.',
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80',
    user: {
      name: 'Sarah M.',
      avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    }
  },
  {
    id: '3',
    title: 'Pantry Items',
    type: 'donation',
    distance: '0.5 miles away',
    description: 'Moving soon. Canned goods, pasta, and rice available.',
    image: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80',
    user: {
      name: 'James T.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    }
  },
  {
    id: '4',
    title: 'Vegetable Lasagna',
    type: 'request',
    distance: '1.5 miles away',
    description: 'Looking for any vegetarian meals for family of 4 this weekend.',
    image: 'https://images.unsplash.com/photo-1548940740-204726a19be3?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400&q=80',
    user: {
      name: 'Elena R.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80'
    }
  }
];

export function FeaturedItems() {
  return (
    <section className="py-16 bg-[#F5F5F5] dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#424242] dark:text-white transition-colors duration-300">
            Recently Shared Near You
          </h2>
          <Link href="/items" className="text-[#4CAF50] dark:text-[#7bed9f] font-montserrat font-semibold hover:underline mt-2 md:mt-0 transition-colors duration-300">
            View All <span aria-hidden="true">→</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredItems.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-soft shadow-soft dark:shadow-md overflow-hidden transition-all duration-300 hover:shadow-2xl hover:translate-y-[-5px] group" style={{ pointerEvents: 'none' }}>
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-montserrat font-semibold text-lg dark:text-white transition-colors duration-300">{item.title}</h3>
                  <span 
                    className={`
                      text-xs font-montserrat font-semibold px-2 py-1 rounded-full
                      ${item.type === 'donation' 
                        ? 'bg-[#4CAF50]/10 dark:bg-[#4CAF50]/20 text-[#4CAF50] dark:text-[#7bed9f]' 
                        : 'bg-[#42A5F5]/10 dark:bg-[#42A5F5]/20 text-[#42A5F5] dark:text-[#60a5fa]'}
                      transition-colors duration-300
                    `}
                  >
                    {item.type === 'donation' ? 'Donation' : 'Request'}
                  </span>
                </div>
                <p className="text-[#9E9E9E] dark:text-gray-400 text-sm mt-1 transition-colors duration-300">
                  <MapPin className="inline-block w-3 h-3 mr-1" /> {item.distance}
                </p>
                <p className="font-opensans text-sm mt-2 text-[#424242] dark:text-gray-300 transition-colors duration-300">
                  {item.description}
                </p>
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-[#E0E0E0] dark:bg-gray-700 overflow-hidden transition-colors duration-300">
                      <img 
                        src={item.user.avatar}
                        alt={item.user.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <span className="ml-2 text-sm font-opensans dark:text-gray-300 transition-colors duration-300">{item.user.name}</span>
                  </div>
                  <Button 
                    className={`
                      px-3 py-1 text-sm rounded-soft text-white transition-colors duration-300
                      ${item.type === 'donation' 
                        ? 'bg-[#4CAF50] hover:bg-[#388E3C] dark:bg-[#388E3C] dark:hover:bg-[#4CAF50]' 
                        : 'bg-[#42A5F5] hover:bg-[#1976D2] dark:bg-[#1976D2] dark:hover:bg-[#42A5F5]'}
                    `}
                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                  >
                    {item.type === 'donation' ? 'Claim' : 'Respond'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
