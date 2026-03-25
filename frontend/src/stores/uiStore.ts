import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface UiState {
  isSidebarOpen: boolean;
  activeDialog: string | null;
  theme: ThemeMode;
  toggleSidebar: () => void;
  setSidebarOpen: (value: boolean) => void;
  openDialog: (dialogId: string) => void;
  closeDialog: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isSidebarOpen: false,
      activeDialog: null,
      theme: "system",
      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen,
        })),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      openDialog: (activeDialog) => set({ activeDialog }),
      closeDialog: () => set({ activeDialog: null }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "ui-storage",
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
        theme: state.theme,
      }),
    },
  ),
);
