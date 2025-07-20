import { useQuery } from "@tanstack/react-query";
import { format, isAfter, isBefore, addDays, parseISO } from "date-fns";
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ImportantDate } from "@shared/schema";

const categoryOptions = [
  { value: "season", label: "Season", icon: "🏊‍♀️" },
  { value: "competition", label: "Competition", icon: "🏆" },
  { value: "equipment", label: "Equipment", icon: "🥽" },
  { value: "meeting", label: "Meeting", icon: "👥" },
  { value: "team", label: "Team", icon: "🤝" },
  { value: "general", label: "General", icon: "📋" },
];

const priorityOptions = [
  { value: "high", label: "High Priority", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "normal", label: "Normal", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "low", label: "Low Priority", color: "bg-gray-100 text-gray-800 border-gray-200" },
];

export default function ImportantDates() {
  const { data: importantDates = [], isLoading, error } = useQuery<ImportantDate[]>({
    queryKey: ["/api/important-dates"],
    retry: false,
  });

  const getCategoryIcon = (category: string) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option?.icon || "📋";
  };

  const getPriorityBadge = (priority: string) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option || priorityOptions[1];
  };

  const getDateStatus = (dateStr: string) => {
    const targetDate = new Date(dateStr);
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);
    
    if (isBefore(targetDate, now)) {
      return { status: "past", icon: CheckCircle, color: "text-gray-500" };
    } else if (isBefore(targetDate, sevenDaysFromNow)) {
      return { status: "upcoming", icon: AlertTriangle, color: "text-orange-500" };
    } else {
      return { status: "future", icon: Clock, color: "text-blue-500" };
    }
  };

  // Group dates by status
  const groupedDates = {
    upcoming: importantDates.filter(date => {
      const targetDate = new Date(date.date);
      const now = new Date();
      const sevenDaysFromNow = addDays(now, 7);
      return isAfter(targetDate, now) && isBefore(targetDate, sevenDaysFromNow);
    }),
    future: importantDates.filter(date => {
      const targetDate = new Date(date.date);
      const sevenDaysFromNow = addDays(new Date(), 7);
      return isAfter(targetDate, sevenDaysFromNow);
    }),
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-200 rounded-lg h-20"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load important dates. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy">Important Dates</h2>
        <p className="text-slate-600 mt-1">Key dates and deadlines for the team</p>
      </div>

      {/* Dates List */}
      <div className="space-y-6">
        {/* Upcoming Dates (Next 7 Days) */}
        {groupedDates.upcoming.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-orange-600 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Upcoming (Next 7 Days)
            </h3>
            <div className="space-y-3">
              {groupedDates.upcoming.map((date) => {
                const statusInfo = getDateStatus(date.date);
                const priorityInfo = getPriorityBadge(date.priority);
                
                return (
                  <div key={date.id} className="bg-white border border-orange-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg">{getCategoryIcon(date.category)}</span>
                          <h4 className="text-lg font-semibold text-gray-900">{date.title}</h4>
                          <Badge className={priorityInfo.color}>
                            {priorityInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span>{format(parseISO(date.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
                          <statusInfo.icon className={`w-4 h-4 ${statusInfo.color}`} />
                        </div>
                        {date.description && (
                          <p className="text-gray-700 text-sm">{date.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Future Dates */}
        {groupedDates.future.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-blue-600 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Future Dates
            </h3>
            <div className="space-y-3">
              {groupedDates.future.map((date) => {
                const statusInfo = getDateStatus(date.date);
                const priorityInfo = getPriorityBadge(date.priority);
                
                return (
                  <div key={date.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg">{getCategoryIcon(date.category)}</span>
                          <h4 className="text-lg font-semibold text-gray-900">{date.title}</h4>
                          <Badge className={priorityInfo.color}>
                            {priorityInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span>{format(parseISO(date.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
                          <statusInfo.icon className={`w-4 h-4 ${statusInfo.color}`} />
                        </div>
                        {date.description && (
                          <p className="text-gray-700 text-sm">{date.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {groupedDates.upcoming.length === 0 && groupedDates.future.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Important Dates</h3>
            <p className="text-gray-500 mb-4">
              No important dates have been added yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}