import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Is FoodShare completely free to use?',
    answer: 'Yes, FoodShare is completely free for all users. We\'re a community-focused platform committed to reducing food waste and connecting neighbors.'
  },
  {
    id: 'faq-2',
    question: 'How does FoodShare ensure food safety?',
    answer: 'While we provide guidelines for safe food sharing, users are responsible for ensuring the food they share is safe and properly handled. We recommend only accepting food you feel comfortable with and checking expiration dates.'
  },
  {
    id: 'faq-3',
    question: 'Can businesses participate in FoodShare?',
    answer: 'Absolutely! We welcome restaurants, cafes, grocery stores, and other food businesses to share their surplus food with the community. We have special features for business accounts.'
  },
  {
    id: 'faq-4',
    question: 'How are pickups and deliveries arranged?',
    answer: 'Once you claim an item or someone claims your item, you\'ll be connected through our messaging system to arrange pickup or delivery details. Users coordinate directly with each other.'
  }
];

export function FAQ() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-montserrat font-bold text-2xl md:text-3xl text-[#424242] dark:text-white mb-4 transition-colors duration-300">Frequently Asked Questions</h2>
          <p className="font-opensans text-[#424242] dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
            Got questions? We've got answers.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-b border-[#E0E0E0] dark:border-gray-700 transition-colors duration-300">
                <AccordionTrigger className="font-montserrat font-semibold text-lg py-4 px-2 text-left hover:no-underline dark:text-white transition-colors duration-300">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 px-2 font-opensans text-[#424242] dark:text-gray-300 transition-colors duration-300">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
