"use client";

import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token: useAuthStore.getState().accessToken,
      },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ["websocket"],
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
