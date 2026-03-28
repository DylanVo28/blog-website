"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { CategoryFilter } from "@/components/posts/CategoryFilter";
import { PostCard } from "@/components/posts/PostCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { InfiniteScroll } from "@/components/shared/InfiniteScroll";
import { Skeleton } from "@/components/ui/skeleton";
import { postsApi } from "@/services/api/posts.api";

interface PostFeedProps {
  title: string;
  description: string;
}

export function PostFeed({ title, description }: PostFeedProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const tag = searchParams.get("tag")?.trim() ?? "";

  const postsQuery = useInfiniteQuery({
    queryKey: ["posts", "feed", query, tag],
    queryFn: ({ pageParam = 1 }) =>
      postsApi.getAll({
        page: pageParam,
        limit: 10,
        search: query || undefined,
        tag: tag || undefined,
      }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const posts = postsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const seen = new Map<string, { id: string; name: string; slug?: string }>();
  posts.forEach((post) => {
    post.tags.forEach((tagItem) => {
      if (!seen.has(tagItem.id)) {
        seen.set(tagItem.id, tagItem);
      }
    });
  });
  const availableTags = [...seen.values()].slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="surface-panel rounded-[2rem] border border-border/70 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--color-primary)_16%,transparent),transparent_38%),radial-gradient(circle_at_bottom_right,color-mix(in_oklab,var(--color-accent)_22%,transparent),transparent_46%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_92%,var(--color-background)_8%),color-mix(in_oklab,var(--color-card)_78%,var(--color-accent)_22%))] px-6 py-8 shadow-sm">
        <h1 className="font-serif text-4xl font-medium tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">{description}</p>
        {query ? (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-[color-mix(in_oklab,var(--color-card)_84%,transparent)] px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
            <Search className="size-4 text-primary" />
            Kết quả cho: <span className="font-semibold text-foreground">{query}</span>
          </div>
        ) : null}
      </div>

      <CategoryFilter availableTags={availableTags} />

      {postsQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full rounded-[1.75rem]" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title="Chưa có bài viết phù hợp"
          description="Hãy thử tìm bằng từ khóa khác hoặc bỏ bộ lọc hiện tại để xem thêm nội dung."
        />
      ) : (
        <InfiniteScroll
          hasMore={Boolean(postsQuery.hasNextPage)}
          isLoading={postsQuery.isFetchingNextPage}
          onLoadMore={() => {
            void postsQuery.fetchNextPage();
          }}
        >
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
}
