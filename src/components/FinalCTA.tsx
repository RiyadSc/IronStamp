
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";

const FinalCTA = () => {
  return (
    <section className="py-20 bg-blue-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-8">
          <Shield className="h-16 w-16 text-blue-200 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your Team's Compliance?
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Join thousands of professionals who never miss a certification deadline. Start free today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg rounded-xl font-semibold"
          >
            Start Free Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="border-blue-400 text-white hover:bg-blue-700 px-8 py-4 text-lg rounded-xl"
          >
            Book a Demo
          </Button>
        </div>

        <div className="text-blue-200 text-sm">
          ✓ No credit card required • ✓ Set up in under 5 minutes • ✓ Cancel anytime
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
