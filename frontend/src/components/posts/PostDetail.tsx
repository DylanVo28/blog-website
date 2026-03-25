"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, FilePenLine } from "lucide-react";
import { useRef } from "react";
import { PostMeta } from "@/components/posts/PostMeta";
import { TextSelectionPopup } from "@/components/posts/TextSelectionPopup";
import { TagList } from "@/components/posts/TagList";
import { RichTextRenderer } from "@/components/shared/RichTextRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Post } from "@/types/post.types";

interface PostDetailProps {
  post: Post;
  onAskAI?: (selectedText: string) => void;
}

export function PostDetail({ post, onAskAI }: PostDetailProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Button asChild variant="ghost" className="px-0">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Quay lại feed
          </Link>
        </Button>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={post.status === "published" ? "default" : "secondary"}>
              {post.status === "published" ? "Published" : "Draft"}
            </Badge>
            {post.category ? <Badge variant="outline">{post.category.name}</Badge> : null}
          </div>

          <h1 className="font-serif text-4xl font-medium leading-tight tracking-tight text-balance md:text-6xl">
            {post.title}
          </h1>

          {post.excerpt ? (
            <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{post.excerpt}</p>
          ) : null}

          <PostMeta post={post} />
          <TagList tags={post.tags} />
        </div>
      </div>

      {post.coverImageUrl ? (
        <div className="overflow-hidden rounded-[2rem] border border-border/70">
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            width={1400}
            height={840}
            sizes="100vw"
            className="max-h-[520px] w-full object-cover"
          />
        </div>
      ) : null}

      <div
        ref={contentRef}
        className="rounded-[2rem] border border-border/70 bg-card/75 px-5 py-6 shadow-sm md:px-8"
      >
        <RichTextRenderer content={post.content} />
      </div>

      <div className="rounded-[1.6rem] border border-dashed border-border/80 bg-muted/40 px-5 py-4 text-sm leading-6 text-muted-foreground">
        <span className="inline-flex items-center gap-2 font-medium text-foreground">
          <FilePenLine className="size-4 text-primary" />
          Gợi ý tương tác
        </span>
        <p className="mt-2">
          Bạn có thể bôi đen một đoạn trong bài để mở shortcut hỏi AI, hoặc kéo xuống phần
          question để đặt câu hỏi nổi bật cho tác giả.
        </p>
      </div>

      {onAskAI ? (
        <TextSelectionPopup containerRef={contentRef} onAskAI={onAskAI} />
      ) : null}
    </div>
  );
}
