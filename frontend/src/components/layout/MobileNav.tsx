"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  PenSquare,
  Settings,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";
import { primaryNavigation, secondaryNavigation } from "@/lib/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, hydrated, logout, isLoggingOut } = useAuth();

  const visiblePrimaryNavigation = primaryNavigation.filter((item) => {
    if (item.href === "/wallet" || item.href === "/dashboard" || item.href === "/notifications") {
      return isAuthenticated;
    }

    return true;
  });

  const accountLinks = isAuthenticated
    ? [
        {
          href: `/profile/${user?.username ?? user?.id ?? "me"}`,
          label: "Trang cá nhân",
          icon: User,
        },
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: "/wallet",
          label: "Ví của tôi",
          icon: Wallet,
        },
        {
          href: "/notifications",
          label: "Thông báo",
          icon: Bell,
        },
        {
          href: "/posts/new",
          label: "Viết bài",
          icon: PenSquare,
        },
        {
          href: "/profile/settings",
          label: "Cài đặt",
          icon: Settings,
        },
        ...(user?.role === "admin"
          ? [
              {
                href: "/admin",
                label: "Admin panel",
                icon: ShieldCheck,
              },
            ]
          : []),
      ]
    : [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="md:hidden" size="icon" variant="outline">
          <Menu className="size-4" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="paper-grid">
        <SheetHeader>
          <SheetTitle>Inkline</SheetTitle>
          <SheetDescription>
            Điều hướng mobile cho profile, admin, ví và các khu vực chính của ứng dụng.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex justify-end">
          <ThemeToggle />
        </div>

        {hydrated && isAuthenticated && user ? (
          <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-card/75 px-4 py-4">
            <p className="text-sm font-semibold text-foreground">{user.displayName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </div>
        ) : null}

        <nav className="mt-6 flex flex-col gap-2">
          {visiblePrimaryNavigation.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link
                href={item.href}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}

          {hydrated && isAuthenticated
            ? accountLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      <Icon className="size-4 text-primary" />
                      {item.label}
                    </Link>
                  </SheetClose>
                );
              })
            : secondaryNavigation
                .filter((item) => item.href !== "/admin")
                .map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
        </nav>

        <div className="mt-6 space-y-2">
          {hydrated ? (
            isAuthenticated ? (
              <Button
                variant="outline"
                className="w-full justify-center"
                disabled={isLoggingOut}
                onClick={() => {
                  setOpen(false);
                  void logout();
                }}
              >
                <LogOut className="size-4" />
                {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </Button>
            ) : (
              <>
                <SheetClose asChild>
                  <Button asChild variant="outline" className="w-full justify-center">
                    <Link href="/login">Đăng nhập</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild className="w-full justify-center">
                    <Link href="/register">Đăng ký</Link>
                  </Button>
                </SheetClose>
              </>
            )
          ) : (
            <div className="h-11 animate-pulse rounded-full bg-muted/80" />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
