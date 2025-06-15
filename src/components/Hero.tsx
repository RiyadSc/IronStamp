
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Never Miss a Certification
            <span className="text-blue-600"> Deadline Again</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-600 mb-8 leading-relaxed">
            For blue-collar workers and small businesses that need to keep licenses and certifications up to date — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-xl"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <Play className="mr-2 h-5 w-5" />
              See How It Works
            </Button>
          </div>

          {/* Trust Indicator */}
          <div className="text-sm text-slate-500 mb-16">
            ✓ No credit card required • ✓ Free for individuals • ✓ 14-day team trial
          </div>

          {/* Hero Image Placeholder */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
              <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-slate-600 font-medium">Watch CertKeeper in Action</p>
                  <p className="text-sm text-slate-500">2 minute product demo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
