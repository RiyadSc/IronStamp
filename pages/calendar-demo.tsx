import { Sidebar } from "@/components/Sidebar";
import InteractiveCalendar from '@/components/visualize-booking';
import { useAuth } from "@/hooks/useAuth";

export default function CalendarDemoPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center animate-spin">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-4 sm:py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text truncate">
                Certification Calendar
              </h1>
              <p className="text-gray-600 mt-1 text-xs sm:text-sm font-medium">Interactive calendar showing certification expiry dates and counts</p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <InteractiveCalendar />
        </div>
      </main>
    </div>
  );
} 