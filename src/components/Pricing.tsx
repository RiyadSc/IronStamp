
import { Button } from "@/components/ui/button";
import { Check, Users, Building } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Individual",
      price: "Free",
      description: "Perfect for solo professionals",
      icon: Users,
      features: [
        "Up to 10 certifications",
        "Email reminders",
        "Mobile app access",
        "Basic document storage",
        "Export your data"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Team",
      price: "$12",
      period: "/user/month",
      description: "For small to medium teams",
      icon: Building,
      features: [
        "Unlimited certifications",
        "Team dashboard",
        "Role-based access",
        "SMS & email alerts",
        "Compliance reports",
        "Priority support",
        "Advanced exports"
      ],
      cta: "Start 14-Day Trial",
      popular: true
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Start free as an individual. Scale up when your team grows.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <div 
                key={index} 
                className={`relative p-8 rounded-2xl border-2 ${
                  plan.popular 
                    ? 'border-blue-500 shadow-xl' 
                    : 'border-slate-200 hover:border-slate-300'
                } transition-all duration-200`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-6 w-6 text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-slate-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    {plan.period && (
                      <span className="text-slate-600 ml-1">{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full py-3 rounded-xl ${
                    plan.popular 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600 mb-4">Need a custom plan for larger organizations?</p>
          <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
