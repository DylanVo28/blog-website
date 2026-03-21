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
  authorId: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  contentPlain?: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  coverImage?: string | null;
  categoryId?: string | null;
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

export interface BackendPostRecord {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  contentPlain: string | null;
  excerpt: string | null;
  coverImage: string | null;
  categoryId: string | null;
  status: PostStatus;
  viewCount: number | string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export interface BackendPostsListResult {
  page: number;
  limit: number;
  total: number;
  items: BackendPostRecord[];
}

export interface CreatePostPayload {
  title: string;
  slug?: string;
  content: Record<string, unknown>;
  contentPlain?: string;
  excerpt?: string;
  categoryId?: string;
  tagIds?: string[];
  coverImage?: File | null;
  coverImageUrl?: string | null;
  status?: "draft" | "published";
}

export type UpdatePostPayload = Partial<CreatePostPayload>;
