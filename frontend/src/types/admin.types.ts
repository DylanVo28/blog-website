import type { BackendTransactionRecord, TransactionStatus, TransactionType } from "@/types/wallet.types";
import type { PostStatus } from "@/types/post.types";
import type { UserProfile, UserRole } from "@/types/user.types";

export interface AdminDashboardMetrics {
  users: number;
  posts: number;
  questions: number;
  revenue: number;
}

export interface AdminUserWalletSummary {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface AdminUserSummary {
  id: string;
  email: string | null;
  username?: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
}

export interface AdminUserListItem extends UserProfile {
  wallet: AdminUserWalletSummary | null;
}

export interface AdminUsersResult {
  items: AdminUserListItem[];
}

export interface AdminTransactionItem
  extends Omit<BackendTransactionRecord, "amount" | "type" | "status"> {
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  sender: AdminUserSummary | null;
  receiver: AdminUserSummary | null;
}

export interface AdminTransactionsResult {
  items: AdminTransactionItem[];
}

export interface AdminPostItem {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentPlain: string | null;
  coverImage: string | null;
  status: PostStatus;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: AdminUserSummary | null;
}

export interface AdminPostsResult {
  items: AdminPostItem[];
}
