
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-blue-100 to-pink-100 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Never Miss a Certification
            <span className="block">Deadline Again</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed max-w-3xl mx-auto">
            For blue-collar workers and small businesses that need to keep licenses and certifications up to date — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg rounded-xl font-medium uppercase tracking-wide"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg rounded-xl border-purple-300 text-purple-700 hover:bg-purple-50 font-medium uppercase tracking-wide"
            >
              <Play className="mr-2 h-5 w-5" />
              See How It Works
            </Button>
          </div>

          {/* Trust Indicator */}
          <div className="text-sm text-gray-600 mb-16">
            ✓ No credit card required • ✓ Free for individuals • ✓ 14-day team trial
          </div>

          {/* Trust Logos */}
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="w-20 h-8 bg-gray-300 rounded"></div>
            <div className="w-20 h-8 bg-gray-300 rounded"></div>
            <div className="w-20 h-8 bg-gray-300 rounded"></div>
            <div className="w-20 h-8 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
