"use client";

import Link from "next/link";
import { BadgeCheck, CalendarDays, LayoutDashboard, Settings, ShieldCheck } from "lucide-react";
import { formatDateTime } from "@/lib/formatters";
import { useAuthStore } from "@/stores/authStore";
import type { UserProfile, UserProfileStats } from "@/types/user.types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileHeaderProps {
  profile: UserProfile;
  stats: UserProfileStats;
}

export function ProfileHeader({ profile, stats }: ProfileHeaderProps) {
  const viewer = useAuthStore((state) => state.user);
  const isOwner = viewer?.id === profile.id;

  return (
    <Card className="overflow-hidden border-0 bg-[radial-gradient(circle_at_top_left,rgba(244,196,126,0.32),transparent_34%),linear-gradient(135deg,color-mix(in_oklab,var(--color-card)_74%,#fff4df),color-mix(in_oklab,var(--color-card)_92%,transparent))] shadow-[0_28px_90px_-52px_rgba(80,47,15,0.38)]">
      <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_minmax(0,1fr)] md:p-8">
        <div className="flex flex-col items-start gap-4">
          <Avatar className="size-24 border-4 border-background/85 shadow-lg md:size-28">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} />
            <AvatarFallback name={profile.displayName} className="text-2xl" />
          </Avatar>

          <div className="flex flex-wrap gap-2">
            <Badge>{profile.role}</Badge>
            {profile.isVerified ? (
              <Badge variant="success" className="gap-1">
                <BadgeCheck className="size-3.5" />
                Đã xác thực
              </Badge>
            ) : null}
            {profile.isBanned ? <Badge variant="outline">Tài khoản đang bị khóa</Badge> : null}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/80">
                Public Profile
              </p>
              <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-balance md:text-5xl">
                {profile.displayName}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>@{profile.username ?? profile.id.slice(0, 8)}</span>
                {profile.createdAt ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="size-4" />
                    Tham gia {formatDateTime(profile.createdAt, "dd/MM/yyyy")}
                  </span>
                ) : null}
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                {profile.bio?.trim().length
                  ? profile.bio
                  : "Người dùng này chưa thêm bio. Hồ sơ vẫn hiển thị thống kê và các bài viết đã xuất bản."}
              </p>
            </div>

            {isOwner ? (
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href="/profile/settings">
                    <Settings className="size-4" />
                    Chỉnh hồ sơ
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-border/70 bg-card/75 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Bài viết
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{stats.postsCount}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-card/75 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Câu hỏi đã hỏi
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">{stats.questionsCount}</p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-card/75 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Trạng thái
              </p>
              <p className="mt-3 inline-flex items-center gap-2 text-lg font-semibold text-foreground">
                <ShieldCheck className="size-5 text-primary" />
                {profile.isVerified ? "Đã xác thực" : "Chưa xác thực"}
              </p>
            </div>
          </div>

          {profile.isBanned && profile.banReason ? (
            <div className="rounded-[1.5rem] border border-destructive/30 bg-destructive/8 p-4 text-sm leading-6 text-destructive">
              Lý do khóa tài khoản: {profile.banReason}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
