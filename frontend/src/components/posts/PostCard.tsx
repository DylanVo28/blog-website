import Image from "next/image";
import Link from "next/link";
import { Clock3, Eye, MessageCircleMore, Sparkles } from "lucide-react";
import { formatRelativeTime } from "@/lib/formatters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Post } from "@/types/post.types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const authorHref = `/profile/${post.author.username ?? post.author.id}`;

  return (
    <Card className="overflow-hidden transition-transform hover:-translate-y-0.5">
      <CardContent className="p-0">
        <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="p-5 md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <Link href={authorHref} className="inline-flex items-center gap-2">
                <Avatar className="size-9">
                  <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.displayName} />
                  <AvatarFallback name={post.author.displayName} />
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{post.author.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(post.publishedAt ?? post.createdAt)}
                  </p>
                </div>
              </Link>
            </div>

            <Link href={`/posts/${post.slug}`} className="group block">
              <h2 className="text-2xl font-semibold tracking-tight text-balance transition-colors group-hover:text-primary">
                {post.title}
              </h2>
            </Link>

            <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
              {post.excerpt ?? post.contentPlain ?? "Bài viết này chưa có phần tóm tắt."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag.id} variant="outline">
                  #{tag.name}
                </Badge>
              ))}
              {post.status !== "published" ? (
                <Badge variant="secondary">Draft</Badge>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-4" />
                {post.readingTime} phút
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-4" />
                {post.viewCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircleMore className="size-4" />
                {post.commentCount} bình luận
              </span>
              <span className="inline-flex items-center gap-1 text-primary">
                <Sparkles className="size-4" />
                {post.questionCount} câu hỏi
              </span>
            </div>
          </div>

          {post.coverImageUrl ? (
            <div className="border-l border-border/70 bg-muted/30">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                width={640}
                height={480}
                sizes="(max-width: 768px) 100vw, 220px"
                className="h-full min-h-48 w-full object-cover"
              />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
