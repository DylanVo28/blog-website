"use client";

import { useQuery } from "@tanstack/react-query";
import { FileSearch } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PostForm } from "@/components/posts/PostForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { postsApi } from "@/services/api/posts.api";
import { useAuthStore } from "@/stores/authStore";

interface EditPostScreenProps {
  slug: string;
}

export function EditPostScreen({ slug }: EditPostScreenProps) {
  const user = useAuthStore((state) => state.user);

  const postQuery = useQuery({
    queryKey: ["posts", "editable", user?.id, slug],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      if (!user?.id) {
        return null;
      }

      const [drafts, published] = await Promise.all([
        postsApi.getMine(user.id, { status: "draft", limit: 100 }),
        postsApi.getMine(user.id, { status: "published", limit: 100 }),
      ]);

      return [...drafts.data, ...published.data].find((item) => item.slug === slug) ?? null;
    },
  });

  return (
    <AuthGuard>
      {postQuery.isLoading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner label="Đang tải bài viết để chỉnh sửa..." />
        </div>
      ) : postQuery.data ? (
        <PostForm mode="edit" post={postQuery.data} />
      ) : (
        <EmptyState
          icon={<FileSearch className="size-6" />}
          title="Không tìm thấy bài viết để chỉnh sửa"
          description="Bài viết này có thể không thuộc tài khoản hiện tại hoặc backend chưa hỗ trợ truy cập bản nháp theo slug."
          actionHref="/dashboard/posts"
          actionLabel="Quay lại quản lý bài viết"
        />
      )}
    </AuthGuard>
  );
}
