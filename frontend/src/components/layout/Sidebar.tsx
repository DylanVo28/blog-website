"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Layers3, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { secondaryNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const checkpoints = [
  {
    icon: UserRound,
    title: "Profile ready",
    description: "Trang hồ sơ công khai và settings đã được nối với dữ liệu user thật.",
  },
  {
    icon: ShieldCheck,
    title: "Admin console",
    description: "Admin có dashboard tổng quan, moderation users, posts và treasury queue.",
  },
  {
    icon: Layers3,
    title: "Polish layer",
    description: "Dark mode, mobile bottom nav và SEO routes được thêm cho phase 8.",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const quickLinks = secondaryNavigation.filter((item) => {
    if (item.href === "/admin") {
      return user?.role === "admin";
    }

    return isAuthenticated || item.href === "/posts/new";
  });

  return (
    <aside className="hidden xl:block xl:w-[320px] xl:shrink-0">
      <div className="sticky top-28 space-y-5">
        <Card className="paper-grid">
          <CardHeader>
            <Badge variant="success" className="w-fit">
              Phase 8 Live
            </Badge>
            <CardTitle className="flex items-center gap-2 text-[1.9rem]">
              <Gauge className="size-5 text-primary" />
              Profile + admin shell
            </CardTitle>
            <CardDescription>
              Không gian điều hướng giờ ưu tiên hồ sơ cá nhân, moderation và các lối tắt
              vận hành để chốt vòng frontend tuần 8.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAuthenticated && user ? (
              <div className="rounded-[1.5rem] border border-border/70 bg-card/75 px-4 py-4">
                <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UserRound className="size-5" />
                </div>
                <p className="text-sm font-semibold text-foreground">{user.displayName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-card/70 px-4 py-4 text-sm leading-6 text-muted-foreground">
                Đăng nhập để mở profile settings, dashboard tác giả và admin console theo
                phase 8.
              </div>
            )}

            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "bg-card/70 text-foreground hover:bg-accent",
                )}
              >
                {item.label}
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {checkpoints.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title}>
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
