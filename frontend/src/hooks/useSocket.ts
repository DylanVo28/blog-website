"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent } from "react";
import { toast } from "@/components/ui/toast";
import { disconnectSocket, getSocket } from "@/services/socket/socketClient";
import { SOCKET_EVENTS } from "@/services/socket/events";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useWalletStore } from "@/stores/walletStore";
import type { IncomingNotification } from "@/types/notification.types";
import type { Wallet } from "@/types/wallet.types";

interface WalletBalancePayload {
  balance?: number | string;
}

interface PostEventPayload {
  postId?: string | null;
}

interface QuestionEventPayload extends PostEventPayload {
  questionId?: string | null;
}

function toBalance(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function useSocket() {
  const queryClient = useQueryClient();
  const hydrated = useAuthStore((state) => state.hydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);

  const handleWalletBalanceUpdated = useEffectEvent((payload: WalletBalancePayload) => {
    const balance = toBalance(payload.balance);

    if (balance === null) {
      return;
    }

    useWalletStore.getState().setBalance(balance);

    queryClient.setQueryData<Wallet | undefined>(["wallet", "overview"], (current) =>
      current ? { ...current, balance } : current,
    );
    void queryClient.invalidateQueries({ queryKey: ["wallet"] });
  });

  const handleNewNotification = useEffectEvent((notification: IncomingNotification) => {
    const title =
      typeof notification.title === "string" && notification.title.trim().length > 0
        ? notification.title
        : "Thông báo mới";
    const message =
      typeof notification.message === "string" && notification.message.trim().length > 0
        ? notification.message
        : "Bạn có một cập nhật mới.";

    useNotificationStore.getState().addNotification({
      ...notification,
      isRead: false,
    });

    toast.info(title, {
      description: message,
    });
  });

  const handleQuestionChanged = useEffectEvent((payload: QuestionEventPayload) => {
    if (payload.postId) {
      void queryClient.invalidateQueries({ queryKey: ["questions", payload.postId] });
    }
  });

  const handleQuestionRefunded = useEffectEvent((payload: QuestionEventPayload) => {
    if (payload.postId) {
      void queryClient.invalidateQueries({ queryKey: ["questions", payload.postId] });
    }

    void queryClient.invalidateQueries({ queryKey: ["wallet"] });
  });

  const handleNewComment = useEffectEvent((payload: PostEventPayload) => {
    if (payload.postId) {
      void queryClient.invalidateQueries({ queryKey: ["comments", payload.postId] });
    }
  });

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      return;
    }

    const socket = getSocket();
    socket.auth = {
      token: accessToken,
    };
    socket.connect();

    socket.on(SOCKET_EVENTS.WALLET_BALANCE_UPDATED, handleWalletBalanceUpdated);
    socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
    socket.on(SOCKET_EVENTS.QUESTION_ANSWERED, handleQuestionChanged);
    socket.on(SOCKET_EVENTS.QUESTION_AI_ANSWERED, handleQuestionChanged);
    socket.on(SOCKET_EVENTS.QUESTION_REFUNDED, handleQuestionRefunded);
    socket.on(SOCKET_EVENTS.NEW_COMMENT, handleNewComment);

    return () => {
      socket.off(SOCKET_EVENTS.WALLET_BALANCE_UPDATED, handleWalletBalanceUpdated);
      socket.off(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
      socket.off(SOCKET_EVENTS.QUESTION_ANSWERED, handleQuestionChanged);
      socket.off(SOCKET_EVENTS.QUESTION_AI_ANSWERED, handleQuestionChanged);
      socket.off(SOCKET_EVENTS.QUESTION_REFUNDED, handleQuestionRefunded);
      socket.off(SOCKET_EVENTS.NEW_COMMENT, handleNewComment);
      disconnectSocket();
    };
  }, [accessToken, hydrated, isAuthenticated]);
}
