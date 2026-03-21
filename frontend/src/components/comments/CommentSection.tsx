import { EmptyState } from "@/components/shared/EmptyState";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  void postId;

  return (
    <EmptyState
      title="Comment system sẽ tới ở phase 4"
      description="Layout detail page đã sẵn. Khi phase 4 bắt đầu, phần bình luận sẽ được cắm trực tiếp vào tab này."
    />
  );
}
