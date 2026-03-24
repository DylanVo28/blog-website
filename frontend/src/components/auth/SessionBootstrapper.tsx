"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/api";
import { authApi } from "@/services/api/auth.api";
import { notificationsApi } from "@/services/api/notifications.api";
import { walletApi } from "@/services/api/wallet.api";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useWalletStore } from "@/stores/walletStore";

export function SessionBootstrapper() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const setBalance = useWalletStore((state) => state.setBalance);
  const setLoading = useWalletStore((state) => state.setLoading);
  const resetWallet = useWalletStore((state) => state.reset);
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  const resetNotifications = useNotificationStore((state) => state.reset);

  const meQuery = useQuery({
    queryKey: ["auth", "me", accessToken],
    queryFn: async () => {
      const response = await authApi.getMe();
      return response.data.data;
    },
    enabled: hydrated && Boolean(accessToken),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const walletQuery = useQuery({
    queryKey: ["wallet", "me", accessToken],
    queryFn: () => walletApi.getWallet(),
    enabled: hydrated && Boolean(accessToken),
    retry: false,
    staleTime: 60 * 1000,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "me", accessToken],
    queryFn: () => notificationsApi.getMine(),
    enabled: hydrated && Boolean(accessToken),
    retry: false,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, setUser]);

  useEffect(() => {
    if (walletQuery.data) {
      setBalance(walletQuery.data.balance);
    }
  }, [walletQuery.data, setBalance]);

  useEffect(() => {
    if (notificationsQuery.data) {
      setNotifications(notificationsQuery.data);
    }
  }, [notificationsQuery.data, setNotifications]);

  useEffect(() => {
    setLoading(walletQuery.isFetching);
  }, [setLoading, walletQuery.isFetching]);

  useEffect(() => {
    if (hydrated && !accessToken) {
      resetWallet();
      resetNotifications();
    }
  }, [accessToken, hydrated, resetNotifications, resetWallet]);

  useEffect(() => {
    if (
      isUnauthorizedError(meQuery.error) ||
      isUnauthorizedError(walletQuery.error) ||
      isUnauthorizedError(notificationsQuery.error)
    ) {
      logout();
      resetWallet();
      resetNotifications();
    }
  }, [
    logout,
    meQuery.error,
    notificationsQuery.error,
    resetNotifications,
    resetWallet,
    walletQuery.error,
  ]);

  return null;
}
