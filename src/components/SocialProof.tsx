
import { Shield, Users, Award, Truck } from "lucide-react";

const SocialProof = () => {
  const industries = [
    { name: "Electricians", icon: Shield },
    { name: "HVAC Professionals", icon: Users },
    { name: "Healthcare Workers", icon: Award },
    { name: "Trucking Companies", icon: Truck },
  ];

  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-slate-600 font-medium mb-8">
            Trusted by professionals across industries
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {industries.map((industry, index) => {
              const IconComponent = industry.icon;
              return (
                <div key={index} className="flex flex-col items-center p-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                    <IconComponent className="h-6 w-6 text-slate-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{industry.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testimonial */}
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-lg text-slate-700 italic mb-6">
            "CertKeeper saved us from a $15,000 fine when we almost missed our safety certification renewal. Now our whole team stays compliant automatically."
          </blockquote>
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-slate-300 rounded-full mr-4"></div>
            <div className="text-left">
              <p className="font-medium text-slate-900">Mike Rodriguez</p>
              <p className="text-sm text-slate-600">Safety Manager, ABC Construction</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
