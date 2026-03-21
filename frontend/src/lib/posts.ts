import type { PaginatedResponse } from "@/types/api.types";
import type {
  BackendPostRecord,
  BackendPostsListResult,
  CreatePostPayload,
  Post,
  Tag,
  UpdatePostPayload,
} from "@/types/post.types";
import type { UserProfile } from "@/types/user.types";

function toTextNode(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }

  const typedNode = node as {
    text?: string;
    type?: string;
    content?: unknown[];
  };

  const ownText = typeof typedNode.text === "string" ? typedNode.text : "";
  const childText = Array.isArray(typedNode.content)
    ? typedNode.content.map(toTextNode).join(" ")
    : "";
  const separator = typedNode.type === "paragraph" || typedNode.type === "heading" ? "\n" : " ";

  return `${ownText}${ownText && childText ? separator : ""}${childText}`.trim();
}

export function extractPlainTextFromContent(content: Record<string, unknown>) {
  const text = toTextNode(content)
    .replace(/\s+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();

  return text;
}

export function estimateReadingTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function buildExcerpt(text: string, maxLength: number = 180) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function buildFallbackAuthor(authorId: string): UserProfile {
  return {
    id: authorId,
    email: "",
    displayName: "Tác giả",
    avatarUrl: null,
    bio: null,
    role: "reader",
    isVerified: false,
    isBanned: false,
    bannedAt: null,
  };
}

function normalizeTags(tags: Tag[] | undefined) {
  return tags?.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug ?? tag.name.toLowerCase().replace(/\s+/g, "-"),
  })) ?? [];
}

export function normalizePostRecord(
  record: BackendPostRecord,
  author?: UserProfile | null,
): Post {
  const contentPlain = record.contentPlain ?? extractPlainTextFromContent(record.content);
  const excerpt = record.excerpt ?? (contentPlain ? buildExcerpt(contentPlain) : null);

  return {
    id: record.id,
    authorId: record.authorId,
    title: record.title,
    slug: record.slug,
    content: record.content,
    contentPlain,
    excerpt,
    coverImageUrl: record.coverImage ?? null,
    coverImage: record.coverImage ?? null,
    categoryId: record.categoryId ?? null,
    category: null,
    tags: normalizeTags(record.tags),
    author: author ?? buildFallbackAuthor(record.authorId),
    status: record.status,
    viewCount: Number(record.viewCount ?? 0),
    commentCount: 0,
    questionCount: 0,
    likeCount: 0,
    readingTime: estimateReadingTime(contentPlain),
    publishedAt: record.publishedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function normalizePaginatedPosts(
  payload: BackendPostsListResult,
  authorsById: Record<string, UserProfile | null> = {},
): PaginatedResponse<Post> {
  return {
    data: payload.items.map((item) => normalizePostRecord(item, authorsById[item.authorId])),
    meta: {
      page: payload.page,
      limit: payload.limit,
      total: payload.total,
      totalPages: Math.max(1, Math.ceil(payload.total / payload.limit)),
    },
  };
}

export function buildPostRequestPayload(
  payload: CreatePostPayload | UpdatePostPayload,
  coverImageUrl?: string | null,
) {
  return {
    ...(payload.title !== undefined ? { title: payload.title } : {}),
    ...(payload.slug !== undefined ? { slug: payload.slug } : {}),
    ...(payload.content !== undefined ? { content: payload.content } : {}),
    ...(payload.contentPlain !== undefined ? { contentPlain: payload.contentPlain } : {}),
    ...(payload.excerpt !== undefined ? { excerpt: payload.excerpt } : {}),
    ...(payload.categoryId !== undefined ? { categoryId: payload.categoryId || undefined } : {}),
    ...(payload.tagIds !== undefined ? { tagIds: payload.tagIds } : {}),
    ...(coverImageUrl !== undefined
      ? { coverImage: coverImageUrl || undefined }
      : payload.coverImageUrl !== undefined
        ? { coverImage: payload.coverImageUrl || undefined }
        : {}),
  };
}
