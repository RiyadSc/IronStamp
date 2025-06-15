
import { X, Check } from "lucide-react";

const PainSolution = () => {
  const painPoints = [
    "Tracking certs in Excel spreadsheets",
    "Missing expiration dates",
    "Scrambling during audits",
    "Lost paperwork and documents",
    "No team visibility on compliance status"
  ];

  const solutions = [
    "Auto reminders before any license expires",
    "Secure cloud storage accessible anywhere",
    "Team dashboard with role-based access",
    "Digital document management",
    "Real-time compliance reporting"
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Stop Playing Certification Roulette
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Are you still managing critical certifications the old way? It's time for a better approach.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Pain Points */}
          <div className="space-y-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">The Old Way (Risky)</h3>
            </div>
            <div className="space-y-4">
              {painPoints.map((pain, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <X className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="text-slate-700">{pain}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Solutions */}
          <div className="space-y-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">The CertKeeper Way (Smart)</h3>
            </div>
            <div className="space-y-4">
              {solutions.map((solution, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-slate-700">{solution}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainSolution;
