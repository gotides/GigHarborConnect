import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Lock, Send, User, Mail, Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function GuestAccessRequestForm() {
  const [formData, setFormData] = useState({
    requesterName: "",
    requesterEmail: "",
    relationship: "",
    reason: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const submitRequestMutation = useMutation({
    mutationFn: async (requestData: typeof formData) => {
      const response = await apiRequest("POST", "/api/access-requests", requestData);
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Access Request Submitted",
        description: "Your request has been sent to the team administrators.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit access request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.requesterName || !formData.requesterEmail || !formData.relationship || !formData.reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to submit your request.",
        variant: "destructive",
      });
      return;
    }
    submitRequestMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Request Submitted!</h3>
          <p className="text-slate-500 mb-4">
            Your access request has been sent to the team administrators.
          </p>
          <p className="text-sm text-slate-400">
            You'll be contacted via email once your request is reviewed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="gradient-navy-columbia p-6 text-white">
        <div className="text-center">
          <Lock className="w-12 h-12 mx-auto mb-3 opacity-80" />
          <h2 className="text-2xl font-bold mb-2">Request Team Access</h2>
          <p className="text-blue-100">
            Join the Tides Girls Water Polo community and stay connected with the team
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-0 shadow-none">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-slate-600 leading-relaxed">
                To gain access to the Tides Hub (team calendar, announcements, and chat), 
                please provide your information so our administrators can verify your connection to the team.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  Your Full Name *
                </Label>
                <Input
                  id="name"
                  value={formData.requesterName}
                  onChange={(e) => handleInputChange("requesterName", e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.requesterEmail}
                  onChange={(e) => handleInputChange("requesterEmail", e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship" className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-slate-500" />
                Relationship to Team *
              </Label>
              <Input
                id="relationship"
                value={formData.relationship}
                onChange={(e) => handleInputChange("relationship", e.target.value)}
                placeholder="e.g., Parent of Sarah Johnson, Sister of team member, Former coach, etc."
                required
              />
              <p className="text-xs text-slate-500">
                Please specify your connection to the team or a specific player
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                Why do you want access? *
              </Label>
              <textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange("reason", e.target.value)}
                placeholder="Please explain why you'd like access to the team communications and events..."
                rows={4}
                required
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-slate-500">
                This helps administrators understand your need for team access
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full gradient-navy-columbia text-white"
                disabled={submitRequestMutation.isPending}
              >
                {submitRequestMutation.isPending ? (
                  "Submitting Request..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Access Request
                  </>
                )}
              </Button>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Your request will be reviewed by team administrators within 24-48 hours.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}