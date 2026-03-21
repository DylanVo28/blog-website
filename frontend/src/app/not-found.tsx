import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="surface-panel max-w-xl rounded-[2rem] border border-border/70 px-8 py-10 shadow-lg">
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Compass className="size-7" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-balance">
          Trang bạn tìm không tồn tại.
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Có thể route này chưa được triển khai ở phase hiện tại hoặc đường dẫn đã
          thay đổi.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Quay về trang chủ
          </Link>
        </Button>
      </div>
    </main>
  );
}
