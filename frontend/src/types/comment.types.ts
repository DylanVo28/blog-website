import type { AuthorInfo } from "@/types/user.types";

export interface Comment {
  id: string;
  content: string;
  author: AuthorInfo;
  postId: string;
  parentId: string | null;
  likeCount: number;
  isLikedByMe: boolean;
  isHidden?: boolean;
  children: Comment[];
  createdAt: string;
  updatedAt?: string;
}
