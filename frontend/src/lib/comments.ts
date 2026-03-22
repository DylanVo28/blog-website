import type {
  BackendCommentRecord,
  Comment,
} from "@/types/comment.types";
import type { AuthorInfo, UserProfile } from "@/types/user.types";

const questionPatterns = [
  /\?/,
  /\b(lam sao|nhu the nao|tai sao|cho hoi|giup minh|giai thich)\b/i,
  /\b(how|why|what|can you|could you|please explain)\b/i,
];

function fallbackAuthor(record: BackendCommentRecord): AuthorInfo {
  return {
    id: record.userId,
    username: null,
    displayName: "Người dùng Inkline",
    avatarUrl: null,
    bio: null,
  };
}

export function detectQuestionIntent(text: string) {
  const content = text.trim();

  if (!content) {
    return false;
  }

  const matchCount = questionPatterns.filter((pattern) => pattern.test(content)).length;
  return matchCount >= 2;
}

export function normalizeCommentRecord(
  record: BackendCommentRecord,
  author: UserProfile | null,
): Comment {
  return {
    id: record.id,
    content: record.content,
    authorId: record.userId,
    author: author ?? fallbackAuthor(record),
    postId: record.postId,
    parentId: record.parentId,
    isHidden: record.isHidden,
    children: [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function buildCommentTree(items: Comment[]) {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

  items.forEach((comment) => {
    map.set(comment.id, {
      ...comment,
      children: [],
    });
  });

  map.forEach((comment) => {
    if (comment.parentId && map.has(comment.parentId)) {
      map.get(comment.parentId)?.children.push(comment);
      return;
    }

    roots.push(comment);
  });

  return roots;
}
