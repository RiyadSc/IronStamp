// component.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { getUserCertifications } from '@/lib/certification-service';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type CertificationType = {
  id: string;
  employee_name: string;
  certification_name: string;
  expiration_date: string;
  priority: 'low' | 'medium' | 'high';
  status?: string;
};

export type DayType = {
  day: string;
  classNames: string;
  certifications?: CertificationType[];
  isCurrentMonth: boolean;
  isToday: boolean;
};

interface DayProps {
  classNames: string;
  day: DayType;
  onHover: (day: string | null) => void;
}

const Day: React.FC<DayProps> = ({ classNames, day, onHover }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  const getExpiringSoonCount = () => {
    if (!day.certifications) return 0;
    const today = new Date();
    return day.certifications.filter(cert => {
      const expDate = new Date(cert.expiration_date);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays >= 0;
    }).length;
  };

  const getExpiredCount = () => {
    if (!day.certifications) return 0;
    const today = new Date();
    return day.certifications.filter(cert => {
      const expDate = new Date(cert.expiration_date);
      return expDate < today;
    }).length;
  };

  const expiringSoonCount = getExpiringSoonCount();
  const expiredCount = getExpiredCount();
  const totalCount = day.certifications?.length || 0;

  return (
    <>
      <motion.div
        className={`relative flex items-center justify-center py-1 ${classNames}`}
        style={{ height: '4rem', borderRadius: 16 }}
        onMouseEnter={() => {
          setIsHovered(true);
          onHover(day.day);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onHover(null);
        }}
        id={`day-${day.day}`}
      >
        <motion.div className="flex flex-col items-center justify-center">
          {day.isCurrentMonth && (
            <span className={`text-sm ${day.isToday ? 'font-bold text-blue-600' : 'text-gray-900'}`}>
              {day.day}
            </span>
          )}
        </motion.div>
        
        {day.certifications && day.certifications.length > 0 && (
          <motion.div
            className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full p-1 text-[10px] font-bold text-white"
            layoutId={`day-${day.day}-cert-count`}
            style={{
              borderRadius: 999,
              backgroundColor: '#3b82f6'
            }}
          >
            {totalCount}
          </motion.div>
        )}

        <AnimatePresence>
          {day.certifications && isHovered && (
            <div className="absolute inset-0 flex size-full items-center justify-center">
              <motion.div
                className="flex size-10 items-center justify-center p-1 text-xs font-bold text-white"
                layoutId={`day-${day.day}-cert-count`}
                style={{
                  borderRadius: 999,
                  backgroundColor: '#3b82f6'
                }}
              >
                {totalCount}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

const CalendarGrid: React.FC<{ 
  onHover: (day: string | null) => void;
  currentDate: Date;
  certifications: CertificationType[];
}> = ({ onHover, currentDate, certifications }) => {
  const generateCalendarDays = (date: Date): DayType[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Get total days in month
    const daysInMonth = lastDay.getDate();
    
    // Get today's date
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    
    const days: DayType[] = [];
    
    // Add empty days for previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      const dayNumber = prevMonthLastDay - firstDayOfWeek + i + 1;
      days.push({
        day: dayNumber.toString(),
        classNames: 'bg-gray-100',
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      const dayStr = day.toString().padStart(2, '0');
      const dateStr = currentDay.toISOString().split('T')[0];
      
      // Filter certifications for this date
      const dayCertifications = certifications.filter(cert => 
        cert.expiration_date === dateStr
      );
      
      const isToday = isCurrentMonth && day === today.getDate();
      
      days.push({
        day: dayStr,
        classNames: dayCertifications.length > 0 
          ? 'bg-white border border-gray-200 cursor-pointer hover:bg-blue-50' 
          : 'bg-white border border-gray-200',
        certifications: dayCertifications.length > 0 ? dayCertifications : undefined,
        isCurrentMonth: true,
        isToday
      });
    }
    
    // Add empty days for next month to complete the grid
    const totalDaysInGrid = 42; // 6 rows * 7 days
    const remainingDays = totalDaysInGrid - days.length;
    
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day: day.toString(),
        classNames: 'bg-gray-100',
        isCurrentMonth: false,
        isToday: false
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays(currentDate);

  return (
    <div className="grid grid-cols-7 gap-2">
      {calendarDays.map((day, index) => (
        <Day
          key={`${day.day}-${index}`}
          classNames={day.classNames}
          day={day}
          onHover={onHover}
        />
      ))}
    </div>
  );
};

const InteractiveCalendar = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'>
>(({ className, ...props }, ref) => {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [certifications, setCertifications] = useState<CertificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchCertifications = async () => {
      try {
        setLoading(true);
        const data = await getUserCertifications();
        setCertifications(data || []);
      } catch (error) {
        console.error('Error fetching certifications:', error);
        setCertifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCertifications();
  }, []);

  // Sync selected month/year with current date when navigating
  useEffect(() => {
    setSelectedMonth(currentDate.getMonth());
    setSelectedYear(currentDate.getFullYear());
  }, [currentDate]);

  const handleDayHover = (day: string | null) => {
    setHoveredDay(day);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleMonthYearSelect = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1);
    setCurrentDate(newDate);
    setIsMonthSelectorOpen(false);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Generate array of months
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate array of years (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const sortedCertifications = React.useMemo(() => {
    if (!hoveredDay) return [];
    
    const dayCertifications = certifications.filter(cert => {
      const certDate = new Date(cert.expiration_date);
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(hoveredDay));
      const certDateStr = certDate.toISOString().split('T')[0];
      const dayDateStr = dayDate.toISOString().split('T')[0];
      return certDateStr === dayDateStr;
    });
    
    return dayCertifications.sort((a, b) => {
      const aDate = new Date(a.expiration_date);
      const bDate = new Date(b.expiration_date);
      return aDate.getTime() - bDate.getTime();
    });
  }, [hoveredDay, certifications, currentDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center animate-spin">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={ref}
        className="relative mx-auto flex w-full flex-col items-start justify-start gap-8 lg:flex-row"
        {...props}
      >
        <motion.div layout className="w-full max-w-lg">
          <motion.div
            key="calendar-view"
            className="flex w-full flex-col gap-4"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <motion.h2 className="text-2xl font-bold tracking-wider text-gray-900">
                  {formatMonthYear(currentDate)}
                </motion.h2>
                <motion.button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
              <Popover open={isMonthSelectorOpen} onOpenChange={setIsMonthSelectorOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                    <Calendar className="w-5 h-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Select Month
                      </label>
                      <Select 
                        value={selectedMonth.toString()} 
                        onValueChange={(value) => setSelectedMonth(parseInt(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map((month, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Select Year
                      </label>
                      <Select 
                        value={selectedYear.toString()} 
                        onValueChange={(value) => setSelectedYear(parseInt(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleMonthYearSelect} 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Go to {months[selectedMonth]} {selectedYear}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="px-0/5 rounded-xl bg-gray-200 py-1 text-center text-xs text-gray-700"
                >
                  {day}
                </div>
              ))}
            </div>
            
            <CalendarGrid 
              onHover={handleDayHover} 
              currentDate={currentDate}
              certifications={certifications}
            />
          </motion.div>
        </motion.div>
        
        <motion.div
          className="w-full max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            key="more-view"
            className="flex w-full flex-col gap-4"
          >
            <div className="flex w-full flex-col items-start justify-between">
              <motion.h2 className="mb-2 text-4xl font-bold tracking-wider text-blue-600">
                Expiring Certifications
              </motion.h2>
              <p className="font-medium text-gray-600">
                View certifications expiring on {hoveredDay ? `day ${hoveredDay}` : 'selected dates'}
              </p>
            </div>
            
            <motion.div
              className="flex h-[620px] flex-col items-start justify-start overflow-hidden overflow-y-scroll rounded-xl border-2 border-gray-200 shadow-md"
              layout
            >
              <AnimatePresence>
                {sortedCertifications.length > 0 ? (
                  sortedCertifications.map((cert, index) => (
                    <motion.div
                      key={cert.id}
                      className="w-full border-b-2 border-gray-200 py-0 last:border-b-0"
                      layout
                    >
                      <motion.div
                        className="border-b border-gray-100 p-3 last:border-b-0"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                          duration: 0.2,
                          delay: index * 0.05,
                        }}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {new Date(cert.expiration_date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (() => {
                              const today = new Date();
                              const expDate = new Date(cert.expiration_date);
                              const diffTime = expDate.getTime() - today.getTime();
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              
                              if (diffDays < 0) return 'bg-red-100 text-red-800'; // Expired
                              if (diffDays <= 30) return 'bg-yellow-100 text-yellow-800'; // Expiring soon
                              return 'bg-green-100 text-green-800'; // Active
                            })()
                          }`}>
                            {(() => {
                              const today = new Date();
                              const expDate = new Date(cert.expiration_date);
                              const diffTime = expDate.getTime() - today.getTime();
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              
                              if (diffDays < 0) return 'Expired';
                              if (diffDays <= 30) return 'Expiring soon';
                              return 'Active';
                            })()}
                          </span>
                        </div>
                        <h3 className="mb-1 text-lg font-semibold text-gray-900">
                          {cert.certification_name}
                        </h3>
                        <p className="mb-1 text-sm text-gray-500">
                          {cert.employee_name}
                        </p>
                                                  <div className="flex items-center text-blue-500">
                            <Clock className="mr-1 h-4 w-4" />
                            <span className="text-sm">
                              Expires: {new Date(cert.expiration_date).toLocaleDateString()}
                              {(() => {
                                const today = new Date();
                                const expDate = new Date(cert.expiration_date);
                                const diffTime = expDate.getTime() - today.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays > 0) {
                                  return ` (${diffDays} day${diffDays === 1 ? '' : 's'} left)`;
                                } else if (diffDays === 0) {
                                  return ' (Expires today)';
                                } else {
                                  return ` (${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago)`;
                                }
                              })()}
                            </span>
                          </div>
                      </motion.div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    className="flex items-center justify-center h-32 text-gray-500 px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {hoveredDay ? 'No certifications expiring on this date' : 'Hover over a date to see certifications'}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});
InteractiveCalendar.displayName = 'InteractiveCalendar';

export default InteractiveCalendar;

const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Demo component that wraps the InteractiveCalendar
const InteractiveCalendarDemo = () => {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start bg-gray-50 px-4 py-10 md:justify-center">
      <InteractiveCalendar />
    </main>
  );
};

export { InteractiveCalendarDemo as DemoOne }; 