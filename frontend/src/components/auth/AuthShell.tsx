import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ShieldCheck, WalletCards, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "JWT flow đã nối sẵn",
    description:
      "Access token, refresh token và proxy redirect đã được wire để phase sau chỉ cần gắn business logic.",
  },
  {
    icon: WalletCards,
    title: "Wallet badge realtime-ready",
    description:
      "Sau khi đăng nhập, frontend sẽ bootstrap hồ sơ và số dư ví từ backend vào store.",
  },
  {
    icon: Zap,
    title: "Mở rộng thẳng sang phase 3+",
    description:
      "Layout shell, query client và auth guard đã sẵn cho post editor, questions và dashboard.",
  },
];

interface AuthShellProps {
  badge: string;
  title: string;
  description: string;
  helperTitle: string;
  helperDescription: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({
  badge,
  title,
  description,
  helperTitle,
  helperDescription,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="overflow-hidden">
        <CardHeader className="pb-5">
          <Badge className="w-fit">{badge}</Badge>
          <CardTitle className="text-4xl md:text-5xl">{title}</CardTitle>
          <CardDescription className="max-w-2xl text-base">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
          <div className="rounded-[1.5rem] border border-border/70 bg-white/70 px-4 py-3 text-sm text-muted-foreground">
            {footer}
          </div>
        </CardContent>
      </Card>

      <Card className="paper-grid border-primary/15">
        <CardHeader>
          <Badge variant="outline" className="w-fit">
            Auth + Layout
          </Badge>
          <CardTitle className="text-[2rem]">{helperTitle}</CardTitle>
          <CardDescription>{helperDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {trustPoints.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-border/70 bg-white/80 p-4 shadow-sm"
              >
                <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            );
          })}

          <Button asChild variant="outline" className="mt-2 w-full justify-between">
            <Link href="/">
              Xem homepage hiện tại
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
