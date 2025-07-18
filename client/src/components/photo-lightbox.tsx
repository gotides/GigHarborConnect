import { useEffect } from "react";
import { format } from "date-fns";
import { X, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Photo } from "@shared/schema";

interface PhotoLightboxProps {
  photo: Photo;
  onClose: () => void;
}

export default function PhotoLightbox({ photo, onClose }: PhotoLightboxProps) {
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();

  // Check if user can delete photos (admin or owner)
  const canDeleteAny = hasPermission('canDeletePhotos');
  const canDeleteOwn = () => {
    if (!user) return false;
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.firstName || user.email?.split('@')[0] || 'User';
    return photo.uploadedBy === userName;
  };

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("401: Unauthorized - Please log in to delete photos");
        }
        if (response.status === 403) {
          throw new Error("403: Insufficient permissions to delete this photo");
        }
        throw new Error("Delete failed");
      }
      return response.status === 204 ? null : response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      onClose(); // Close the lightbox
      toast({
        title: "Photo Deleted",
        description: "The photo has been successfully deleted.",
      });
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
        title: "Delete Failed",
        description: error.message || "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative max-w-4xl max-h-4xl w-full h-full flex items-center justify-center p-4">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {/* Delete Button - Only show for admin or photo owner */}
          {(canDeleteAny || canDeleteOwn()) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="h-10 w-10 p-0 bg-red-500 hover:bg-red-600 text-white"
                >
                  <Trash2 size={20} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Photo</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{photo.title}"? 
                    <br />
                    <span className="text-red-600 font-medium">Delete cannot be undone.</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deletePhotoMutation.mutate(photo.id)}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deletePhotoMutation.isPending}
                  >
                    {deletePhotoMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Photo"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-10 w-10 p-0 text-white hover:text-gray-300"
          >
            <X size={24} />
          </Button>
        </div>
        
        <img
          src={`/api/photos/${photo.id}/file`}
          alt={photo.title}
          className="max-w-full max-h-full object-contain"
        />
        
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-lg font-medium">{photo.title}</h3>
          <p className="text-sm text-gray-300">
            {photo.description && `${photo.description} • `}
            Uploaded {format(new Date(photo.uploadedAt), "MMM d, yyyy")} by {photo.uploadedBy}
          </p>
          {photo.event && (
            <p className="text-sm text-gray-300">Event: {photo.event}</p>
          )}
        </div>
      </div>
      
      {/* Background overlay - click to close */}
      <div
        className="absolute inset-0 z-0"
        onClick={onClose}
      />
    </div>
  );
}
