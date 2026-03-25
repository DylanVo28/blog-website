"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FilePenLine, HelpCircle, WalletCards } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { PendingQuestions } from "@/components/dashboard/PendingQuestions";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { TopPosts } from "@/components/dashboard/TopPosts";
import { Button } from "@/components/ui/button";
import { attachQuestionPosts } from "@/lib/dashboard";
import { postsApi } from "@/services/api/posts.api";
import { questionsApi } from "@/services/api/questions.api";
import { walletApi } from "@/services/api/wallet.api";
import { useAuthStore } from "@/stores/authStore";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const earningsQuery = useQuery({
    queryKey: ["wallet", "earnings"],
    queryFn: () => walletApi.getEarnings(),
  });

  const transactionsQuery = useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: () => walletApi.getTransactions(),
  });

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

  const publishedPosts = publishedPostsQuery.data ?? [];
  const pendingQuestions = attachQuestionPosts(
    pendingQuestionsQuery.data ?? [],
    publishedPosts,
  );
  const isStatsLoading =
    earningsQuery.isLoading || transactionsQuery.isLoading || publishedPostsQuery.isLoading;

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
                Dashboard tác giả
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Theo dõi doanh thu từ câu hỏi premium, xem nội dung nào đang hút độc giả và xử lý
                nhanh các câu hỏi đang chờ trước khi payout bị treo quá lâu.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard/posts">
                  <FilePenLine className="size-4" />
                  Quản lý bài viết
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/questions">
                  <HelpCircle className="size-4" />
                  Câu hỏi cần trả lời
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/wallet">
                  <WalletCards className="size-4" />
                  Mở ví
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/posts/new">
                  Viết bài mới
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <StatsCards
          earnings={earningsQuery.data}
          transactions={transactionsQuery.data}
          pendingQuestionCount={pendingQuestions.length}
          publishedPostCount={publishedPosts.length}
          isLoading={isStatsLoading}
        />

        <EarningsChart
          transactions={transactionsQuery.data}
          availableToWithdraw={earningsQuery.data?.availableToWithdraw}
          isLoading={earningsQuery.isLoading || transactionsQuery.isLoading}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <PendingQuestions
            questions={pendingQuestions}
            isLoading={pendingQuestionsQuery.isLoading || publishedPostsQuery.isLoading}
          />
          <TopPosts posts={publishedPosts} isLoading={publishedPostsQuery.isLoading} />
        </div>
      </div>
    </AuthGuard>
  );
}
