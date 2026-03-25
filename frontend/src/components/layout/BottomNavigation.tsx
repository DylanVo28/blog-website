"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Compass, Home, LayoutDashboard, UserRound, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function BottomNavigation() {
  const pathname = usePathname();
  const { user, isAuthenticated, hydrated } = useAuth();

  if (!hydrated) {
    return null;
  }

  const items = isAuthenticated
    ? [
        { href: "/", label: "Home", icon: Home },
        { href: "/explore", label: "Explore", icon: Compass },
        { href: "/wallet", label: "Wallet", icon: Wallet },
        { href: "/notifications", label: "Alerts", icon: Bell },
        {
          href: `/profile/${user?.username ?? user?.id ?? "me"}`,
          label: "Profile",
          icon: UserRound,
        },
      ]
    : [
        { href: "/", label: "Home", icon: Home },
        { href: "/explore", label: "Explore", icon: Compass },
        { href: "/login", label: "Login", icon: UserRound },
        { href: "/register", label: "Join", icon: LayoutDashboard },
      ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/88 px-3 pb-[calc(env(safe-area-inset-bottom,0)+0.75rem)] pt-3 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-between rounded-[1.7rem] border border-border/70 bg-card/88 px-2 py-2 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.5)]">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[1.2rem] px-2 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
