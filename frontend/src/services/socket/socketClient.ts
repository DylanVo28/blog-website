"use client";

import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "@/lib/constants";

let socket: Socket | null = null;

export function getSocket(accessToken?: string) {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
    });
  }

  if (accessToken) {
    socket.auth = {
      token: accessToken,
    };
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
