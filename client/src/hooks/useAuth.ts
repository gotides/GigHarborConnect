import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { permissions } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const hasPermission = (permission: keyof typeof permissions[keyof typeof permissions]) => {
    if (!user || !user.role) return false;
    const userPermissions = permissions[user.role as keyof typeof permissions];
    return userPermissions?.[permission] || false;
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    hasPermission,
  };
}