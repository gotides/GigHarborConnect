import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const foodSignupSchema = z.object({
  foodCoordinationNotes: z.string().optional(),
});

type FoodSignupData = z.infer<typeof foodSignupSchema>;

interface FoodSignupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  eventTitle: string;
  mealCoordinatorName?: string;
  mealCoordinatorEmail?: string;
  mealCoordinatorPhone?: string;
  mealCoordinatorLocation?: string;
  mealCoordinatorAddress?: string;
  initialNotes?: string;
}

export default function FoodSignupDialog({ 
  open, 
  onOpenChange, 
  eventId,
  eventTitle,
  mealCoordinatorName,
  mealCoordinatorEmail,
  mealCoordinatorPhone,
  mealCoordinatorLocation,
  mealCoordinatorAddress,
  initialNotes
}: FoodSignupDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Administrator';

  const form = useForm<FoodSignupData>({
    resolver: zodResolver(foodSignupSchema),
    defaultValues: {
      foodCoordinationNotes: initialNotes || "",
    },
  });

  const updateFoodNotesMutation = useMutation({
    mutationFn: async (data: { foodCoordinationNotes: string }) => {
      return await apiRequest(`/api/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({ foodCoordinationNotes: data.foodCoordinationNotes }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Food coordination notes updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update food coordination notes",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FoodSignupData) => {
    updateFoodNotesMutation.mutate({
      foodCoordinationNotes: data.foodCoordinationNotes || "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🍽️ Food Coordination - {eventTitle}
          </DialogTitle>
          <DialogDescription>
            View meal coordinator information and coordinate food items for this event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Meal Coordinator Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Meal Coordinator Information</h3>
            <div className="space-y-2 text-sm">
              {mealCoordinatorName && (
                <div>
                  <span className="font-medium">Name:</span> {mealCoordinatorName}
                </div>
              )}
              {mealCoordinatorEmail && (
                <div>
                  <span className="font-medium">Email:</span> {mealCoordinatorEmail}
                </div>
              )}
              {mealCoordinatorPhone && (
                <div>
                  <span className="font-medium">Phone:</span> {mealCoordinatorPhone}
                </div>
              )}
              {mealCoordinatorLocation && (
                <div>
                  <span className="font-medium">Location:</span> {mealCoordinatorLocation}
                </div>
              )}
              {mealCoordinatorAddress && (
                <div>
                  <span className="font-medium">Address:</span> {mealCoordinatorAddress}
                </div>
              )}
            </div>
          </div>

          {/* Food Coordination Notes */}
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="foodCoordinationNotes">Food Coordination Notes</Label>
              <div className="text-sm text-gray-600 mb-2">
                Use this space to list what food items are needed and who is providing what.
              </div>
              <Textarea
                id="foodCoordinationNotes"
                {...form.register("foodCoordinationNotes")}
                placeholder="Food items needed:
- Main dishes
- Side dishes
- Drinks
- Desserts

Who's bringing what:
- [Name] - [Food item]
- [Name] - [Food item]"
                className="min-h-[200px]"
                readOnly={!isAdmin}
              />
              {!isAdmin && (
                <p className="text-sm text-gray-500 mt-1">
                  Only administrators can update food coordination notes. Contact the meal coordinator or an administrator to make changes.
                </p>
              )}
            </div>

            <div className="flex space-x-4 pt-4">
              {isAdmin && (
                <Button
                  type="submit"
                  className="flex-1 gradient-navy-columbia text-white"
                  disabled={updateFoodNotesMutation.isPending}
                >
                  {updateFoodNotesMutation.isPending ? "Updating..." : "Update Notes"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className={isAdmin ? "flex-1" : "w-full"}
              >
                Close
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}