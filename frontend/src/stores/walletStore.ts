import { create } from "zustand";
import type { Transaction } from "@/types/wallet.types";

interface WalletState {
  balance: number;
  isLoading: boolean;
  transactions: Transaction[];
  setBalance: (balance: number) => void;
  deduct: (amount: number) => void;
  addFunds: (amount: number) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  isLoading: false,
  transactions: [],
  setBalance: (balance) => set({ balance }),
  deduct: (amount) =>
    set((state) => ({
      balance: Math.max(0, state.balance - amount),
    })),
  addFunds: (amount) =>
    set((state) => ({
      balance: state.balance + amount,
    })),
  setTransactions: (transactions) => set({ transactions }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({
      balance: 0,
      isLoading: false,
      transactions: [],
    }),
}));
