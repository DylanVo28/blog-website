"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CircleDollarSign, HelpCircle, TimerReset } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { QuestionItem } from "@/components/questions/QuestionItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { attachQuestionPosts } from "@/lib/dashboard";
import { formatCurrency, formatRelativeTime } from "@/lib/formatters";
import { postsApi } from "@/services/api/posts.api";
import { questionsApi } from "@/services/api/questions.api";
import { useAuthStore } from "@/stores/authStore";

export function QuestionsDashboard() {
  const user = useAuthStore((state) => state.user);

  const pendingQuestionsQuery = useQuery({
    queryKey: ["questions", "pending"],
    queryFn: () => questionsApi.getPending(),
    refetchInterval: 15_000,
  });

  const publishedPostsQuery = useQuery({
    queryKey: ["posts", "mine", user?.id, "published", "dashboard"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      const response = await postsApi.getMine(user.id, {
        status: "published",
        limit: 100,
      });

      return response.data;
    },
  });

  const questions = attachQuestionPosts(
    pendingQuestionsQuery.data ?? [],
    publishedPostsQuery.data ?? [],
  );
  const pendingAmount = questions.reduce((total, question) => total + question.fee, 0);
  const nearestDeadline = [...questions]
    .filter((question) => question.deadlineAt)
    .sort((left, right) => {
      const leftTime = new Date(left.deadlineAt ?? left.createdAt).getTime();
      const rightTime = new Date(right.deadlineAt ?? right.createdAt).getTime();
      return leftTime - rightTime;
    })[0];
  const isLoading = pendingQuestionsQuery.isLoading || publishedPostsQuery.isLoading;

  return (
    <AuthGuard>
      <div className="space-y-6">
        <section className="surface-panel rounded-[1.9rem] border border-border/70 px-6 py-6 shadow-[0_24px_70px_-46px_rgba(25,32,56,0.35)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">
                Phase 7
              </p>
              <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight">
                Hộp thư câu hỏi của tác giả
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Gom toàn bộ câu hỏi premium đang chờ phản hồi vào một nơi để bạn trả lời nhanh,
                giữ doanh thu ổn định và giảm rủi ro hoàn tiền sau 48 giờ.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard">
                  <ArrowLeft className="size-4" />
                  Về overview
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/posts">Mở quản lý bài viết</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <HelpCircle className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đang chờ phản hồi</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {isLoading ? "..." : questions.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <CircleDollarSign className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giá trị đang chờ giải ngân</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">
                    {isLoading ? "..." : formatCurrency(pendingAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <TimerReset className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deadline gần nhất</p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {isLoading
                      ? "..."
                      : nearestDeadline?.deadlineAt
                        ? formatRelativeTime(nearestDeadline.deadlineAt)
                        : "Chưa có deadline"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách câu hỏi cần xử lý</CardTitle>
            <CardDescription>
              Trả lời trực tiếp bên dưới. Khi phản hồi thành công, danh sách sẽ tự cập nhật.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex min-h-[24rem] items-center justify-center">
                <LoadingSpinner label="Đang tải hộp thư câu hỏi..." />
              </div>
            ) : questions.length === 0 ? (
              <EmptyState
                icon={<HelpCircle className="size-6" />}
                title="Hộp thư câu hỏi đang trống"
                description="Bạn đã xử lý hết các câu hỏi premium hiện tại. Khi có câu hỏi mới, chúng sẽ xuất hiện tại đây."
                actionHref="/dashboard"
                actionLabel="Quay về dashboard"
              />
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="space-y-3">
                    <div className="rounded-[1.2rem] border border-border/70 bg-white/78 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
                        Bài viết liên quan
                      </p>
                      {question.post?.slug ? (
                        <Link
                          href={`/posts/${question.post.slug}`}
                          className="mt-1 block text-sm font-semibold text-foreground transition-colors hover:text-primary"
                        >
                          {question.post.title ?? "Xem bài viết"}
                        </Link>
                      ) : (
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {question.post?.title ?? "Bài viết chưa đồng bộ tiêu đề"}
                        </p>
                      )}
                    </div>

                    <QuestionItem question={question} isAuthor />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
