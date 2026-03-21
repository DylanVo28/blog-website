"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenTool } from "lucide-react";
import { primaryNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/MobileNav";
import { WalletBadge } from "@/components/layout/WalletBadge";

export function Navbar() {
  const pathname = usePathname();

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
              Blog Foundation Phase 1
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {primaryNavigation.map((item) => {
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
          <WalletBadge />
          <Button asChild className="hidden sm:inline-flex" variant="outline">
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/register">Tạo tài khoản</Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
