import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed border-border/80">
      <CardHeader className="items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon ?? <Inbox className="size-6" />}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-xl">{description}</CardDescription>
      </CardHeader>
      {actionHref && actionLabel ? (
        <CardContent className="flex justify-center">
          <Button asChild variant="outline">
            <Link href={actionHref}>
              {actionLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}
