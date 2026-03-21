"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Layers3, ShieldCheck, WalletCards } from "lucide-react";
import { secondaryNavigation } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const checkpoints = [
  {
    icon: Layers3,
    title: "State + Query",
    description: "Zustand, TanStack Query, middleware và axios client đã nối sẵn.",
  },
  {
    icon: WalletCards,
    title: "Wallet-ready",
    description: "Store số dư và constants phí câu hỏi đã sẵn sàng cho phase 4-5.",
  },
  {
    icon: ShieldCheck,
    title: "Auth gate",
    description: "Cookie-based route guard cho auth, protected routes và admin routes.",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden xl:block xl:w-[320px] xl:shrink-0">
      <div className="sticky top-28 space-y-5">
        <Card className="paper-grid">
          <CardHeader>
            <Badge variant="success" className="w-fit">
              Phase 1 Ready
            </Badge>
            <CardTitle className="flex items-center gap-2 text-[1.9rem]">
              <Gauge className="size-5 text-primary" />
              Nền tảng giao diện
            </CardTitle>
            <CardDescription>
              Các route placeholder bên dưới giúp mình kiểm tra navigation và middleware
              ngay từ bây giờ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {secondaryNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/70 text-foreground hover:bg-accent",
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
