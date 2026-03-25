import Link from "next/link";
import { ArrowRight, Clock3, Eye, PencilLine } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { rankTopPosts } from "@/lib/dashboard";
import { formatRelativeTime } from "@/lib/formatters";
import type { Post } from "@/types/post.types";

interface TopPostsProps {
  posts: Post[];
  isLoading?: boolean;
}

export function TopPosts({ posts, isLoading = false }: TopPostsProps) {
  const topPosts = rankTopPosts(posts);

  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>Bài viết nổi bật của bạn</CardTitle>
          <CardDescription>
            Xếp theo lượt xem thực tế hiện có để bạn biết nội dung nào đang kéo nhiều độc giả nhất.
          </CardDescription>
        </div>

        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/posts">
            Quản lý bài viết
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex min-h-[18rem] items-center justify-center">
            <LoadingSpinner label="Đang phân tích bài viết..." />
          </div>
        ) : topPosts.length === 0 ? (
          <EmptyState
            title="Chưa có bài viết đã xuất bản"
            description="Xuất bản ít nhất một bài để dashboard bắt đầu theo dõi hiệu suất và xếp hạng nội dung nổi bật."
            actionHref="/posts/new"
            actionLabel="Viết bài mới"
          />
        ) : (
          <div className="space-y-3">
            {topPosts.map((post, index) => (
              <div
                key={post.id}
                className="rounded-[1.45rem] border border-border/70 bg-white/80 p-4"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                    #{index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/posts/${post.slug}`}
                          className="line-clamp-2 text-lg font-semibold text-foreground transition-colors hover:text-primary"
                        >
                          {post.title}
                        </Link>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {post.excerpt ?? post.contentPlain ?? "Bài viết chưa có phần mô tả ngắn."}
                        </p>
                      </div>

                      <Button asChild variant="outline" size="sm">
                        <Link href={`/posts/${post.slug}/edit`}>
                          <PencilLine className="size-4" />
                          Sửa bài
                        </Link>
                      </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-4" />
                        {post.viewCount} lượt xem
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-4" />
                        {post.readingTime} phút đọc
                      </span>
                      <span>Xuất bản {formatRelativeTime(post.publishedAt ?? post.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
