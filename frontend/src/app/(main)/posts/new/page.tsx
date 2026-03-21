import { AuthGuard } from "@/components/auth/AuthGuard";
import { PagePlaceholder } from "@/components/shared/PagePlaceholder";

export default function NewPostPage() {
  return (
    <AuthGuard>
      <PagePlaceholder
        phase="Phase 3"
        title="Editor tạo bài viết sẽ được dựng ở phase posts."
        description="Protected route này đã có proxy và auth guard để sẵn sàng cho TipTap editor và upload flow."
      />
    </AuthGuard>
  );
}
