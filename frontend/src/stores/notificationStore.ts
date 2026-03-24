import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizeNotification, sortNotifications } from "@/lib/notifications";
import type {
  IncomingNotification,
  Notification,
} from "@/types/notification.types";

const MAX_NOTIFICATIONS = 50;

function getUnreadCount(notifications: Notification[]) {
  return notifications.reduce((total, notification) => {
    return total + (notification.isRead ? 0 : 1);
  }, 0);
}

interface NotificationState {
  hydrated: boolean;
  notifications: Notification[];
  unreadCount: number;
  setHydrated: (value: boolean) => void;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: IncomingNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      hydrated: false,
      notifications: [],
      unreadCount: 0,
      setHydrated: (hydrated) => set({ hydrated }),
      setNotifications: (notifications) => {
        const sortedNotifications = sortNotifications(
          notifications.map((notification) => normalizeNotification(notification)),
        );

        set({
          notifications: sortedNotifications,
          unreadCount: getUnreadCount(sortedNotifications),
        });
      },
      addNotification: (notification) =>
        set((state) => {
          const nextNotification = normalizeNotification(notification);
          const notifications = sortNotifications(
            [
              nextNotification,
              ...state.notifications.filter((item) => item.id !== nextNotification.id),
            ].slice(0, MAX_NOTIFICATIONS),
          );

          return {
            notifications,
            unreadCount: getUnreadCount(notifications),
          };
        }),
      markAsRead: (id) =>
        set((state) => {
          const notifications = state.notifications.map((notification) =>
            notification.id === id ? { ...notification, isRead: true } : notification,
          );

          return {
            notifications,
            unreadCount: getUnreadCount(notifications),
          };
        }),
      markAllAsRead: () =>
        set((state) => {
          const notifications = state.notifications.map((notification) => ({
            ...notification,
            isRead: true,
          }));

          return {
            notifications,
            unreadCount: 0,
          };
        }),
      reset: () =>
        set((state) => ({
          hydrated: state.hydrated,
          notifications: [],
          unreadCount: 0,
        })),
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            }
          : window.localStorage,
      ),
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
