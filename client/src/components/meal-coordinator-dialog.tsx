import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const mealCoordinatorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
});

type MealCoordinatorData = z.infer<typeof mealCoordinatorSchema>;

interface MealCoordinatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: MealCoordinatorData) => void;
  initialData?: MealCoordinatorData;
}

export default function MealCoordinatorDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  initialData 
}: MealCoordinatorDialogProps) {
  const form = useForm<MealCoordinatorData>({
    resolver: zodResolver(mealCoordinatorSchema),
    defaultValues: initialData || {
      name: "",
      email: "",
      phone: "",
    },
  });

  const handleSave = (data: MealCoordinatorData) => {
    onSave(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🍽️ Meal Coordinator Information
          </DialogTitle>
          <DialogDescription>
            Please provide the contact information for the meal coordinator for this event.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
          <div>
            <Label htmlFor="coordinatorName">Coordinator Name</Label>
            <Input
              id="coordinatorName"
              {...form.register("name")}
              placeholder="Full name of meal coordinator"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="coordinatorEmail">Email Address</Label>
            <Input
              id="coordinatorEmail"
              type="email"
              {...form.register("email")}
              placeholder="coordinator@example.com"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="coordinatorPhone">Phone Number</Label>
            <Input
              id="coordinatorPhone"
              type="tel"
              {...form.register("phone")}
              placeholder="(555) 123-4567"
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.phone.message}
              </p>
            )}
          </div>

          <div className="flex space-x-4 pt-4">
            <Button
              type="submit"
              className="flex-1 gradient-navy-columbia text-white"
            >
              Save Coordinator Info
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}