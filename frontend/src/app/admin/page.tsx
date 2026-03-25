"use client";

import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownCircle,
  Ban,
  CheckCircle2,
  Clock3,
  Coins,
  FileCheck2,
  FileText,
  Landmark,
  Loader2,
  Search,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { DepositStatusBadge } from "@/components/payment/DepositStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { WithdrawalStatusBadge } from "@/components/wallet/WithdrawalStatusBadge";
import { getApiErrorMessage } from "@/lib/api";
import { formatCurrency, formatDateTime, formatRelativeTime } from "@/lib/formatters";
import { paymentApi } from "@/services/api/payment.api";
import { adminApi } from "@/services/api/admin.api";
import type {
  AdminDashboardMetrics,
  AdminPostItem,
  AdminTransactionItem,
  AdminUserListItem,
} from "@/types/admin.types";
import type { AdminDepositItem } from "@/types/payment.types";
import type { AdminWithdrawalItem } from "@/types/wallet.types";

function getUserLabel(
  user?: {
    id: string;
    email?: string | null;
    username?: string | null;
    displayName?: string | null;
  } | null,
) {
  if (!user) {
    return "Không rõ";
  }

  return user.displayName || user.email || user.username || user.id;
}

function getTransactionLabel(item: AdminTransactionItem) {
  switch (item.type) {
    case "deposit":
      return "Nạp tiền";
    case "withdrawal":
      return "Rút tiền";
    case "question_to_author":
      return "Question tới tác giả";
    case "question_to_ai":
      return "Question tới AI";
    case "refund":
      return "Hoàn tiền";
    case "withdrawal_fee":
      return "Phí rút tiền";
    case "bonus":
      return "Bonus";
    default:
      return "Giao dịch";
  }
}

