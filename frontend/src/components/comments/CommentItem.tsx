"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquareReply, PencilLine, Trash2 } from "lucide-react";
import { useState } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { formatRelativeTime } from "@/lib/formatters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CommentForm } from "@/components/comments/CommentForm";
import { ExpandableText } from "@/components/shared/ExpandableText";
import { commentsApi } from "@/services/api/comments.api";
import { useAuthStore } from "@/stores/authStore";
import type { Comment } from "@/types/comment.types";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  depth?: number;
  onSwitchToQuestion?: (content: string) => void;
}

export function CommentItem({
  comment,
  postId,
  depth = 0,
  onSwitchToQuestion,
}: CommentItemProps) {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const isOwner = user?.id === comment.authorId;

  const deleteMutation = useMutation({
    mutationFn: () => commentsApi.remove(comment.id),
    onSuccess: () => {
      toast.success("Đã xóa bình luận.");
      void queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể xóa bình luận."));
    },
  });

  return (
    <div
      className="surface-panel space-y-3 rounded-[1.5rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--color-primary)_10%,transparent),transparent_52%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,var(--color-accent)_26%))] p-4 shadow-sm"
      style={{ marginLeft: depth > 0 ? `${Math.min(depth, 3) * 1.25}rem` : undefined }}
    >
      <div className="flex items-start gap-3">
        <Avatar className="mt-0.5 size-10">
          <AvatarImage src={comment.author.avatarUrl ?? undefined} alt={comment.author.displayName} />
          <AvatarFallback name={comment.author.displayName} />
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{comment.author.displayName}</p>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          {isEditing ? (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                commentId={comment.id}
                parentId={comment.parentId ?? undefined}
                initialValue={comment.content}
                onCancel={() => setIsEditing(false)}
                onSuccess={() => setIsEditing(false)}
                onSwitchToQuestion={onSwitchToQuestion}
              />
            </div>
          ) : (
            <ExpandableText
              className="mt-2"
              content={comment.content}
              collapsedMaxHeight={112}
              contentClassName="text-sm leading-7 text-foreground/92"
            />
          )}

          {!isEditing ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying((value) => !value)}
              >
                <MessageSquareReply className="size-4" />
                Trả lời
              </Button>

              {isOwner ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <PencilLine className="size-4" />
                  Sửa
                </Button>
              ) : null}

              {isOwner ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    const confirmed = window.confirm("Xóa bình luận này?");
                    if (confirmed) {
                      void deleteMutation.mutateAsync();
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                  Xóa
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {isReplying ? (
        <CommentForm
          postId={postId}
          parentId={comment.id}
          submitLabel="Gửi phản hồi"
          cancelLabel="Đóng"
          onCancel={() => setIsReplying(false)}
          onSuccess={() => setIsReplying(false)}
          onSwitchToQuestion={onSwitchToQuestion}
        />
      ) : null}

      {comment.children.length > 0 ? (
        <div className="space-y-3 border-l border-border/70 pl-2">
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              postId={postId}
              depth={depth + 1}
              onSwitchToQuestion={onSwitchToQuestion}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
