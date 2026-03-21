import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PagePlaceholderProps {
  phase: string;
  title: string;
  description: string;
  backHref?: string;
}

export function PagePlaceholder({
  phase,
  title,
  description,
  backHref = "/",
}: PagePlaceholderProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-12">
      <Card className="w-full border-dashed border-primary/25">
        <CardHeader>
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {phase}
          </p>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={backHref}>
              Quay về trang chủ
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
