import Link from "next/link";
import { ArrowRight, FilePenLine } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Card className="paper-grid">
        <CardHeader>
          <CardTitle className="text-3xl">Dashboard tác giả</CardTitle>
          <CardDescription>
            Phase 3 đã mở được luồng quản lý bài viết. Phase 7 sẽ tiếp tục mở rộng phần
            earnings, charts và activity feed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard/posts">
              <FilePenLine className="size-4" />
              Quản lý bài viết
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/posts/new">
              Viết bài mới
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </AuthGuard>
  );
}
