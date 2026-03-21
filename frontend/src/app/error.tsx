"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="surface-panel max-w-xl rounded-[2rem] border border-border/70 px-8 py-10 shadow-lg">
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          Error Boundary
        </p>
        <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-balance">
          Có lỗi xảy ra khi render ứng dụng.
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {error.message || "Vui lòng thử tải lại trang hoặc quay lại sau."}
        </p>
        <Button className="mt-6" onClick={reset}>
          <RefreshCcw className="size-4" />
          Thử lại
        </Button>
      </div>
    </main>
  );
}