function getPostStatusLabel(status: AdminPostItem["status"]) {
  switch (status) {
    case "published":
      return "Published";
    case "archived":
      return "Archived";
    default:
      return "Draft";
  }
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function UsersPanel({
  users,
  search,
  onSearchChange,
  busyUserId,
  onBan,
  onUnban,
}: {
  users: AdminUserListItem[];
  search: string;
  onSearchChange: (value: string) => void;
  busyUserId: string | null;
  onBan: (userId: string) => void;
  onUnban: (userId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
            User Management
          </p>
          <h2 className="text-2xl font-semibold text-foreground">Khóa và mở lại tài khoản</h2>
        </div>

        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm theo tên, email hoặc username"
            className="pl-10"
          />
        </div>
      </div>

      {!users.length ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="Không có user khớp điều kiện"
          description="Thử tìm bằng email hoặc username khác."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {users.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-14">
                      <AvatarImage src={item.avatarUrl ?? undefined} alt={item.displayName} />
                      <AvatarFallback name={item.displayName} />
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold text-foreground">{item.displayName}</p>
                      <p className="text-sm text-muted-foreground">{item.email}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        @{item.username ?? item.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <Badge>{item.role}</Badge>
                    {item.isVerified ? <Badge variant="success">Verified</Badge> : null}
                    {item.isBanned ? <Badge variant="outline">Banned</Badge> : null}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-border/70 bg-card/75 p-4 text-sm leading-6 text-muted-foreground">
                    <p>
                      Số dư ví:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(item.wallet?.balance ?? 0)}
                      </span>
                    </p>
                    <p>
                      Đã kiếm:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(item.wallet?.totalEarned ?? 0)}
                      </span>
                    </p>
                    <p>
                      Đã chi:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(item.wallet?.totalSpent ?? 0)}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-[1.4rem] border border-border/70 bg-card/75 p-4 text-sm leading-6 text-muted-foreground">
                    <p>
                      Ngân hàng:{" "}
                      <span className="font-semibold text-foreground">{item.bankName || "Chưa lưu"}</span>
                    </p>
                    <p>
                      Số tài khoản:{" "}
                      <span className="font-semibold text-foreground">{item.bankAccount || "Chưa lưu"}</span>
                    </p>
                    <p>
                      Chủ tài khoản:{" "}
                      <span className="font-semibold text-foreground">{item.bankHolder || "Chưa lưu"}</span>
                    </p>
                  </div>
                </div>

                {item.isBanned && item.banReason ? (
                  <div className="rounded-[1.4rem] border border-destructive/25 bg-destructive/8 p-4 text-sm leading-6 text-destructive">
                    Lý do khóa: {item.banReason}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Tạo lúc {formatRelativeTime(item.createdAt ?? new Date().toISOString())}
                  </p>

                  {item.isBanned ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busyUserId === item.id}
                      onClick={() => onUnban(item.id)}
                    >
                      {busyUserId === item.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ShieldOff className="size-4" />
                      )}
                      Mở khóa
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={busyUserId === item.id}
                      onClick={() => onBan(item.id)}
                    >
                      {busyUserId === item.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Ban className="size-4" />
                      )}
                      Khóa tài khoản
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PostsPanel({
  posts,
  search,
  onSearchChange,
  busyPostId,
  onApprove,
  onReject,
}: {
  posts: AdminPostItem[];
  search: string;
  onSearchChange: (value: string) => void;
  busyPostId: string | null;
  onApprove: (postId: string) => void;
  onReject: (postId: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
            Content Moderation
          </p>
          <h2 className="text-2xl font-semibold text-foreground">Duyệt và ẩn bài viết</h2>
        </div>

        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Tìm theo tiêu đề hoặc tác giả"
            className="pl-10"
          />
        </div>
      </div>

      {!posts.length ? (
        <EmptyState
          icon={<FileText className="size-6" />}
          title="Không có bài viết khớp điều kiện"
          description="Thử đổi từ khóa hoặc để trống ô tìm kiếm."
        />
      ) : (
        <div className="space-y-4">
          {posts.map((item) => {
            const isBusy = busyPostId === item.id;

            return (
              <Card key={item.id}>
                <CardContent className="space-y-5 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{getPostStatusLabel(item.status)}</Badge>
                        <Badge variant="outline">{item.viewCount} views</Badge>
                      </div>
                      <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.author ? `${getUserLabel(item.author)} • ` : ""}
                        /posts/{item.slug}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.status !== "published" ? (
                        <Button type="button" disabled={isBusy} onClick={() => onApprove(item.id)}>
                          {isBusy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          Approve
                        </Button>
                      ) : null}

                      {item.status !== "archived" ? (
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => onReject(item.id)}
                        >
                          {isBusy ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <XCircle className="size-4" />
                          )}
                          Reject
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-[1.4rem] border border-border/70 bg-card/75 p-4 text-sm leading-6 text-muted-foreground">
                      <p>
                        Trạng thái: <span className="font-semibold text-foreground">{item.status}</span>
                      </p>
                      <p>
                        Xuất bản:{" "}
                        <span className="font-semibold text-foreground">
                          {item.publishedAt ? formatDateTime(item.publishedAt) : "Chưa có"}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-border/70 bg-card/75 p-4 text-sm leading-6 text-muted-foreground">
                      <p>
                        Tạo lúc: <span className="font-semibold text-foreground">{formatDateTime(item.createdAt)}</span>
                      </p>
                      <p>
                        Cập nhật:{" "}
                        <span className="font-semibold text-foreground">{formatRelativeTime(item.updatedAt)}</span>
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-border/70 bg-card/75 p-4 text-sm leading-6 text-muted-foreground">
                      <p className="font-semibold text-foreground">Tóm tắt</p>
                      <p className="mt-2 line-clamp-3">
                        {item.excerpt || item.contentPlain || "Bài viết này chưa có nội dung plain text."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TransactionsPanel({ items }: { items: AdminTransactionItem[] }) {
  if (!items.length) {
    return (
      <EmptyState
        icon={<Coins className="size-6" />}
        title="Chưa có giao dịch"
        description="Khi wallet và question flow phát sinh giao dịch, danh sách sẽ hiện tại đây."
      />
    );
  }

  const aiRevenue = items
    .filter((item) => item.type === "question_to_ai" || item.type === "withdrawal_fee")
    .reduce((sum, item) => sum + item.amount, 0);
  const withdrawals = items
    .filter((item) => item.type === "withdrawal")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Tổng giao dịch"
          value={items.length.toString()}
          description="200 bản ghi gần nhất từ hệ thống wallet."
          icon={Coins}
        />
        <SummaryCard
          title="Doanh thu hệ thống"
          value={formatCurrency(aiRevenue)}
          description="Gồm question tới AI và phí rút tiền."
          icon={Sparkles}
        />
        <SummaryCard
          title="Tiền đã rút"
          value={formatCurrency(withdrawals)}
          description="Tổng giá trị các lệnh withdrawal đã ghi nhận."
          icon={Landmark}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Lịch sử giao dịch</CardTitle>
          <CardDescription>
            Giao dịch được gắn thêm sender/receiver để admin đối chiếu nhanh mà không cần đọc raw id.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[620px] pr-3">
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.4rem] border border-border/70 bg-card/70 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{getTransactionLabel(item)}</Badge>
                        <Badge variant="outline">{item.status}</Badge>
                      </div>
                      <p className="mt-3 text-lg font-semibold text-foreground">
                        {formatCurrency(item.amount)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getUserLabel(item.sender)} → {getUserLabel(item.receiver)}
                      </p>
                    </div>

                    <div className="text-right text-sm text-muted-foreground">
                      <p>{formatDateTime(item.createdAt)}</p>
                      <p className="mt-1 font-mono text-xs">{item.referenceType ?? "general"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function DepositReviewCard({
  item,
  busy,
  onApprove,
  onReject,
}: {
  item: AdminDepositItem;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <Card>
      <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xl font-semibold text-foreground">{formatCurrency(item.amount)}</p>
            <DepositStatusBadge status={item.status} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.4rem] border border-border/70 bg-card/75 p-4 text-sm leading-6 text-muted-foreground">
              <p>
                Người nạp:{" "}
                <span className="font-semibold text-foreground">
                  {item.user?.displayName || item.user?.email || item.userId}
                </span>
              </p>
              <p>
                Mã nạp: <span className="font-mono text-foreground">{item.depositCode || "Chưa có"}</span>
              </p>
              <p>
                Hết hạn:{" "}
                <span className="font-semibold text-foreground">
                  {item.expiresAt ? formatDateTime(item.expiresAt) : "Chưa có"}
                </span>
              </p>
            </div>

            <div className="rounded-[1.4rem] border border-border/70 bg-card/75 p-4 text-sm leading-6 text-muted-foreground">
              <p>
                Người nhận:{" "}
                <span className="font-semibold text-foreground">
                  {item.receiverName || "Chưa có"} {item.receiverPhone ? `• ${item.receiverPhone}` : ""}
                </span>
              </p>
              <p>
                Proof:{" "}
                {item.transferProofUrl ? (
                  <a
                    href={item.transferProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-primary hover:underline"
                  >
                    Mở chứng từ
                  </a>
                ) : (
                  <span className="font-semibold text-foreground">Chưa gửi</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-[1.4rem] border border-border/70 bg-card/70 p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Khi duyệt deposit, tiền sẽ được cộng ngay vào ví user và tạo transaction `deposit`.
          </p>
          <div className="space-y-3">
            <Button type="button" className="w-full" disabled={busy} onClick={onApprove}>
              <CheckCircle2 className="size-4" />
              Duyệt
            </Button>
            <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={onReject}>
              <XCircle className="size-4" />
              Từ chối
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WithdrawalReviewCard({
  item,
  busy,
  onApprove,
  onReject,
}: {
  item: AdminWithdrawalItem;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const resolvedBy = item.approvedByAdmin
    ? getUserLabel(item.approvedByAdmin)
    : item.approvedBy || "Chưa có";

  return (
    <Card>
      <CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xl font-semibold text-foreground">{formatCurrency(item.amount)}</p>
            <WithdrawalStatusBadge status={item.status} />
            <Badge variant="outline">Tổng trừ {formatCurrency(item.totalDebit)}</Badge>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.4rem] border border-border/70 bg-card/75 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Người rút</p>
              <p className="mt-2">{item.user ? getUserLabel(item.user) : item.userId}</p>
              <p>{item.user?.email || "Chưa có email"}</p>
            </div>
            <div className="rounded-[1.4rem] border border-border/70 bg-card/75 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Ngân hàng nhận</p>
              <p className="mt-2">{item.bankName || "Chưa có"}</p>
              <p>{item.bankAccount || "Chưa có số tài khoản"}</p>
              <p>{item.bankHolder || "Chưa có chủ tài khoản"}</p>
            </div>
            <div className="rounded-[1.4rem] border border-border/70 bg-card/75 p-4 text-sm leading-6 text-muted-foreground">
              <p className="font-semibold text-foreground">Xử lý</p>
              <p className="mt-2">Tạo lúc {formatDateTime(item.createdAt)}</p>
              <p>Người xử lý: {resolvedBy}</p>
              <p>
                Hoàn tất lúc {item.completedAt ? formatDateTime(item.completedAt) : "Chưa có"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-[1.4rem] border border-border/70 bg-card/70 p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Duyệt withdrawal sẽ trừ ví user, tạo transaction `withdrawal` và hạch toán `withdrawal_fee` nếu có.
          </p>

          {item.status === "pending" ? (
            <div className="space-y-3">
              <Button type="button" className="w-full" disabled={busy} onClick={onApprove}>
                <CheckCircle2 className="size-4" />
                Duyệt
              </Button>
              <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={onReject}>
                <XCircle className="size-4" />
                Từ chối
              </Button>
            </div>
          ) : (
            <div className="rounded-[1.2rem] border border-border/70 bg-card/75 p-4 text-sm text-muted-foreground">
              Yêu cầu này đã được xử lý.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TreasuryPanel({
  deposits,
  withdrawals,
  depositBusy,
  withdrawalBusy,
  onApproveDeposit,
  onRejectDeposit,
  onApproveWithdrawal,
  onRejectWithdrawal,
}: {
  deposits: AdminDepositItem[];
  withdrawals: AdminWithdrawalItem[];
  depositBusy: boolean;
  withdrawalBusy: boolean;
  onApproveDeposit: (depositId: string) => void;
  onRejectDeposit: (depositId: string) => void;
  onApproveWithdrawal: (withdrawalId: string) => void;
  onRejectWithdrawal: (withdrawalId: string) => void;
}) {
  const pendingWithdrawals = withdrawals.filter((item) => item.status === "pending");

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Deposit chờ duyệt"
          value={deposits.length.toString()}
          description="Các yêu cầu user đã xác nhận chuyển khoản nhưng chưa được cộng ví."
          icon={ArrowDownCircle}
        />
        <SummaryCard
          title="Withdrawal chờ duyệt"
          value={pendingWithdrawals.length.toString()}
          description="Lệnh rút tiền đang chờ payout hoặc xử lý từ chối."
          icon={Clock3}
        />
        <SummaryCard
          title="Tiền chờ chuyển"
          value={formatCurrency(
            pendingWithdrawals.reduce((sum, item) => sum + item.amount, 0),
          )}
          description="Tổng số tiền transfer thủ công cho queue rút tiền hiện tại."
          icon={Landmark}
        />
      </div>

      <Tabs defaultValue="withdrawals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals">
          <div className="space-y-4">
            {!withdrawals.length ? (
              <EmptyState
                icon={<Wallet className="size-6" />}
                title="Không có withdrawal"
                description="Khi có yêu cầu rút tiền, danh sách sẽ xuất hiện tại đây."
              />
            ) : (
              withdrawals.map((item) => (
                <WithdrawalReviewCard
                  key={item.id}
                  item={item}
                  busy={withdrawalBusy}
                  onApprove={() => onApproveWithdrawal(item.id)}
                  onReject={() => onRejectWithdrawal(item.id)}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="deposits">
          <div className="space-y-4">
            {!deposits.length ? (
              <EmptyState
                icon={<ShieldCheck className="size-6" />}
                title="Không có deposit chờ duyệt"
                description="Khi user tạo deposit thủ công, queue pending sẽ hiển thị ở đây."
              />
            ) : (
              deposits.map((item) => (
                <DepositReviewCard
                  key={item.id}
                  item={item}
                  busy={depositBusy}
                  onApprove={() => onApproveDeposit(item.id)}
                  onReject={() => onRejectDeposit(item.id)}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [userSearch, setUserSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const deferredUserSearch = useDeferredValue(userSearch);
  const deferredPostSearch = useDeferredValue(postSearch);

  const dashboardQuery = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => adminApi.getDashboard(),
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.getUsers(),
  });

  const postsQuery = useQuery({
    queryKey: ["admin", "posts"],
    queryFn: () => adminApi.getPosts(),
  });

  const transactionsQuery = useQuery({
    queryKey: ["admin", "transactions"],
    queryFn: () => adminApi.getTransactions(),
  });

  const withdrawalsQuery = useQuery({
    queryKey: ["admin", "withdrawals"],
    queryFn: () => adminApi.getWithdrawals(),
  });

  const depositsQuery = useQuery({
    queryKey: ["payment", "admin", "pending-deposits"],
    queryFn: () => paymentApi.getPendingDeposits(),
  });

  const userModerationMutation = useMutation({
    mutationFn: async (input: { userId: string; action: "ban" | "unban"; reason?: string }) =>
      input.action === "ban"
        ? adminApi.banUser(input.userId, input.reason)
        : adminApi.unbanUser(input.userId),
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === "ban" ? "Đã khóa tài khoản người dùng." : "Đã mở khóa tài khoản.",
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật trạng thái user."));
    },
  });

  const postModerationMutation = useMutation({
    mutationFn: async (input: { postId: string; action: "approve" | "reject" }) =>
      input.action === "approve"
        ? adminApi.approvePost(input.postId)
        : adminApi.rejectPost(input.postId),
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === "approve"
          ? "Bài viết đã được publish."
          : "Bài viết đã được chuyển sang archived.",
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "posts"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể xử lý bài viết."));
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: async (input: { withdrawalId: string; action: "approve" | "reject" }) =>
      input.action === "approve"
        ? adminApi.approveWithdrawal(input.withdrawalId)
        : adminApi.rejectWithdrawal(input.withdrawalId),
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === "approve"
          ? "Đã duyệt withdrawal."
          : "Đã từ chối yêu cầu withdrawal.",
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể xử lý withdrawal."));
    },
  });

  const depositMutation = useMutation({
    mutationFn: async (input: { depositId: string; approved: boolean }) =>
      paymentApi.reviewDeposit(input.depositId, { approved: input.approved }),
    onSuccess: (_, variables) => {
      toast.success(variables.approved ? "Đã duyệt deposit." : "Đã từ chối deposit.");
      void queryClient.invalidateQueries({ queryKey: ["payment", "admin", "pending-deposits"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Không thể xử lý deposit."));
    },
  });

  const overview: AdminDashboardMetrics | undefined = dashboardQuery.data;
  const users = usersQuery.data?.items ?? [];
  const posts = postsQuery.data?.items ?? [];
  const transactions = transactionsQuery.data?.items ?? [];
  const withdrawals = withdrawalsQuery.data?.items ?? [];
  const deposits = depositsQuery.data?.items ?? [];
  const filteredUsers = users.filter((item) => {
    const query = deferredUserSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [item.displayName, item.email, item.username, item.role]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(query));
  });
  const filteredPosts = posts.filter((item) => {
    const query = deferredPostSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [item.title, item.slug, item.excerpt, item.author?.displayName, item.author?.email]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(query));
  });
  const publishedPosts = posts.filter((item) => item.status === "published").length;
  const bannedUsers = users.filter((item) => item.isBanned).length;

  if (
    dashboardQuery.isLoading &&
    usersQuery.isLoading &&
    postsQuery.isLoading &&
    transactionsQuery.isLoading
  ) {
    return (
      <AuthGuard roles={["admin"]}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner label="Đang tải admin console..." />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard roles={["admin"]}>
      <div className="space-y-6">
        <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#173b2d,#24533e_45%,#8bb65a)] text-white">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white">
                Admin Console
              </Badge>
              <Badge variant="outline" className="border-white/20 bg-white/10 text-white/90">
                Phase 8
              </Badge>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl text-white md:text-4xl">
                Bảng điều hành profile, moderation và treasury
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7 text-white/80">
                Từ đây admin có thể xem sức khỏe nền tảng, quản lý user, duyệt bài viết,
                đối chiếu giao dịch và xử lý deposit hoặc withdrawal queue trong cùng một flow.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Users"
            value={String(overview?.users ?? users.length)}
            description={`${bannedUsers} tài khoản đang bị khóa.`}
            icon={Users}
          />
          <SummaryCard
            title="Posts"
            value={String(overview?.posts ?? posts.length)}
            description={`${publishedPosts} bài đang published.`}
            icon={FileCheck2}
          />
          <SummaryCard
            title="Questions"
            value={String(overview?.questions ?? 0)}
            description="Tổng số question premium đã ghi nhận."
            icon={Sparkles}
          />
          <SummaryCard
            title="Revenue"
            value={formatCurrency(overview?.revenue ?? 0)}
            description="Doanh thu hệ thống từ AI question và withdrawal fee."
            icon={Coins}
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="treasury">Treasury</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Tín hiệu vận hành</CardTitle>
                  <CardDescription>
                    Snapshot nhanh để admin biết phần nào đang cần can thiệp trước.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/75">
                      Moderation
                    </p>
                    <p className="mt-3 text-lg font-semibold text-foreground">
                      {posts.filter((item) => item.status === "draft").length} bài draft cần xem
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Các bài draft có thể được publish trực tiếp từ tab Posts nếu admin cần mở luồng nội dung ngay.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/75">
                      Risk Queue
                    </p>
                    <p className="mt-3 text-lg font-semibold text-foreground">
                      {users.filter((item) => item.isBanned).length} user đã bị khóa
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Tab Users cho phép ban hoặc mở khóa ngay nếu cần xử lý hành vi bất thường.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/75">
                      Treasury
                    </p>
                    <p className="mt-3 text-lg font-semibold text-foreground">
                      {deposits.length} deposit và {withdrawals.filter((item) => item.status === "pending").length} withdrawal pending
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Queue treasury đang gom những tác vụ cần thao tác thủ công ngay trong ngày.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-border/70 bg-card/70 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/75">
                      Finance
                    </p>
                    <p className="mt-3 text-lg font-semibold text-foreground">
                      {transactions.length} giao dịch gần nhất
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Tab Transactions đã enrich sender và receiver để đối chiếu nhanh theo tên.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Tác vụ ưu tiên</CardTitle>
                  <CardDescription>Danh sách ngắn để admin thao tác theo thứ tự ưu tiên.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    `${deposits.length} deposit đang chờ xác nhận.`,
                    `${withdrawals.filter((item) => item.status === "pending").length} withdrawal đang chờ payout.`,
                    `${posts.filter((item) => item.status !== "published").length} bài viết chưa published.`,
                    `${users.filter((item) => item.isBanned).length} user đang bị khóa.`,
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.3rem] border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground"
                    >
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            {usersQuery.isLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <LoadingSpinner label="Đang tải danh sách users..." />
              </div>
            ) : (
              <UsersPanel
                users={filteredUsers}
                search={userSearch}
                onSearchChange={setUserSearch}
                busyUserId={userModerationMutation.variables?.userId ?? null}
                onBan={(userId) => {
                  const reason = window.prompt("Lý do khóa tài khoản (không bắt buộc)");

                  if (reason === null) {
                    return;
                  }

                  void userModerationMutation.mutateAsync({
                    userId,
                    action: "ban",
                    reason: reason.trim() || undefined,
                  });
                }}
                onUnban={(userId) => {
                  void userModerationMutation.mutateAsync({
                    userId,
                    action: "unban",
                  });
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="posts">
            {postsQuery.isLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <LoadingSpinner label="Đang tải danh sách bài viết..." />
              </div>
            ) : (
              <PostsPanel
                posts={filteredPosts}
                search={postSearch}
                onSearchChange={setPostSearch}
                busyPostId={postModerationMutation.variables?.postId ?? null}
                onApprove={(postId) => {
                  void postModerationMutation.mutateAsync({
                    postId,
                    action: "approve",
                  });
                }}
                onReject={(postId) => {
                  void postModerationMutation.mutateAsync({
                    postId,
                    action: "reject",
                  });
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="transactions">
            {transactionsQuery.isLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <LoadingSpinner label="Đang tải transactions..." />
              </div>
            ) : (
              <TransactionsPanel items={transactions} />
            )}
          </TabsContent>

          <TabsContent value="treasury">
            {withdrawalsQuery.isLoading || depositsQuery.isLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <LoadingSpinner label="Đang tải treasury queue..." />
              </div>
            ) : (
              <TreasuryPanel
                deposits={deposits}
                withdrawals={withdrawals}
                depositBusy={depositMutation.isPending}
                withdrawalBusy={withdrawalMutation.isPending}
                onApproveDeposit={(depositId) => {
                  void depositMutation.mutateAsync({ depositId, approved: true });
                }}
                onRejectDeposit={(depositId) => {
                  void depositMutation.mutateAsync({ depositId, approved: false });
                }}
                onApproveWithdrawal={(withdrawalId) => {
                  void withdrawalMutation.mutateAsync({
                    withdrawalId,
                    action: "approve",
                  });
                }}
                onRejectWithdrawal={(withdrawalId) => {
                  void withdrawalMutation.mutateAsync({
                    withdrawalId,
                    action: "reject",
                  });
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}
