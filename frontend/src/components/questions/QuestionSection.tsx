import { EmptyState } from "@/components/shared/EmptyState";

interface QuestionSectionProps {
  postId: string;
  authorId: string;
}

export function QuestionSection({ postId, authorId }: QuestionSectionProps) {
  void postId;
  void authorId;

  return (
    <EmptyState
      title="Paid question system sẽ tới ở phase 4"
      description="Nội dung bài viết và tabs đã sẵn để phần question trả phí được nối vào mà không cần làm lại detail page."
    />
  );
}
