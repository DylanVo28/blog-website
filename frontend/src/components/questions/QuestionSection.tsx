"use client";

import { useQuery } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { QuestionForm } from "@/components/questions/QuestionForm";
import { QuestionItem } from "@/components/questions/QuestionItem";
import { questionsApi } from "@/services/api/questions.api";
import { useAuthStore } from "@/stores/authStore";
import type { QuestionPostRef, QuestionPrefill } from "@/types/question.types";

interface QuestionSectionProps {
  postId: string;
  authorId: string;
  postTitle?: string;
  postSlug?: string;
  prefill?: QuestionPrefill | null;
}

export function QuestionSection({
  postId,
  authorId,
  postTitle,
  postSlug,
  prefill,
}: QuestionSectionProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthor = user?.id === authorId;
  const postRef: QuestionPostRef = {
    id: postId,
    title: postTitle ?? null,
    slug: postSlug ?? null,
  };

  const questionsQuery = useQuery({
    queryKey: ["questions", postId],
    queryFn: () => questionsApi.getByPost(postId, postRef),
    refetchInterval: 15_000,
  });

  const questions = questionsQuery.data ?? [];

  return (
    <div className="space-y-6">
      {!isAuthor ? (
        <QuestionForm post={postRef} prefill={prefill} />
      ) : (
        <div className="surface-panel rounded-[1.6rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--color-primary)_14%,transparent),transparent_46%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_90%,transparent),color-mix(in_oklab,var(--color-card)_76%,var(--color-accent)_24%))] p-5 shadow-sm">
          <p className="text-sm leading-6 text-muted-foreground">
            Đây là các câu hỏi trả phí dành cho bài viết của bạn. Bạn có thể trả lời trực tiếp
            ngay bên dưới để giữ trải nghiệm premium cho độc giả.
          </p>
        </div>
      )}

      {questionsQuery.isLoading ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <LoadingSpinner label="Đang tải câu hỏi..." />
        </div>
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<HelpCircle className="size-6" />}
          title="Chưa có câu hỏi nào"
          description="Hãy là người đầu tiên đặt một câu hỏi nổi bật cho tác giả hoặc AI."
        />
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionItem key={question.id} question={question} isAuthor={isAuthor} />
          ))}
        </div>
      )}
    </div>
  );
}
