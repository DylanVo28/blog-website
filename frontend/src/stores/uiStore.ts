import { create } from "zustand";

type ThemeMode = "light" | "dark" | "system";

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

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: false,
  activeDialog: null,
  theme: "light",
  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    })),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  openDialog: (activeDialog) => set({ activeDialog }),
  closeDialog: () => set({ activeDialog: null }),
  setTheme: (theme) => set({ theme }),
}));
