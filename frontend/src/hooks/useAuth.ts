"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { toast } from "@/components/ui/toast";
import { authApi } from "@/services/api/auth.api";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useWalletStore } from "@/stores/walletStore";

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authState = useAuthStore();
  const clearAuth = useAuthStore((state) => state.logout);
  const resetWallet = useWalletStore((state) => state.reset);
  const resetNotifications = useNotificationStore((state) => state.reset);

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth();
      resetWallet();
      resetNotifications();
      queryClient.removeQueries({
        queryKey: ["auth"],
      });
      queryClient.removeQueries({
        queryKey: ["wallet"],
      });
      toast.success("Đã đăng xuất khỏi phiên làm việc.");
      startTransition(() => {
        router.push("/login");
      });
    },
  });

  return {
    ...authState,
    logout: () => logoutMutation.mutateAsync(),
    isLoggingOut: logoutMutation.isPending,
  };
}
