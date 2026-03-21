import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, FilePenLine } from "lucide-react";
import { PostMeta } from "@/components/posts/PostMeta";
import { TagList } from "@/components/posts/TagList";
import { RichTextRenderer } from "@/components/shared/RichTextRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Post } from "@/types/post.types";

interface PostDetailProps {
  post: Post;
}

export function PostDetail({ post }: PostDetailProps) {
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
            unoptimized
            sizes="100vw"
            className="max-h-[520px] w-full object-cover"
          />
        </div>
      ) : null}

      <div className="rounded-[2rem] border border-border/70 bg-white/75 px-5 py-6 shadow-sm md:px-8">
        <RichTextRenderer content={post.content} />
      </div>

      <div className="rounded-[1.6rem] border border-dashed border-border/80 bg-muted/40 px-5 py-4 text-sm leading-6 text-muted-foreground">
        <span className="inline-flex items-center gap-2 font-medium text-foreground">
          <FilePenLine className="size-4 text-primary" />
          Phase 3 note
        </span>
        <p className="mt-2">
          Comment và question sẽ được nối thật ở phase 4. Hiện page detail đã sẵn layout,
          metadata và content renderer để ghép các section này vào ngay sau đó.
        </p>
      </div>
    </div>
  );
}
