"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileStack, PencilLine, Rocket, Trash2 } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/api";
import { formatRelativeTime } from "@/lib/formatters";
import { postsApi } from "@/services/api/posts.api";
import { useAuthStore } from "@/stores/authStore";
import type { PostStatus } from "@/types/post.types";

const statusTabs: PostStatus[] = ["draft", "published", "archived"];

export function PostsDashboard() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeStatus = (searchParams.get("status") as PostStatus | null) ?? "draft";

  const postsQuery = useQuery({
    queryKey: ["posts", "mine", user?.id, activeStatus],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      const response = await postsApi.getMine(user.id, {
        status: activeStatus,
        limit: 50,
      });

      return response.data;
    },
  });

  const publishMutation = useMutation({
    mutationFn: (postId: string) => postsApi.publish(postId),
    onSuccess: () => {
      toast.success("Đã xuất bản bài viết.");
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể xuất bản bài viết."));
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (postId: string) => postsApi.remove(postId),
    onSuccess: () => {
      toast.success("Đã lưu trữ bài viết.");
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể lưu trữ bài viết."));
    },
  });

  return (
    <AuthGuard>
      <div className="space-y-6">
        <Card className="paper-grid">
          <CardHeader>
            <CardTitle className="text-3xl">Quản lý bài viết của tôi</CardTitle>
            <CardDescription>
              Theo dõi draft, bài đã xuất bản và chỉnh sửa/lưu trữ nội dung ngay trong không gian
              dashboard tác giả của phase 7.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/posts/new">Tạo bài viết mới</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/questions">Mở hộp thư câu hỏi</Link>
            </Button>
          </CardContent>
        </Card>

        <Tabs value={activeStatus}>
          <TabsList>
            {statusTabs.map((status) => (
              <TabsTrigger key={status} value={status} asChild>
                <Link href={`/dashboard/posts?status=${status}`}>{status}</Link>
              </TabsTrigger>
            ))}
          </TabsList>

          {statusTabs.map((status) => (
            <TabsContent key={status} value={status}>
              {postsQuery.isLoading ? (
                <div className="flex min-h-[40vh] items-center justify-center">
                  <LoadingSpinner label="Đang tải danh sách bài viết..." />
                </div>
              ) : status === activeStatus && postsQuery.data && postsQuery.data.length > 0 ? (
                <div className="space-y-4">
                  {postsQuery.data.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{post.status}</span>
                            <span>•</span>
                            <span>{formatRelativeTime(post.updatedAt)}</span>
                          </div>
                          <h3 className="text-xl font-semibold text-foreground">{post.title}</h3>
                          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                            {post.excerpt ?? post.contentPlain ?? "Chưa có mô tả ngắn cho bài viết này."}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button asChild variant="outline">
                            <Link href={`/posts/${post.slug}/edit`}>
                              <PencilLine className="size-4" />
                              Chỉnh sửa
                            </Link>
                          </Button>

                          {post.status === "published" ? (
                            <Button asChild variant="outline">
                              <Link href={`/posts/${post.slug}`}>Xem bài viết</Link>
                            </Button>
                          ) : null}

                          {post.status === "draft" ? (
                            <Button
                              type="button"
                              onClick={() => {
                                void publishMutation.mutateAsync(post.id);
                              }}
                              disabled={publishMutation.isPending}
                            >
                              <Rocket className="size-4" />
                              Xuất bản
                            </Button>
                          ) : null}

                          {post.status !== "archived" ? (
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => {
                                const confirmed = window.confirm("Lưu trữ bài viết này?");
                                if (confirmed) {
                                  void archiveMutation.mutateAsync(post.id);
                                }
                              }}
                              disabled={archiveMutation.isPending}
                            >
                              <Trash2 className="size-4" />
                              Lưu trữ
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : status === activeStatus ? (
                <EmptyState
                  icon={<FileStack className="size-6" />}
                  title="Chưa có bài viết ở trạng thái này"
                  description="Tạo bài viết mới hoặc chuyển trạng thái ở tab khác để nội dung xuất hiện tại đây."
                  actionHref="/posts/new"
                  actionLabel="Tạo bài viết"
                />
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AuthGuard>
  );
}
