
import { Calendar, FolderOpen, Users, Bell, Shield, Download } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Calendar,
      title: "Expiration Reminders",
      description: "Get notified 90, 60, 30, and 7 days before any license expires. Never miss a deadline again.",
      accentColor: "bg-red-500"
    },
    {
      icon: FolderOpen,
      title: "Secure Storage",
      description: "Upload and access certificates from any device. Bank-level encryption keeps your documents safe.",
      accentColor: "bg-blue-500"
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Give managers and workers role-based access. See who's compliant at a glance.",
      accentColor: "bg-orange-500"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Email, SMS, and in-app alerts ensure critical renewals never slip through the cracks.",
      accentColor: "bg-purple-500"
    },
    {
      icon: Shield,
      title: "Compliance Reports",
      description: "Generate audit-ready reports in seconds. Prove compliance to regulators instantly.",
      accentColor: "bg-green-500"
    },
    {
      icon: Download,
      title: "Data Export",
      description: "Your data stays yours. Export everything anytime in multiple formats.",
      accentColor: "bg-indigo-500"
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Stay Compliant
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple tools that work for individuals, teams, and entire organizations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="text-center p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200">
                <div className={`w-16 h-16 ${feature.accentColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <IconComponent className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
