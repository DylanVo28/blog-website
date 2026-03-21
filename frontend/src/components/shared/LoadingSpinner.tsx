import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  className,
  label = "Đang tải...",
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LoaderCircle className="size-6 animate-spin" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
