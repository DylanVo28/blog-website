"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { detectQuestionIntent } from "@/lib/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { QuestionSuggestion } from "@/components/comments/QuestionSuggestion";
import { commentsApi } from "@/services/api/comments.api";
import { useAuthStore } from "@/stores/authStore";

interface CommentFormProps {
  postId: string;
  commentId?: string;
  parentId?: string;
  initialValue?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  onSwitchToQuestion?: (content: string) => void;
}

export function CommentForm({
  postId,
  commentId,
  parentId,
  initialValue = "",
  submitLabel,
  cancelLabel = "Hủy",
  onCancel,
  onSuccess,
  onSwitchToQuestion,
}: CommentFormProps) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [content, setContent] = useState(initialValue);
  const [dismissedSuggestion, setDismissedSuggestion] = useState(false);

  const createMutation = useMutation({
    mutationFn: () =>
      commentsApi.create({
        postId,
        content: content.trim(),
        parentId,
      }),
    onSuccess: (result) => {
      toast.success("Đã đăng bình luận.");
      if (result.suggestion?.show && !detectQuestionIntent(content)) {
        toast.info("Nếu bạn cần ưu tiên trả lời, hãy thử tính năng Question trả phí.");
      }
      void queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setContent("");
      setDismissedSuggestion(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể đăng bình luận."));
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      commentsApi.update(commentId!, {
        content: content.trim(),
        parentId,
      }),
    onSuccess: () => {
      toast.success("Đã cập nhật bình luận.");
      void queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật bình luận."));
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const shouldSuggestQuestion = detectQuestionIntent(content) && !dismissedSuggestion;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated) {
      return;
    }

    if (content.trim().length < 2) {
      toast.error("Bình luận cần ít nhất 2 ký tự.");
      return;
    }

    if (commentId) {
      void updateMutation.mutateAsync();
      return;
    }

    void createMutation.mutateAsync();
  }

  if (!isAuthenticated) {
    return (
      <div className="surface-panel rounded-[1.4rem] border border-dashed border-border/80 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_74%,transparent),color-mix(in_oklab,var(--color-muted)_62%,transparent))] p-4">
        <p className="text-sm text-muted-foreground">Đăng nhập để viết bình luận.</p>
        <Button asChild className="mt-3" size="sm">
          <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>Đăng nhập</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="surface-panel space-y-3 rounded-[1.6rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--color-primary)_12%,transparent),transparent_46%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_90%,transparent),color-mix(in_oklab,var(--color-card)_78%,var(--color-accent)_22%))] p-4 shadow-sm"
    >
      {shouldSuggestQuestion ? (
        <QuestionSuggestion
          onDismiss={() => setDismissedSuggestion(true)}
          onSwitchToQuestion={() => {
            onSwitchToQuestion?.(content.trim());
          }}
        />
      ) : null}

      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={parentId ? 3 : 4}
        placeholder={
          parentId
            ? "Viết phản hồi của bạn..."
            : "Chia sẻ suy nghĩ của bạn về bài viết này..."
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Bình luận được hiển thị công khai cho mọi người đọc.
        </p>
        <div className="flex gap-2">
          {onCancel ? (
            <Button type="button" variant="outline" size="sm" onClick={onCancel}>
              {cancelLabel}
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting
              ? "Đang lưu..."
              : submitLabel ?? (commentId ? "Lưu chỉnh sửa" : "Đăng bình luận")}
          </Button>
        </div>
      </div>
    </form>
  );
}
