
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      question: "Is my data secure?",
      answer: "Yes. We use bank-level encryption (AES-256) to protect your documents both in transit and at rest. Your certifications are stored on secure cloud servers with regular backups and 99.9% uptime guarantee."
    },
    {
      question: "Who owns my data?",
      answer: "You do. All uploaded certifications and personal information belong to you. You can export or delete your data at any time. We never sell or share your information with third parties."
    },
    {
      question: "Can I export my data?",
      answer: "Absolutely. You can export all your certifications, documents, and data in multiple formats (PDF, CSV, ZIP) at any time. There are no restrictions or fees for data export."
    },
    {
      question: "Is there a mobile app?",
      answer: "Yes! CertKeeper works perfectly on mobile browsers, and we have native iOS and Android apps coming Q2 2024. You can upload photos of certificates directly from your phone."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about CertKeeper
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - FAQs */}
          <div>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-6"
                >
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Right Column - Final CTA */}
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to take control of your team's compliance?
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Join thousands of professionals who never miss a certification deadline. Start free today.
            </p>
            <div className="space-y-3">
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium uppercase tracking-wide"
              >
                Start Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 px-6 py-3 rounded-xl font-medium uppercase tracking-wide"
              >
                Book a Demo
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <div className="space-x-4">
            <a href="mailto:support@certkeeper.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Email Support
            </a>
            <span className="text-gray-300">•</span>
            <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Live Chat
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
