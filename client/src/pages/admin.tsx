import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, UserPlus, Shield, Edit, ArrowLeft, Hash, Plus, ToggleLeft, ToggleRight, UserCheck, Clock, X, Check, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";

const roleOptions = [
  { value: "Administrator", label: "Administrator" },
  { value: "Editor", label: "Editor" },
  { value: "Contributor", label: "Contributor" },
  { value: "Viewer", label: "Viewer" },
  { value: "Guest", label: "Guest" }
];

const addUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["Administrator", "Editor", "Contributor", "Viewer", "Guest"])
});

const updateRoleSchema = z.object({
  role: z.enum(["Administrator", "Editor", "Contributor", "Viewer", "Guest"])
});

const hashtagSchema = z.object({
  name: z.string().min(1, "Name is required").regex(/^[a-z0-9-]+$/, "Name can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
});

type AddUserFormData = z.infer<typeof addUserSchema>;
type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;
type HashtagFormData = z.infer<typeof hashtagSchema>;

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedHashtag, setSelectedHashtag] = useState<any>(null);
  const [isAddHashtagOpen, setIsAddHashtagOpen] = useState(false);
  const [isEditHashtagOpen, setIsEditHashtagOpen] = useState(false);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "Administrator")) {
      toast({
        title: "Unauthorized",
        description: "You need administrator privileges to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    }
  }, [isAuthenticated, isLoading, user, toast]);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && user?.role === "Administrator",
    retry: false,
  });

  const { data: hashtags, isLoading: hashtagsLoading } = useQuery({
    queryKey: ["/api/admin/hashtags"],
    enabled: isAuthenticated && user?.role === "Administrator",
    retry: false,
  });

  const { data: accessRequests, isLoading: accessRequestsLoading } = useQuery({
    queryKey: ["/api/access-requests"],
    enabled: isAuthenticated && user?.role === "Administrator",
    retry: false,
  });

  const addUserForm = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "Viewer"
    }
  });

  const updateRoleForm = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      role: "Viewer"
    }
  });

  const addHashtagForm = useForm<HashtagFormData>({
    resolver: zodResolver(hashtagSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  const editHashtagForm = useForm<HashtagFormData>({
    resolver: zodResolver(hashtagSchema),
    defaultValues: {
      name: "",
      description: ""
    }
  });

  const addUserMutation = useMutation({
    mutationFn: async (data: AddUserFormData) => {
      const response = await apiRequest("POST", "/api/admin/users", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User added successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsAddUserOpen(false);
      addUserForm.reset();
    },
    onError: (error: any) => {
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
      
      // Handle specific error responses
      let errorMessage = "Failed to add user";
      
      // Try to parse error response
      try {
        const errorData = JSON.parse(error.message.split(': ')[1]);
        if (errorData.message === "Email already exists" && errorData.details) {
          errorMessage = errorData.details;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Fall back to generic error if parsing fails
        if (error.message.includes('409:')) {
          errorMessage = "This email address is already registered. The user should sign in using their existing account.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsEditRoleOpen(false);
      setSelectedUser(null);
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
        description: "Failed to update user role",
        variant: "destructive"
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User removed successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
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
        description: "Failed to remove user",
        variant: "destructive"
      });
    },
  });

  const addHashtagMutation = useMutation({
    mutationFn: async (data: HashtagFormData) => {
      const response = await apiRequest("POST", "/api/admin/hashtags", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hashtag added successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hashtags"] });
      setIsAddHashtagOpen(false);
      addHashtagForm.reset();
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
        description: "Failed to add hashtag",
        variant: "destructive"
      });
    },
  });

  const editHashtagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: HashtagFormData }) => {
      const response = await apiRequest("PUT", `/api/admin/hashtags/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hashtag updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hashtags"] });
      setIsEditHashtagOpen(false);
      setSelectedHashtag(null);
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
        description: "Failed to update hashtag",
        variant: "destructive"
      });
    },
  });

  const toggleHashtagMutation = useMutation({
    mutationFn: async (hashtagId: number) => {
      const response = await apiRequest("PATCH", `/api/admin/hashtags/${hashtagId}/toggle`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hashtag status updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hashtags"] });
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
        description: "Failed to update hashtag status",
        variant: "destructive"
      });
    },
  });

  const deleteHashtagMutation = useMutation({
    mutationFn: async (hashtagId: number) => {
      await apiRequest("DELETE", `/api/admin/hashtags/${hashtagId}`);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Hashtag deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hashtags"] });
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
        description: "Failed to delete hashtag",
        variant: "destructive"
      });
    },
  });

  const updateAccessRequestMutation = useMutation({
    mutationFn: async ({ id, disposition }: { id: number; disposition: string }) => {
      const response = await apiRequest("PATCH", `/api/access-requests/${id}`, { disposition });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Access request updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/access-requests"] });
    },
    onError: (error: any) => {
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
        description: "Failed to update access request",
        variant: "destructive"
      });
    }
  });

  const onAddUser = (data: AddUserFormData) => {
    addUserMutation.mutate(data);
  };

  const onUpdateRole = (data: UpdateRoleFormData) => {
    if (selectedUser) {
      updateRoleMutation.mutate({ userId: selectedUser.id, role: data.role });
    }
  };

  const onAddHashtag = (data: HashtagFormData) => {
    addHashtagMutation.mutate(data);
  };

  const onEditHashtag = (data: HashtagFormData) => {
    if (selectedHashtag) {
      editHashtagMutation.mutate({ id: selectedHashtag.id, data });
    }
  };

  const handleEditRole = (user: any) => {
    setSelectedUser(user);
    updateRoleForm.setValue("role", user.role);
    setIsEditRoleOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to remove this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleEditHashtag = (hashtag: any) => {
    setSelectedHashtag(hashtag);
    editHashtagForm.setValue("name", hashtag.name);
    editHashtagForm.setValue("description", hashtag.description || "");
    setIsEditHashtagOpen(true);
  };

  const handleToggleHashtag = (hashtagId: number) => {
    toggleHashtagMutation.mutate(hashtagId);
  };

  const handleDeleteHashtag = (hashtagId: number) => {
    if (confirm("Are you sure you want to delete this hashtag? This action cannot be undone.")) {
      deleteHashtagMutation.mutate(hashtagId);
    }
  };

  const handleUpdateAccessRequest = (id: number, disposition: string) => {
    updateAccessRequestMutation.mutate({ id, disposition });
  };

  const getDispositionBadgeColor = (disposition: string) => {
    switch (disposition) {
      case "granted": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "denied": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getDispositionIcon = (disposition: string) => {
    switch (disposition) {
      case "granted": return <Check className="w-4 h-4" />;
      case "denied": return <X className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Administrator": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Editor": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Contributor": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Viewer": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Guest": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading || !isAuthenticated || user?.role !== "Administrator") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {isLoading ? "Loading..." : "Access restricted to administrators"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              User Administration
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage user accounts and permissions for Tides Hub
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Done
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Access Requests Management Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                User Requests
              </CardTitle>
              <CardDescription>
                Review and manage access requests from potential team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accessRequestsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading access requests...</p>
                </div>
              ) : accessRequests && accessRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Relationship</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accessRequests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.requesterName}
                        </TableCell>
                        <TableCell>{request.requesterEmail}</TableCell>
                        <TableCell>{request.relationship}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">
                                  <Info className="w-4 h-4 text-blue-600" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                <p className="text-sm">{request.reason}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDispositionBadgeColor(request.disposition)}>
                            <span className="flex items-center gap-1">
                              {getDispositionIcon(request.disposition)}
                              {request.disposition}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateAccessRequest(request.id, "granted")}
                              disabled={request.disposition === "granted" || updateAccessRequestMutation.isPending}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateAccessRequest(request.id, "denied")}
                              disabled={request.disposition === "denied" || updateAccessRequestMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateAccessRequest(request.id, "pending")}
                              disabled={request.disposition === "pending" || updateAccessRequestMutation.isPending}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <Clock className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">No access requests</p>
                  <p className="text-sm text-gray-400">
                    Access requests from guests will appear here for review
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Management Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Add new users and manage existing user roles and permissions
                </CardDescription>
              </div>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Enter the user's information and assign their role
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...addUserForm}>
                    <form onSubmit={addUserForm.handleSubmit(onAddUser)} className="space-y-4">
                      <FormField
                        control={addUserForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="user@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addUserForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addUserForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addUserForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roleOptions.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddUserOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={addUserMutation.isPending}
                        >
                          {addUserMutation.isPending ? "Adding..." : "Add User"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading users...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((tableUser: any) => (
                      <TableRow key={tableUser.id}>
                        <TableCell className="font-medium">
                          {tableUser.firstName && tableUser.lastName
                            ? `${tableUser.firstName} ${tableUser.lastName}`
                            : tableUser.email?.split('@')[0] || 'Unknown User'}
                        </TableCell>
                        <TableCell>{tableUser.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(tableUser.role)}>
                            {tableUser.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(tableUser.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRole(tableUser)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(tableUser.id)}
                              disabled={tableUser.id === user?.id} // Prevent self-deletion
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>



          {/* Hashtag Management Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Hashtag Management
                </CardTitle>
                <CardDescription>
                  Manage hashtags available for filtering messages in Tide Talk
                </CardDescription>
              </div>
              <Dialog open={isAddHashtagOpen} onOpenChange={setIsAddHashtagOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Hashtag
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Hashtag</DialogTitle>
                    <DialogDescription>
                      Create a new hashtag for message filtering
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...addHashtagForm}>
                    <form onSubmit={addHashtagForm.handleSubmit(onAddHashtag)} className="space-y-4">
                      <FormField
                        control={addHashtagForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., homework-help" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addHashtagForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Brief description of this hashtag"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddHashtagOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={addHashtagMutation.isPending}>
                          {addHashtagMutation.isPending ? "Adding..." : "Add Hashtag"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {hashtagsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading hashtags...</p>
                </div>
              ) : hashtags && hashtags.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hashtags.map((hashtag: any) => (
                      <TableRow key={hashtag.id}>
                        <TableCell className="font-medium">
                          #{hashtag.name}
                        </TableCell>
                        <TableCell>{hashtag.description || "No description"}</TableCell>
                        <TableCell>
                          <Badge 
                            className={hashtag.isActive === "true" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            }
                          >
                            {hashtag.isActive === "true" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{hashtag.createdBy || "System"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleHashtag(hashtag.id)}
                              title={hashtag.isActive === "true" ? "Deactivate" : "Activate"}
                            >
                              {hashtag.isActive === "true" ? (
                                <ToggleRight className="w-4 h-4" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditHashtag(hashtag)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteHashtag(hashtag.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Hash className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 mb-4">No hashtags found</p>
                  <Button onClick={() => setIsAddHashtagOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Hashtag
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Role Dialog */}
        <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update User Role</DialogTitle>
              <DialogDescription>
                Change the role for {selectedUser?.firstName} {selectedUser?.lastName}
              </DialogDescription>
            </DialogHeader>
            <Form {...updateRoleForm}>
              <form onSubmit={updateRoleForm.handleSubmit(onUpdateRole)} className="space-y-4">
                <FormField
                  control={updateRoleForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditRoleOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateRoleMutation.isPending}>
                    {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Hashtag Dialog */}
        <Dialog open={isEditHashtagOpen} onOpenChange={setIsEditHashtagOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Hashtag</DialogTitle>
              <DialogDescription>
                Update the hashtag information
              </DialogDescription>
            </DialogHeader>
            <Form {...editHashtagForm}>
              <form onSubmit={editHashtagForm.handleSubmit(onEditHashtag)} className="space-y-4">
                <FormField
                  control={editHashtagForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., homework-help" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editHashtagForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Brief description of this hashtag"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditHashtagOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editHashtagMutation.isPending}>
                    {editHashtagMutation.isPending ? "Updating..." : "Update Hashtag"}
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