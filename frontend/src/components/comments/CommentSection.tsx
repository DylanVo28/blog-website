"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageSquareText } from "lucide-react";
import { usePathname } from "next/navigation";
import { CommentForm } from "@/components/comments/CommentForm";
import { CommentItem } from "@/components/comments/CommentItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { commentsApi } from "@/services/api/comments.api";
import { useAuthStore } from "@/stores/authStore";
import type { Comment } from "@/types/comment.types";

interface CommentSectionProps {
  postId: string;
  onSwitchToQuestion?: (content: string) => void;
}

function countComments(items: Comment[]): number {
  return items.reduce((total, item) => total + 1 + countComments(item.children), 0);
}

export function CommentSection({ postId, onSwitchToQuestion }: CommentSectionProps) {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const commentsQuery = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => commentsApi.getByPost(postId),
  });

  const comments = commentsQuery.data ?? [];
  const totalComments = countComments(comments);

  return (
    <div className="space-y-6">
      <div className="rounded-[1.6rem] border border-border/70 bg-white/80 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
              Discussion
            </p>
            <h3 className="mt-2 font-serif text-3xl font-medium tracking-tight">
              Bình luận miễn phí
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Chia sẻ cảm nhận, góp ý hoặc trả lời qua lại với cộng đồng bên dưới.
            </p>
          </div>

          <div className="rounded-full border border-border/70 bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
            {totalComments} bình luận
          </div>
        </div>
      </div>

      {isAuthenticated ? (
        <CommentForm postId={postId} onSwitchToQuestion={onSwitchToQuestion} />
      ) : (
        <div className="rounded-[1.6rem] border border-dashed border-border/80 bg-muted/35 p-5">
          <p className="text-sm leading-6 text-muted-foreground">
            Đăng nhập để bình luận hoặc tiếp tục cuộc trò chuyện với tác giả.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>Đăng nhập để bình luận</Link>
          </Button>
        </div>
      )}

      {commentsQuery.isLoading ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <LoadingSpinner label="Đang tải bình luận..." />
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText className="size-6" />}
          title="Chưa có bình luận nào"
          description="Hãy là người đầu tiên để lại phản hồi cho bài viết này."
        />
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onSwitchToQuestion={onSwitchToQuestion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
