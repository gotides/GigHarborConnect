import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { Calendar, Plus, Edit2, Trash2, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { ImportantDate } from "@shared/schema";

const importantDateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  category: z.enum(["season", "competition", "equipment", "meeting", "team", "general"]).default("general"),
  priority: z.enum(["high", "normal", "low"]).default("normal"),
});

type ImportantDateFormData = z.infer<typeof importantDateSchema>;

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

interface ImportantDatesProps {
  isPublic?: boolean;
}

export default function ImportantDates({ isPublic = false }: ImportantDatesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  // Simple permission check for administrators only
  const canManage = !isPublic && user?.role === 'Administrator';

  const { data: importantDates = [], isLoading, error } = useQuery<ImportantDate[]>({
    queryKey: ["/api/important-dates"],
    retry: false,
  });

  const form = useForm<ImportantDateFormData>({
    resolver: zodResolver(importantDateSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      category: "general",
      priority: "normal",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ImportantDateFormData) => {
      return apiRequest("/api/important-dates", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/important-dates"] });
      setIsDialogOpen(false);
      setEditingDate(null);
      form.reset();
      toast({
        title: "Success",
        description: "Important date created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create important date. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ImportantDateFormData }) => {
      return apiRequest(`/api/important-dates/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/important-dates"] });
      setIsDialogOpen(false);
      setEditingDate(null);
      form.reset();
      toast({
        title: "Success",
        description: "Important date updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update important date. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/important-dates/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/important-dates"] });
      toast({
        title: "Success",
        description: "Important date deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete important date. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ImportantDateFormData) => {
    if (editingDate) {
      updateMutation.mutate({ id: editingDate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (date: ImportantDate) => {
    setEditingDate(date);
    form.reset({
      title: date.title,
      description: date.description || "",
      date: format(new Date(date.date), "yyyy-MM-dd'T'HH:mm"),
      category: date.category as any,
      priority: date.priority as any,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this important date?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewDate = () => {
    setEditingDate(null);
    form.reset();
    setIsDialogOpen(true);
  };

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

  // Filter dates by category
  const filteredDates = selectedCategory 
    ? importantDates.filter(date => date.category === selectedCategory)
    : importantDates;

  // Group dates by status
  const groupedDates = {
    upcoming: filteredDates.filter(date => {
      const targetDate = new Date(date.date);
      const now = new Date();
      const sevenDaysFromNow = addDays(now, 7);
      return isAfter(targetDate, now) && isBefore(targetDate, sevenDaysFromNow);
    }),
    future: filteredDates.filter(date => {
      const targetDate = new Date(date.date);
      const sevenDaysFromNow = addDays(new Date(), 7);
      return isAfter(targetDate, sevenDaysFromNow);
    }),
    past: filteredDates.filter(date => {
      const targetDate = new Date(date.date);
      return isBefore(targetDate, new Date());
    }),
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy">Important Dates</h2>
          <p className="text-slate-600 mt-1">Key dates and deadlines for the team</p>
        </div>
        {!isPublic && hasPermission && hasPermission(user, 'canCreateEvents') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewDate} className="bg-columbia hover:bg-columbia/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Date
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingDate ? "Edit Important Date" : "Add Important Date"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter title..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Optional description..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date & Time</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categoryOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.icon} {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {priorityOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex-1 bg-columbia hover:bg-columbia/90"
                    >
                      {editingDate ? "Update" : "Create"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className={selectedCategory === null ? "bg-navy text-white" : ""}
        >
          All Categories ({importantDates.length})
        </Button>
        {categoryOptions.map((category) => {
          const count = importantDates.filter(date => date.category === category.value).length;
          if (count === 0) return null;
          
          return (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className={selectedCategory === category.value ? "bg-columbia text-white" : ""}
            >
              {category.icon} {category.label} ({count})
            </Button>
          );
        })}
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
                          <span>{format(new Date(date.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
                          <statusInfo.icon className={`w-4 h-4 ${statusInfo.color}`} />
                        </div>
                        {date.description && (
                          <p className="text-gray-700 text-sm">{date.description}</p>
                        )}
                      </div>
                      {!isPublic && hasPermission && hasPermission(user, 'canEditEvents') && (
                        <div className="flex space-x-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(date)}
                            className="text-gray-400 hover:text-blue-500"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {hasPermission(user, 'canDeleteEvents') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(date.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
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
                          <span>{format(new Date(date.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
                          <statusInfo.icon className={`w-4 h-4 ${statusInfo.color}`} />
                        </div>
                        {date.description && (
                          <p className="text-gray-700 text-sm">{date.description}</p>
                        )}
                      </div>
                      {!isPublic && hasPermission && hasPermission(user, 'canEditEvents') && (
                        <div className="flex space-x-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(date)}
                            className="text-gray-400 hover:text-blue-500"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {hasPermission(user, 'canDeleteEvents') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(date.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Past Dates */}
        {groupedDates.past.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-500 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Past Dates
            </h3>
            <div className="space-y-3 opacity-75">
              {groupedDates.past.slice(0, 5).map((date) => {
                const priorityInfo = getPriorityBadge(date.priority);
                
                return (
                  <div key={date.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg opacity-50">{getCategoryIcon(date.category)}</span>
                          <h4 className="text-lg font-semibold text-gray-700">{date.title}</h4>
                          <Badge className="opacity-50 bg-gray-100 text-gray-600 border-gray-200">
                            Completed
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(date.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
                          <CheckCircle className="w-4 h-4 text-gray-400" />
                        </div>
                        {date.description && (
                          <p className="text-gray-600 text-sm">{date.description}</p>
                        )}
                      </div>
                      {!isPublic && hasPermission && hasPermission(user, 'canDeleteEvents') && (
                        <div className="flex space-x-1 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(date.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {groupedDates.past.length > 5 && (
                <div className="text-center text-sm text-gray-500 pt-2">
                  ... and {groupedDates.past.length - 5} more past dates
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredDates.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Important Dates</h3>
            <p className="text-gray-500 mb-4">
              {selectedCategory 
                ? `No dates found in the ${categoryOptions.find(c => c.value === selectedCategory)?.label} category.`
                : "No important dates have been added yet."
              }
            </p>
            {!isPublic && hasPermission && hasPermission(user, 'canCreateEvents') && (
              <Button onClick={handleNewDate} className="bg-columbia hover:bg-columbia/90">
                <Plus className="w-4 h-4 mr-2" />
                Add First Date
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}