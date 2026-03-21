"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Tag } from "@/types/post.types";

interface CategoryFilterProps {
  availableTags: Tag[];
}

export function CategoryFilter({ availableTags }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTag = searchParams.get("tag");

  function updateTag(nextTag?: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextTag) {
      params.set("tag", nextTag);
    } else {
      params.delete("tag");
    }

    const nextUrl = params.toString() ? `?${params.toString()}` : "";

    startTransition(() => {
      router.push(`/explore${nextUrl}`);
    });
  }

  if (availableTags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline">Filter</Badge>
        <p className="text-sm text-muted-foreground">
          Backend hiện chưa có taxonomy API riêng, nên frontend đang lọc theo tag có sẵn
          từ feed.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={activeTag ? "outline" : "default"}
          size="sm"
          onClick={() => updateTag(undefined)}
        >
          Tất cả
        </Button>
        {availableTags.map((tag) => {
          const value = tag.slug ?? tag.id;
          const isActive = activeTag === value;

          return (
            <Button
              key={tag.id}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => updateTag(value)}
            >
              #{tag.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
