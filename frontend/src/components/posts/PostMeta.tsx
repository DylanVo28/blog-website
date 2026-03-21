import Link from "next/link";
import { Clock3, Eye, FileText } from "lucide-react";
import { formatRelativeTime } from "@/lib/formatters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Post } from "@/types/post.types";

interface PostMetaProps {
  post: Post;
}

export function PostMeta({ post }: PostMetaProps) {
  const authorHref = `/profile/${post.author.username ?? post.author.id}`;

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      <Link href={authorHref} className="inline-flex items-center gap-2 hover:text-foreground">
        <Avatar className="size-9">
          <AvatarImage src={post.author.avatarUrl ?? undefined} alt={post.author.displayName} />
          <AvatarFallback name={post.author.displayName} />
        </Avatar>
        <span className="font-medium text-foreground">{post.author.displayName}</span>
      </Link>
      <span>{formatRelativeTime(post.publishedAt ?? post.createdAt)}</span>
      <span className="inline-flex items-center gap-1">
        <Clock3 className="size-4" />
        {post.readingTime} phút đọc
      </span>
      <span className="inline-flex items-center gap-1">
        <Eye className="size-4" />
        {post.viewCount}
      </span>
      <span className="inline-flex items-center gap-1">
        <FileText className="size-4" />
        {post.status === "published" ? "Công khai" : "Bản nháp"}
      </span>
    </div>
  );
}
