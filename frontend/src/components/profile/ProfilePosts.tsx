import { FileText } from "lucide-react";
import { PostCard } from "@/components/posts/PostCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Post } from "@/types/post.types";

interface ProfilePostsProps {
  posts: Post[];
  displayName: string;
}

export function ProfilePosts({ posts, displayName }: ProfilePostsProps) {
  if (!posts.length) {
    return (
      <EmptyState
        icon={<FileText className="size-6" />}
        title="Chưa có bài viết công khai"
        description={`${displayName} chưa xuất bản bài viết nào hoặc đang giữ bài ở trạng thái draft.`}
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
          Published Stories
        </p>
        <h2 className="text-2xl font-semibold text-foreground">
          {displayName} đã xuất bản {posts.length} bài viết
        </h2>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
