"use client";

import type { ReactNode } from "react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface InfiniteScrollProps {
  children: ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export function InfiniteScroll({
  children,
  hasMore,
  isLoading,
  onLoadMore,
}: InfiniteScrollProps) {
  const targetRef = useInfiniteScroll({
    enabled: hasMore && !isLoading,
    onLoadMore,
  });

  return (
    <div className="space-y-5">
      {children}
      <div ref={targetRef} className="flex min-h-10 items-center justify-center">
        {isLoading ? <LoadingSpinner label="Đang tải thêm bài viết..." /> : null}
      </div>
    </div>
  );
}
