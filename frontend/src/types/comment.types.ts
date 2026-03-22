import type { AuthorInfo } from "@/types/user.types";

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: AuthorInfo;
  postId: string;
  parentId: string | null;
  isHidden: boolean;
  children: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface BackendCommentRecord {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentSuggestion {
  show: boolean;
  message: string;
}

export interface CreateCommentPayload {
  postId: string;
  content: string;
  parentId?: string;
}

export interface UpdateCommentPayload {
  content: string;
  parentId?: string;
}

export interface CommentCreateResult {
  comment: Comment;
  suggestion: CommentSuggestion | null;
}
