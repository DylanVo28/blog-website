import type { AuthorInfo } from "@/types/user.types";

export type PostStatus = "draft" | "published" | "archived";

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Tag {
  id: string;
  name: string;
  slug?: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string | Record<string, unknown>;
  contentPlain?: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  category: Category | null;
  tags: Tag[];
  author: AuthorInfo;
  status: PostStatus;
  viewCount: number;
  commentCount: number;
  questionCount: number;
  likeCount: number;
  readingTime: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
