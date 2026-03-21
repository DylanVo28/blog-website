"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  PenSquare,
  PenTool,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { SearchBar } from "@/components/shared/SearchBar";
import { primaryNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { WalletBadge } from "@/components/layout/WalletBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, hydrated, logout, isLoggingOut } = useAuth();
  const profileHref = `/profile/${user?.username ?? user?.id ?? "me"}`;

  const navItems = primaryNavigation.filter((item) => {
    if (item.href === "/wallet" || item.href === "/dashboard" || item.href === "/notifications") {
      return isAuthenticated;
    }

    return true;
  });

  return (
    <header className="sticky top-0 z-40 px-4 py-4 md:px-6">
      <div className="surface-panel mx-auto flex max-w-[1400px] items-center justify-between rounded-[1.75rem] border border-border/70 px-4 py-3 shadow-[0_20px_70px_-44px_rgba(25,32,56,0.35)] md:px-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <PenTool className="size-5" />
          </div>
          <div>
            <Link href="/" className="font-serif text-2xl font-medium tracking-tight">
              Inkline
            </Link>
            <p className="hidden text-xs uppercase tracking-[0.24em] text-muted-foreground sm:block">
              Blog Auth + Layout Phase 2
            </p>
          </div>
        </div>

        <SearchBar className="mx-8 hidden max-w-xl flex-1 lg:block" />

        <nav className="hidden items-center gap-1 xl:flex">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {hydrated ? (
            isAuthenticated && user ? (
              <>
                <Button asChild className="hidden lg:inline-flex" variant="outline">
                  <Link href="/posts/new">
                    <PenSquare className="size-4" />
                    Viết bài
                  </Link>
                </Button>
                <WalletBadge className="hidden md:inline-flex" />
                <NotificationBell className="hidden md:inline-flex" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center rounded-full border border-border/70 bg-white/70 p-1 transition-colors hover:bg-accent focus-visible:ring-4 focus-visible:ring-ring/20">
                      <Avatar className="size-9">
                        <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName} />
                        <AvatarFallback name={user.displayName} />
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-foreground">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={profileHref}>
                        <User className="size-4" />
                        Trang cá nhân
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard className="size-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/settings">
                        <Settings className="size-4" />
                        Cài đặt
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "admin" ? (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <ShieldCheck className="size-4" />
                          Admin panel
                        </Link>
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        void logout();
                      }}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <LogOut className="size-4" />
                      )}
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild className="hidden sm:inline-flex" variant="outline">
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button asChild className="hidden sm:inline-flex">
                  <Link href="/register">Tạo tài khoản</Link>
                </Button>
              </>
            )
          ) : (
            <div className="hidden h-10 w-28 animate-pulse rounded-full bg-muted/80 sm:block" />
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
