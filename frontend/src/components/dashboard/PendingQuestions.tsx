import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";
import { QuestionItem } from "@/components/questions/QuestionItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/formatters";
import type { Question } from "@/types/question.types";

interface PendingQuestionsProps {
  questions: Question[];
  isLoading?: boolean;
}

export function PendingQuestions({
  questions,
  isLoading = false,
}: PendingQuestionsProps) {
  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Câu hỏi cần trả lời</CardTitle>
          <CardDescription>
            Trả lời ngay trong dashboard để mở khóa payout và tránh luồng hoàn tiền tự động.
          </CardDescription>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/questions">
            Xem tất cả
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex min-h-[18rem] items-center justify-center">
            <LoadingSpinner label="Đang tải câu hỏi chờ phản hồi..." />
          </div>
        ) : questions.length === 0 ? (
          <EmptyState
            icon={<HelpCircle className="size-6" />}
            title="Không có câu hỏi nào đang chờ"
            description="Khi độc giả gửi câu hỏi premium cho bài viết của bạn, danh sách sẽ xuất hiện ở đây để bạn xử lý nhanh."
          />
        ) : (
          <div className="space-y-4">
            {questions.slice(0, 3).map((question) => (
              <div key={question.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[1.2rem] border border-border/70 bg-white/78 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                      Bài viết
                    </p>
                    {question.post?.slug ? (
                      <Link
                        href={`/posts/${question.post.slug}`}
                        className="mt-1 block text-sm font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        {question.post.title ?? "Xem bài viết liên quan"}
                      </Link>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {question.post?.title ?? "Bài viết chưa đồng bộ tiêu đề"}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Nhận {formatRelativeTime(question.createdAt)}
                  </p>
                </div>

                <QuestionItem question={question} isAuthor />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
