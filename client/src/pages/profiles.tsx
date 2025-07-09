import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Users, Edit, Upload, Phone, Mail, User, Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().optional(),
  emailAddress: z.string().email("Valid email is required"),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface UserProfile {
  id: string;
  name: string;
  phoneNumber?: string | null;
  emailAddress: string;
  profilePhoto?: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function Profiles() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Redirect if not authenticated or doesn't have proper role
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !["Administrator", "Editor", "Contributor"].includes(user?.role || ""))) {
      toast({
        title: "Unauthorized",
        description: "You need Administrator, Editor, or Contributor role to access profiles.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: profiles, isLoading: profilesLoading } = useQuery<UserProfile[]>({
    queryKey: ["/api/profiles"],
    enabled: isAuthenticated && ["Administrator", "Editor", "Contributor"].includes(user?.role || ""),
    retry: false,
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      emailAddress: "",
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData & { profilePhoto?: File }) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("emailAddress", data.emailAddress);
      if (data.phoneNumber) {
        formData.append("phoneNumber", data.phoneNumber);
      }
      if (data.profilePhoto) {
        formData.append("profilePhoto", data.profilePhoto);
      }
      
      return await apiRequest("/api/profiles", {
        method: "PUT",
        body: formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      setIsEditProfileOpen(false);
      setSelectedFile(null);
      profileForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    },
  });

  const handleEditProfile = (profile?: UserProfile) => {
    if (profile) {
      setSelectedProfile(profile);
      profileForm.setValue("name", profile.name);
      profileForm.setValue("phoneNumber", profile.phoneNumber || "");
      profileForm.setValue("emailAddress", profile.emailAddress);
    } else {
      // Create new profile for current user
      setSelectedProfile(null);
      profileForm.setValue("name", user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "");
      profileForm.setValue("phoneNumber", "");
      profileForm.setValue("emailAddress", user?.email || "");
    }
    setIsEditProfileOpen(true);
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate({
      ...data,
      profilePhoto: selectedFile || undefined,
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Administrator":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Editor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Contributor":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading || profilesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !["Administrator", "Editor", "Contributor"].includes(user?.role || "")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Restricted</CardTitle>
            <CardDescription className="text-center">
              You need Administrator, Editor, or Contributor role to view profiles.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const currentUserProfile = profiles?.find(p => p.id === user?.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Team Profiles
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              View and manage team member profiles
            </p>
          </div>
          <Button
            onClick={() => handleEditProfile(currentUserProfile)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Edit className="w-4 h-4 mr-2" />
            {currentUserProfile ? "Edit My Profile" : "Create My Profile"}
          </Button>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles?.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No profiles yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Team members can create their profiles to share contact information
                  </p>
                  <Button onClick={() => handleEditProfile()}>
                    Create My Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            profiles?.map((profile) => (
              <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={profile.profilePhoto} alt={profile.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {profile.name}
                        </h3>
                        <Badge className={getRoleBadgeColor(profile.role)}>
                          {profile.role}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{profile.emailAddress}</span>
                        </div>
                        
                        {profile.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Phone className="w-4 h-4" />
                            <span>{profile.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                      
                      {profile.id === user?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4 w-full"
                          onClick={() => handleEditProfile(profile)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Profile Edit Dialog */}
        <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {selectedProfile ? "Edit Profile" : "Create Profile"}
              </DialogTitle>
              <DialogDescription>
                Update your profile information to help teammates contact you
              </DialogDescription>
            </DialogHeader>
            
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSubmit)} className="space-y-4">
                {/* Profile Photo Upload */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage 
                      src={selectedFile ? URL.createObjectURL(selectedFile) : selectedProfile?.profilePhoto} 
                      alt="Profile" 
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-bold">
                      {profileForm.watch("name") ? getInitials(profileForm.watch("name")) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Camera className="w-4 h-4 mr-2" />
                          Choose Photo
                        </span>
                      </Button>
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG only</p>
                  </div>
                </div>

                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditProfileOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}