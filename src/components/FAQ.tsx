
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

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
    },
    {
      question: "What file formats are supported?",
      answer: "We support all common formats including PDF, JPG, PNG, DOC, DOCX, and more. You can also take photos with your phone and our AI will automatically extract expiration dates."
    },
    {
      question: "How do reminders work?",
      answer: "You'll receive automatic notifications via email and SMS (team plans) at 90, 60, 30, and 7 days before expiration. You can customize these timing and preferences in your settings."
    },
    {
      question: "Can I try before I buy?",
      answer: "Yes! Individual use is completely free forever. Team plans include a 14-day free trial with full access to all features. No credit card required to start."
    },
    {
      question: "What happens if I cancel?",
      answer: "You can cancel anytime with no fees. Your data remains accessible for 30 days after cancellation, giving you time to export everything if needed."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-slate-600">
            Everything you need to know about CertKeeper
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white border border-slate-200 rounded-xl px-6"
            >
              <AccordionTrigger className="text-left font-semibold text-slate-900 hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-6">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12">
          <p className="text-slate-600 mb-4">Still have questions?</p>
          <div className="space-x-4">
            <a href="mailto:support@certkeeper.com" className="text-blue-600 hover:text-blue-700 font-medium">
              Email Support
            </a>
            <span className="text-slate-300">•</span>
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Live Chat
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
