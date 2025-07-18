import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth, formatDistanceToNow } from "date-fns";
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin, User, Calendar as CalendarIcon, Megaphone, Hash, Images, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import EventForm from "@/components/event-form";
import PhotoCarousel from "@/components/photo-carousel";
import GuestAccessRequestForm from "@/components/guest-access-request-form";
import FoodSignupDialog from "@/components/food-signup-dialog";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Event, Message } from "@shared/schema";

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [isFoodSignupOpen, setIsFoodSignupOpen] = useState(false);
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const { data: events = [], isLoading, error: eventsError } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    retry: false,
  });

  const { data: announcements = [], isLoading: announcementsLoading, error: announcementsError } = useQuery<Message[]>({
    queryKey: ["/api/messages/recent-announcements"],
    retry: false,
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      return await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success!",
        description: "Event deleted successfully.",
      });
      setIsEventDetailOpen(false);
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for calendar grid
  const startPadding = Array.from({ length: monthStart.getDay() }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (monthStart.getDay() - i));
    return date;
  });

  const endPadding = Array.from({ length: 6 - monthEnd.getDay() }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + (i + 1));
    return date;
  });

  const calendarDays = [...startPadding, ...daysInMonth, ...endPadding];

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.startDate), day));
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getEventColor = (category: string) => {
    switch (category) {
      case "games":
        return "bg-navy text-white";
      case "team-events":
        return "bg-columbia text-white";
      case "practice":
        return "bg-wave text-white";
      case "training":
        return "bg-emerald-600 text-white";
      case "team-meetings":
        return "bg-purple-600 text-white";
      case "award-ceremonies":
        return "bg-amber-600 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  const upcomingEvents = events
    .filter(event => new Date(event.startDate) >= new Date())
    .slice(0, 3);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case "games":
        return "Game";
      case "team-events":
        return "Team Event";
      case "practice":
        return "Practice";
      case "training":
        return "Training";
      case "team-meetings":
        return "Team Meeting";
      case "award-ceremonies":
        return "Award Ceremony";
      default:
        return "Event";
    }
  };

  const getAuthorName = (userId: string | null) => {
    if (!userId) return 'Unknown';
    // Map known user IDs to display names
    switch (userId) {
      case '44503831':
        return 'Rob Nelson';
      case '44695004':
        return 'Tides Admin';
      default:
        return 'Team Member';
    }
  };

  const handleDeleteEvent = () => {
    if (selectedEvent && window.confirm(`Are you sure you want to delete the event "${selectedEvent.title}"? This action cannot be undone.`)) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
  };

  // Check for permission errors
  const isEventsBlocked = eventsError && (eventsError.message.includes('403') || eventsError.message.includes('Insufficient permissions'));
  const isAnnouncementsBlocked = announcementsError && (announcementsError.message.includes('403') || announcementsError.message.includes('Insufficient permissions'));

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show permission denied message for guests with access request form
  if (isEventsBlocked) {
    return <GuestAccessRequestForm />;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="gradient-navy-columbia p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Tide Calendar</h2>
            <p className="text-blue-100">Navigate your team events</p>
          </div>
          {hasPermission('canCreateEvents') && (
            <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <EventForm onSuccess={() => setIsEventFormOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Calendar Controls */}
        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth("prev")}
              className="hover:bg-white/20 text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-xl font-semibold">
              {format(currentDate, "MMMM yyyy")}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth("next")}
              className="hover:bg-white/20 text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30">
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Team Photos Carousel */}
      <div className="border-t border-white/20 p-6 bg-gradient-to-r from-blue-50 to-blue-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Images className="w-5 h-5 text-columbia" />
          Team Memories
        </h3>
        <PhotoCarousel className="w-full max-w-md mx-auto" />
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center py-2 text-sm font-medium text-slate-600">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);

            return (
              <div
                key={index}
                className={`h-24 p-1 border rounded hover:bg-slate-50 cursor-pointer transition-colors ${
                  isDayToday
                    ? "border-2 border-columbia bg-columbia/10"
                    : "border-slate-200"
                } ${!isCurrentMonth ? "text-slate-400" : ""}`}
              >
                <span
                  className={`text-sm font-medium ${
                    isDayToday ? "text-columbia font-bold" : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs px-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${getEventColor(event.category)}`}
                      title={event.title}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-slate-500">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events Panel */}
      <div className="border-t border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Upcoming Events</h3>
        <div className="space-y-3">
          {upcomingEvents.length === 0 ? (
            <p className="text-slate-500">No upcoming events scheduled.</p>
          ) : (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                onClick={() => handleEventClick(event)}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getEventColor(event.category)}`}>
                  <i className={`fas fa-${
                    event.category === "sports" ? "basketball-ball" :
                    event.category === "social" ? "music" :
                    event.category === "academic" ? "book" : "calendar"
                  } text-white`}></i>
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800">{event.title}</h4>
                  <p className="text-sm text-slate-600">
                    {format(new Date(event.startDate), "MMM d, h:mm a")}
                    {event.location && ` • ${event.location}`}
                    {event.scheduleFood === "true" && " • 🍽️ Food Scheduled"}
                  </p>
                  {event.createdBy && (
                    <p className="text-xs text-slate-500">
                      by {getAuthorName(event.createdBy)}
                    </p>
                  )}
                </div>
                <i className="fas fa-chevron-right text-slate-400"></i>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Announcements Panel */}
      <div className="border-t border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-columbia" />
          Recent Announcements
        </h3>
        <div className="space-y-3">
          {announcementsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-200 rounded-lg h-16"></div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <p className="text-slate-500">No recent announcements found.</p>
          ) : (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-columbia text-white flex items-center justify-center text-sm font-medium">
                    {announcement.authorInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-800">
                        {announcement.authorName}
                      </span>
                      <Hash className="w-3 h-3 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">announcements</span>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 break-words">
                      {announcement.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-columbia" />
                  {selectedEvent?.title}
                </DialogTitle>
                <DialogDescription>
                  Event Details
                </DialogDescription>
              </div>
              {hasPermission('canDeleteEvents') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteEvent}
                  disabled={deleteEventMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              {/* Event Category */}
              <div className="flex items-center gap-2">
                <Badge className={getEventColor(selectedEvent.category)}>
                  {getCategoryDisplayName(selectedEvent.category)}
                </Badge>
              </div>

              {/* Event Description */}
              {selectedEvent.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>
              )}

              {/* Date and Time */}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Date & Time</h4>
                  <p className="text-gray-600">
                    {format(new Date(selectedEvent.startDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                    {selectedEvent.endDate && (
                      <span> - {format(new Date(selectedEvent.endDate), "h:mm a")}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Location */}
              {selectedEvent.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Location</h4>
                    <p className="text-gray-600">{selectedEvent.location}</p>
                  </div>
                </div>
              )}

              {/* Schedule Food Status */}
              {selectedEvent.scheduleFood === "true" && (
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 text-green-500 mt-0.5">🍽️</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Food Scheduled</h4>
                    <p className="text-gray-600">
                      Food has been scheduled for this event
                      {selectedEvent.mealCoordinatorName && (
                        <>
                          <br />
                          <span className="text-sm font-medium">Meal Coordinator:</span> {selectedEvent.mealCoordinatorName}
                          {selectedEvent.mealCoordinatorEmail && (
                            <>
                              <br />
                              <span className="text-sm font-medium">Email:</span> {selectedEvent.mealCoordinatorEmail}
                            </>
                          )}
                          {selectedEvent.mealCoordinatorPhone && (
                            <>
                              <br />
                              <span className="text-sm font-medium">Phone:</span> {selectedEvent.mealCoordinatorPhone}
                            </>
                          )}
                          {selectedEvent.mealCoordinatorLocation && (
                            <>
                              <br />
                              <span className="text-sm font-medium">Location:</span> {selectedEvent.mealCoordinatorLocation}
                            </>
                          )}
                          {selectedEvent.mealCoordinatorAddress && (
                            <>
                              <br />
                              <span className="text-sm font-medium">Address:</span> {selectedEvent.mealCoordinatorAddress}
                            </>
                          )}
                        </>
                      )}
                    </p>
                    
                    {/* Food Signup Button */}
                    {hasPermission('canViewEvents') && (
                      <Button
                        onClick={() => setIsFoodSignupOpen(true)}
                        className="mt-3 gradient-navy-columbia text-white"
                        size="sm"
                      >
                        Signup to Provide Food
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Created By */}
              {selectedEvent.createdBy && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Created By</h4>
                    <p className="text-gray-600">
                      {getAuthorName(selectedEvent.createdBy)}
                    </p>
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="text-sm text-gray-500 pt-2 border-t">
                Created {format(new Date(selectedEvent.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Food Signup Dialog */}
      {selectedEvent && (
        <FoodSignupDialog
          open={isFoodSignupOpen}
          onOpenChange={setIsFoodSignupOpen}
          eventId={selectedEvent.id}
          eventTitle={selectedEvent.title}
          mealCoordinatorName={selectedEvent.mealCoordinatorName || undefined}
          mealCoordinatorEmail={selectedEvent.mealCoordinatorEmail || undefined}
          mealCoordinatorPhone={selectedEvent.mealCoordinatorPhone || undefined}
          mealCoordinatorLocation={selectedEvent.mealCoordinatorLocation || undefined}
          mealCoordinatorAddress={selectedEvent.mealCoordinatorAddress || undefined}
          initialNotes={selectedEvent.foodCoordinationNotes || undefined}
        />
      )}
    </div>
  );
}
