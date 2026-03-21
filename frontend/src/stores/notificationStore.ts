import { create } from "zustand";

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  incrementUnread: () =>
    set((state) => ({
      unreadCount: state.unreadCount + 1,
    })),
  reset: () =>
    set({
      unreadCount: 0,
    }),
}));
