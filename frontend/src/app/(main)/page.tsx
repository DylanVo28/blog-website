import Link from "next/link";
import {
  ArrowRight,
  MessageSquareMore,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { QUESTION_FEE, REFUND_WINDOW_HOURS } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const foundationCards = [
  {
    icon: ShieldCheck,
    title: "Auth foundation",
    description:
      "JWT client, cookie sync cho middleware và protected route gating đã được nối sẵn.",
  },
  {
    icon: WalletCards,
    title: "Wallet-ready state",
    description:
      "Zustand store cho balance và transactions giúp phase 4-5 chỉ cần gắn API thật.",
  },
  {
    icon: MessageSquareMore,
    title: "Question economy",
    description:
      "Types, constants và route shell đã chuẩn bị cho luồng question trả phí tới author hoặc AI.",
  },
];

const routeLinks = [
  { href: "/login", label: "Auth pages" },
  { href: "/wallet", label: "Wallet area" },
  { href: "/dashboard", label: "Author dashboard" },
  { href: "/posts/new", label: "New post flow" },
];

export default function HomePage() {
  return (
    <div className="space-y-6">
      <Card className="paper-grid overflow-hidden">
        <CardHeader className="pb-4">
          <Badge className="w-fit">Foundation</Badge>
          <div className="max-w-3xl">
            <CardTitle className="text-4xl md:text-6xl">
              Phase 1 của frontend đã được dựng thành bộ khung sẵn để mở rộng.
            </CardTitle>
            <CardDescription className="mt-4 text-base md:text-lg">
              Nền tảng hiện đã có Next.js App Router, Tailwind 4, UI primitives,
              TanStack Query, Zustand stores, middleware auth và axios refresh flow.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-3">
            {foundationCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-border/70 bg-white/70 p-5 shadow-sm"
                >
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,247,236,0.86))] p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              Business Snapshot
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Question fee</p>
                <p className="font-serif text-4xl font-medium">
                  {formatCurrency(QUESTION_FEE)}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Auto refund window</p>
                <p className="text-2xl font-semibold">{REFUND_WINDOW_HOURS} giờ</p>
              </div>
              <Separator />
              <div className="rounded-[1.5rem] bg-primary/8 p-4 text-sm leading-6 text-foreground">
                Luồng miễn phí và trả phí giờ đã có nền route, state và typing để mình
                nối phase 2-5 mà không phải đập lại cấu trúc.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Những route đã được khóa khung</CardTitle>
            <CardDescription>
              Dùng các entry này để kiểm tra navigation, layout shell và middleware
              redirect.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {routeLinks.map((item) => (
              <Button key={item.href} asChild variant="outline" className="justify-between">
                <Link href={item.href}>
                  {item.label}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checklist tuần 1</CardTitle>
            <CardDescription>
              Mình đã ưu tiên các deliverable cần thiết để phase 2 có thể bắt đầu
              ngay.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              "Project Next.js 16 + TypeScript + Tailwind 4",
              "Axios client có refresh token interceptor",
              "Zustand stores cho auth, wallet, ui",
              "TanStack Query provider + devtools",
              "Type system cho auth/posts/comments/questions/wallet",
              "Middleware bảo vệ route và admin gate",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm leading-6">
                <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <RefreshCcw className="size-3" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
