import { PostFeed } from "@/components/posts/PostFeed";

export default function HomePage() {
  return (
    <PostFeed
      title="Bài viết mới nhất"
      description="Feed phase 3 đã nối API thật, author enrichment, tag filter và infinite scroll để bạn bắt đầu test hệ bài viết end-to-end."
    />
  );
}
