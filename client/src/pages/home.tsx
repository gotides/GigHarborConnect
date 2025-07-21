import { useState, useEffect } from "react";
import { Anchor, LogOut, User as UserIcon, Shield, Users, AlertTriangle } from "lucide-react";
import { SiInstagram } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";
import CalendarView from "@/components/calendar-view";
import ChatView from "@/components/chat-view";
import PhotosView from "@/components/photos-view";
import ImportantDates from "@/components/important-dates-admin";

type TabType = "calendar" | "chat" | "photos" | "dates";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("calendar");
  const [authError, setAuthError] = useState<string | null>(null);
  const { user } = useAuth();

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

  const tabs = [
    { id: "calendar" as const, label: "Events", icon: "calendar-alt" },
    { id: "chat" as const, label: "Tide Talk", icon: "comments" },
    { id: "photos" as const, label: "Memories", icon: "camera" },
    { id: "dates" as const, label: "Important Dates", icon: "clock" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="https://files.smartsites.parentsquare.com/5437/header_logo_img_26xxd1.png" 
                  alt="Gig Harbor High School Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-navy">Tides Hub</h1>
                <p className="text-xs text-slate-500">Tides Girls Water Polo</p>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="hidden md:flex space-x-1 bg-slate-100 rounded-lg p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-btn px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id ? "active" : ""
                  }`}
                >
                  <i className={`fas fa-${tab.icon} mr-2`}></i>
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {user.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-columbia rounded-full flex items-center justify-center">
                        <UserIcon size={16} className="text-white" />
                      </div>
                    )}
                    <div className="text-sm hidden md:block">
                      <p className="text-navy font-medium">
                        {user.firstName || user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.role === "Administrator" && (
                      <Link href="/admin">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-navy"
                          title="Admin Panel"
                        >
                          <Shield size={16} />
                        </Button>
                      </Link>
                    )}
                    {["Administrator", "Editor", "Contributor"].includes(user.role || "") && (
                      <Link href="/profiles">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-navy"
                          title="Team Profiles"
                        >
                          <Users size={16} />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = "/api/logout"}
                      className="text-slate-600 hover:text-navy"
                    >
                      <LogOut size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden flex space-x-1 bg-slate-100 rounded-lg p-1 mb-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id ? "active" : ""
                }`}
              >
                <i className={`fas fa-${tab.icon}`}></i>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Authentication Error Alert */}
        {authError && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {authError}
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {activeTab === "calendar" && <CalendarView />}
        {activeTab === "chat" && <ChatView />}
        {activeTab === "photos" && <PhotosView />}
        {activeTab === "dates" && <ImportantDates />}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center">
            <a
              href="https://www.instagram.com/ghhsgirls_waterpolo/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-slate-600 hover:text-columbia transition-colors duration-200"
            >
              <SiInstagram className="w-6 h-6" />
              <span className="text-sm font-medium">Follow @ghhsgirls_waterpolo</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
