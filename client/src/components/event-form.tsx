import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import MealCoordinatorDialog from "./meal-coordinator-dialog";

const eventFormSchema = insertEventSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  scheduleFood: z.boolean().default(false),
  mealCoordinatorName: z.string().optional(),
  mealCoordinatorEmail: z.string().optional(),
  mealCoordinatorPhone: z.string().optional(),
  mealCoordinatorLocation: z.string().optional(),
  mealCoordinatorAddress: z.string().optional(),
}).refine((data) => {
  if (data.scheduleFood) {
    return data.mealCoordinatorName && data.mealCoordinatorEmail && data.mealCoordinatorPhone && data.mealCoordinatorLocation;
  }
  return true;
}, {
  message: "Meal coordinator information is required when food is scheduled",
  path: ["scheduleFood"],
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  onSuccess?: () => void;
}

export default function EventForm({ onSuccess }: EventFormProps) {
  const { toast } = useToast();
  const [showMealCoordinatorDialog, setShowMealCoordinatorDialog] = useState(false);
  
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      category: "games",
      scheduleFood: false,
      mealCoordinatorName: "",
      mealCoordinatorEmail: "",
      mealCoordinatorPhone: "",
      mealCoordinatorLocation: "",
      mealCoordinatorAddress: "",
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const eventData = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        scheduleFood: data.scheduleFood ? "true" : "false", // Convert boolean to string for backend consistency
        mealCoordinatorName: data.scheduleFood ? data.mealCoordinatorName : null,
        mealCoordinatorEmail: data.scheduleFood ? data.mealCoordinatorEmail : null,
        mealCoordinatorPhone: data.scheduleFood ? data.mealCoordinatorPhone : null,
        mealCoordinatorLocation: data.scheduleFood ? data.mealCoordinatorLocation : null,
        mealCoordinatorAddress: data.scheduleFood ? data.mealCoordinatorAddress : null,
      };
      const response = await apiRequest("POST", "/api/events", eventData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success!",
        description: "Event created successfully.",
      });
      form.reset();
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventFormData) => {
    createEventMutation.mutate(data);
  };

  const handleScheduleFoodChange = (checked: boolean) => {
    form.setValue("scheduleFood", checked);
    if (checked) {
      setShowMealCoordinatorDialog(true);
    } else {
      // Clear meal coordinator data when unchecking
      form.setValue("mealCoordinatorName", "");
      form.setValue("mealCoordinatorEmail", "");
      form.setValue("mealCoordinatorPhone", "");
      form.setValue("mealCoordinatorLocation", "");
      form.setValue("mealCoordinatorAddress", "");
    }
  };

  const handleMealCoordinatorSave = (coordinatorData: {
    name: string;
    email: string;
    phone: string;
    location: string;
    address?: string;
  }) => {
    form.setValue("mealCoordinatorName", coordinatorData.name);
    form.setValue("mealCoordinatorEmail", coordinatorData.email);
    form.setValue("mealCoordinatorPhone", coordinatorData.phone);
    form.setValue("mealCoordinatorLocation", coordinatorData.location);
    form.setValue("mealCoordinatorAddress", coordinatorData.address || "");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Create New Event</h2>
        <p className="text-slate-600">Add an event to the team calendar</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            {...form.register("title")}
            placeholder="Water Polo vs. Peninsula"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-red-500 mt-1">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Event details and information"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date & Time</Label>
            <Input
              id="startDate"
              type="datetime-local"
              {...form.register("startDate")}
            />
            {form.formState.errors.startDate && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.startDate.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="endDate">End Date & Time (Optional)</Label>
            <Input
              id="endDate"
              type="datetime-local"
              {...form.register("endDate")}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            {...form.register("location")}
            placeholder="Pool, Aquatic Center, etc."
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            value={form.watch("category")}
            onValueChange={(value) => form.setValue("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="games">Games</SelectItem>
              <SelectItem value="team-events">Team Events</SelectItem>
              <SelectItem value="practice">Practice</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="team-meetings">Team Meetings</SelectItem>
              <SelectItem value="award-ceremonies">Award Ceremonies</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="scheduleFood"
            checked={form.watch("scheduleFood")}
            onCheckedChange={handleScheduleFoodChange}
          />
          <Label htmlFor="scheduleFood" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Schedule Food
            {form.watch("scheduleFood") && form.watch("mealCoordinatorName") && (
              <span className="ml-2 text-xs text-green-600">
                (Coordinator: {form.watch("mealCoordinatorName")})
              </span>
            )}
          </Label>
        </div>
        {form.formState.errors.scheduleFood && (
          <p className="text-sm text-red-500 mt-1">
            {form.formState.errors.scheduleFood.message}
          </p>
        )}

        <div className="flex space-x-4 pt-4">
          <Button
            type="submit"
            disabled={createEventMutation.isPending}
            className="flex-1 gradient-navy-columbia text-white"
          >
            {createEventMutation.isPending ? "Creating..." : "Create Event"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            className="flex-1"
          >
            Clear
          </Button>
        </div>
      </form>

      <MealCoordinatorDialog
        open={showMealCoordinatorDialog}
        onOpenChange={setShowMealCoordinatorDialog}
        onSave={handleMealCoordinatorSave}
        initialData={
          form.watch("mealCoordinatorName") 
            ? {
                name: form.watch("mealCoordinatorName") || "",
                email: form.watch("mealCoordinatorEmail") || "",
                phone: form.watch("mealCoordinatorPhone") || "",
                location: form.watch("mealCoordinatorLocation") || "",
                address: form.watch("mealCoordinatorAddress") || "",
              }
            : undefined
        }
      />
    </div>
  );
}
