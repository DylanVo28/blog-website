"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextParams = new URLSearchParams(searchParams.toString());
    const trimmedQuery = String(formData.get("q") ?? "").trim();

    if (trimmedQuery) {
      nextParams.set("q", trimmedQuery);
    } else {
      nextParams.delete("q");
    }

    const nextUrl = nextParams.toString()
      ? `/explore?${nextParams.toString()}`
      : "/explore";

    startTransition(() => {
      router.push(nextUrl);
    });
  }

  return (
    <form key={initialQuery} onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name="q"
        defaultValue={initialQuery}
        placeholder="Tìm bài viết, tác giả, chủ đề..."
        className="h-11 rounded-full border-border/70 bg-card/75 pl-10 pr-4"
        aria-label="Tìm kiếm bài viết"
      />
    </form>
  );
}
