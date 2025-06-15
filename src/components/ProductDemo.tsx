
import { Play, Calendar, FileText, Users } from "lucide-react";

const ProductDemo = () => {
  return (
    <section id="demo" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            See CertKeeper in Action
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Watch how easy it is to upload, track, and manage all your certifications.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Video/Demo Area */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
              <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
                    <Play className="h-10 w-10 text-white ml-1" />
                  </div>
                  <p className="text-slate-700 font-medium">Interactive Demo</p>
                  <p className="text-sm text-slate-500">No signup required</p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features List */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Upload in Seconds
                </h3>
                <p className="text-slate-600">
                  Drag and drop certificates, or snap photos with your phone. AI automatically extracts expiration dates.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Smart Tracking
                </h3>
                <p className="text-slate-600">
                  Visual dashboard shows what's expiring soon, what needs renewal, and what's up to date.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Team Visibility
                </h3>
                <p className="text-slate-600">
                  Managers see compliance status across the entire team. Workers access only their own certifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDemo;
