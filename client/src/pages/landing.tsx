import { useEffect, useState } from "react";
import { Anchor, Calendar, MessageCircle, Camera, Shield, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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

export default function Landing() {
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetch important dates for all users
  const { data: importantDates = [], isLoading: datesLoading } = useQuery<ImportantDate[]>({
    queryKey: ["/api/important-dates"],
    retry: false, // Don't retry for guest users
  });

  useEffect(() => {
    // Check for authentication error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const authErrorType = urlParams.get('auth_error');
    const errorMessage = urlParams.get('message');
    
    if (authErrorType === 'email_exists' && errorMessage) {
      setAuthError(decodeURIComponent(errorMessage));
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('error')) {
      setAuthError("Authentication failed. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const getCategoryIcon = (category: string) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option?.icon || "📋";
  };

  const getPriorityBadge = (priority: string) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option || priorityOptions[1];
  };

  const isDatePast = (dateStr: string) => {
    const targetDate = new Date(dateStr);
    const now = new Date();
    return targetDate < now;
  };

  // Sort dates: upcoming first (chronological), then past dates at bottom
  const sortedDates = [...importantDates].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    const now = new Date();
    
    const aIsPast = dateA < now;
    const bIsPast = dateB < now;
    
    // If one is past and one is future, future comes first
    if (aIsPast && !bIsPast) return 1;
    if (!aIsPast && bIsPast) return -1;
    
    // Both are past or both are future, sort chronologically
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="https://files.smartsites.parentsquare.com/5437/header_logo_img_26xxd1.png" 
                alt="Gig Harbor High School Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-navy">Tides Hub</h1>
                <p className="text-xs text-slate-600">Gig Harbor High School Water Polo</p>
              </div>
            </div>
            <Button 
              onClick={() => window.location.href = "/api/login"} 
              className="bg-columbia hover:bg-columbia/90 text-white"
            >
              Sign In
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Authentication Error Alert */}
        {authError && (
          <div className="mb-8 max-w-2xl mx-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {authError}
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Tides Hub
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The official platform for Gig Harbor High School Tides Girls Water Polo team. 
            Stay connected with team events, communicate with teammates, and share memories.
          </p>
          <Button 
            onClick={() => window.location.href = "/api/login"} 
            size="lg"
            className="bg-columbia hover:bg-columbia/90 text-white px-8 py-3 text-lg"
          >
            Join the Team Platform
          </Button>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Calendar className="text-navy" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Events</h3>
            <p className="text-gray-600">
              Stay up-to-date with games, practices, team meetings, and award ceremonies.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="text-navy" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tide Talk</h3>
            <p className="text-gray-600">
              Connect with teammates through organized chat channels for different topics.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Camera className="text-navy" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Memories</h3>
            <p className="text-gray-600">
              Share and preserve special moments with photo uploads and team galleries.
            </p>
          </div>
        </div>

        {/* Important Dates Section */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Calendar className="w-12 h-12 text-navy mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Important Dates</h2>
            <p className="text-gray-600">
              Key dates and deadlines for the season
            </p>
          </div>

          {datesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-200 rounded-lg h-20"></div>
              ))}
            </div>
          ) : sortedDates.length > 0 ? (
            <div className="space-y-4">
              {sortedDates.map((date) => {
                const priorityInfo = getPriorityBadge(date.priority);
                const isPast = isDatePast(date.date.toString());
                
                return (
                  <div 
                    key={date.id} 
                    className={`border rounded-lg p-4 shadow-sm transition-all ${
                      isPast 
                        ? "bg-gray-50 border-gray-300 opacity-60" 
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-lg ${isPast ? "grayscale" : ""}`}>
                            {getCategoryIcon(date.category)}
                          </span>
                          <h4 className={`text-lg font-semibold ${
                            isPast ? "text-gray-500" : "text-gray-900"
                          }`}>
                            {date.title}
                          </h4>
                          <Badge className={`${priorityInfo.color} ${
                            isPast ? "opacity-75" : ""
                          }`}>
                            {priorityInfo.label}
                          </Badge>
                          {isPast && (
                            <Badge variant="outline" className="text-gray-500 border-gray-400">
                              Past
                            </Badge>
                          )}
                        </div>
                        
                        {date.description && (
                          <p className={`text-sm mb-2 ${
                            isPast ? "text-gray-400" : "text-gray-600"
                          }`}>
                            {date.description}
                          </p>
                        )}
                        
                        <div className={`text-sm ${
                          isPast ? "text-gray-400" : "text-gray-500"
                        }`}>
                          📅 {format(new Date(date.date), "MMMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No important dates scheduled yet.</p>
            </div>
          )}
        </div>

        {/* Access Levels */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Shield className="w-12 h-12 text-navy mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Secure Team Access</h2>
            <p className="text-gray-600">
              Different access levels ensure appropriate permissions for all team members.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="text-red-600" size={16} />
              </div>
              <h4 className="font-medium text-gray-900">Administrator</h4>
              <p className="text-sm text-gray-600">Full access</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="text-orange-600" size={16} />
              </div>
              <h4 className="font-medium text-gray-900">Editor</h4>
              <p className="text-sm text-gray-600">Create & edit content</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="text-blue-600" size={16} />
              </div>
              <h4 className="font-medium text-gray-900">Contributor</h4>
              <p className="text-sm text-gray-600">Create content</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="text-green-600" size={16} />
              </div>
              <h4 className="font-medium text-gray-900">Viewer</h4>
              <p className="text-sm text-gray-600">View & comment</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="text-gray-600" size={16} />
              </div>
              <h4 className="font-medium text-gray-900">Guest</h4>
              <p className="text-sm text-gray-600">Limited access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center">
            <a
              href="https://www.instagram.com/ghhsgirls_waterpolo/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-slate-600 hover:text-columbia transition-colors duration-200"
            >
              <Camera className="w-5 h-5" />
              <span className="text-sm font-medium">Follow @ghhsgirls_waterpolo</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}