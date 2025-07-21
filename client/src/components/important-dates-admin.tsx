import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Calendar, Plus, Edit2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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

const importantDateFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  category: z.enum(["general", "season", "equipment", "team", "meeting", "competition"]).default("general"),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

type ImportantDateFormData = z.infer<typeof importantDateFormSchema>;

function ImportantDateForm({ 
  date, 
  onSubmit, 
  onCancel, 
  isLoading 
}: { 
  date?: ImportantDate; 
  onSubmit: (data: ImportantDateFormData) => void; 
  onCancel: () => void; 
  isLoading: boolean; 
}) {
  const form = useForm<ImportantDateFormData>({
    resolver: zodResolver(importantDateFormSchema),
    defaultValues: {
      title: date?.title || "",
      description: date?.description || "",
      date: date?.date ? format(new Date(date.date), "yyyy-MM-dd'T'HH:mm") : "",
      category: date?.category || "general",
      priority: date?.priority || "normal",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter title" {...field} />
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
                <Textarea placeholder="Enter description (optional)" {...field} />
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
                <Input type="datetime-local" {...field} />
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
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="season">Season</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="competition">Competition</SelectItem>
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
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : date ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function ImportantDates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: importantDates = [], isLoading, error } = useQuery<ImportantDate[]>({
    queryKey: ["/api/important-dates"],
  });

  const createMutation = useMutation({
    mutationFn: (data: ImportantDateFormData) => 
      apiRequest("POST", "/api/important-dates", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/important-dates"] });
      setIsAddDialogOpen(false);
      toast({ title: "Success", description: "Important date created successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create important date",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ImportantDateFormData> }) =>
      apiRequest("PUT", `/api/important-dates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/important-dates"] });
      setIsEditDialogOpen(false);
      setEditingDate(null);
      toast({ title: "Success", description: "Important date updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update important date",
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/important-dates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/important-dates"] });
      toast({ title: "Success", description: "Important date deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete important date",
        variant: "destructive" 
      });
    },
  });

  const isAdmin = user?.role === "Administrator";

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

  const handleEdit = (date: ImportantDate) => {
    setEditingDate(date);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this important date?")) {
      deleteMutation.mutate(id);
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Important Dates</h2>
          <p className="text-gray-600">Key dates and deadlines for the season</p>
        </div>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Date
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Important Date</DialogTitle>
              </DialogHeader>
              <ImportantDateForm
                onSubmit={(data) => createMutation.mutate(data)}
                onCancel={() => setIsAddDialogOpen(false)}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Dates List - Upcoming first, past dates greyed at bottom */}
      <div className="space-y-4">
        {sortedDates.length > 0 ? (
          sortedDates.map((date) => {
            const priorityInfo = getPriorityBadge(date.priority);
            const isPast = isDatePast(date.date);
            
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
                    <div className={`flex items-center gap-2 text-sm mb-2 ${
                      isPast ? "text-gray-500" : "text-gray-600"
                    }`}>
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(date.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
                    </div>
                    {date.description && (
                      <p className={`text-sm ${
                        isPast ? "text-gray-500" : "text-gray-700"
                      }`}>
                        {date.description}
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(date)}
                        className={isPast 
                          ? "text-gray-400 hover:text-gray-600" 
                          : "text-gray-600 hover:text-blue-600"
                        }
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(date.id)}
                        className={isPast 
                          ? "text-gray-400 hover:text-gray-600" 
                          : "text-gray-600 hover:text-red-600"
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Important Dates</h3>
            <p className="text-gray-500 mb-4">
              No important dates have been added yet.
            </p>
            {isAdmin && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Date
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingDate && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Important Date</DialogTitle>
            </DialogHeader>
            <ImportantDateForm
              date={editingDate}
              onSubmit={(data) => updateMutation.mutate({ id: editingDate.id, data })}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingDate(null);
              }}
              isLoading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}