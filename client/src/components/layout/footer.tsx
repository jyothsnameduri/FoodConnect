import { Link } from "wouter";
import { Sprout } from "lucide-react";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="bg-[#424242] text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="text-3xl">
                <Sprout className="h-8 w-8" />
              </div>
              <span className="font-montserrat font-bold text-xl">FoodShare</span>
            </div>
            <p className="font-opensans text-[#E0E0E0] mb-4">
              Reducing food waste, building community
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-[#4CAF50] transition-colors" aria-label="Facebook">
                <FaFacebookF className="h-5 w-5" />
              </a>
              <a href="#" className="text-white hover:text-[#4CAF50] transition-colors" aria-label="Twitter">
                <FaTwitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-white hover:text-[#4CAF50] transition-colors" aria-label="Instagram">
                <FaInstagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-montserrat font-semibold text-lg mb-4">About</h3>
            <ul className="space-y-2">
              <li><Link href="/mission" className="text-[#E0E0E0] hover:text-white transition-colors">Our Mission</Link></li>
              <li><Link href="/how-it-works" className="text-[#E0E0E0] hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/safety" className="text-[#E0E0E0] hover:text-white transition-colors">Safety Guide</Link></li>
              <li><Link href="/business" className="text-[#E0E0E0] hover:text-white transition-colors">For Businesses</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-montserrat font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-[#E0E0E0] hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/faq" className="text-[#E0E0E0] hover:text-white transition-colors">FAQs</Link></li>
              <li><Link href="/guidelines" className="text-[#E0E0E0] hover:text-white transition-colors">Community Guidelines</Link></li>
              <li><Link href="/report" className="text-[#E0E0E0] hover:text-white transition-colors">Report a Problem</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-montserrat font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-[#E0E0E0] hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-[#E0E0E0] hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="text-[#E0E0E0] hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link href="/accessibility" className="text-[#E0E0E0] hover:text-white transition-colors">Accessibility</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-[#9E9E9E]/30 mt-8 pt-8 text-center text-[#E0E0E0]">
          <p>&copy; {new Date().getFullYear()} FoodShare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
