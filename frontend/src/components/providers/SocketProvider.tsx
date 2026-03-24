"use client";

import type { ReactNode } from "react";
import { useSocket } from "@/hooks/useSocket";

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  useSocket();
  return <>{children}</>;
}
