"use client";

import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionTarget } from "@/types/question.types";

interface QuestionTargetSelectProps {
  value: QuestionTarget;
  onChange: (value: QuestionTarget) => void;
}

export function QuestionTargetSelect({
  value,
  onChange,
}: QuestionTargetSelectProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <button
        type="button"
        onClick={() => onChange("author")}
        className={cn(
          "surface-panel rounded-[1.4rem] border-2 p-4 text-left transition-all",
          value === "author"
            ? "border-[color-mix(in_oklab,var(--color-border)_48%,rgb(14,165,233)_52%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(14,165,233)_16%,transparent),transparent_54%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_72%,rgb(14,165,233)_28%))] shadow-sm"
            : "border-border/70 bg-[color-mix(in_oklab,var(--color-card)_84%,transparent)] hover:border-[color-mix(in_oklab,var(--color-border)_48%,rgb(14,165,233)_52%)]",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "rounded-full p-2",
              value === "author"
                ? "bg-[color-mix(in_oklab,rgb(14,165,233)_18%,transparent)] text-sky-700 dark:text-sky-300"
                : "bg-muted text-muted-foreground",
            )}
          >
            <User className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">Hỏi tác giả</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Tác giả nhận thông báo và có 48 giờ để phản hồi.
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onChange("ai")}
        className={cn(
          "surface-panel rounded-[1.4rem] border-2 p-4 text-left transition-all",
          value === "ai"
            ? "border-[color-mix(in_oklab,var(--color-border)_48%,rgb(217,70,239)_52%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(217,70,239)_16%,transparent),transparent_54%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_72%,rgb(217,70,239)_28%))] shadow-sm"
            : "border-border/70 bg-[color-mix(in_oklab,var(--color-card)_84%,transparent)] hover:border-[color-mix(in_oklab,var(--color-border)_48%,rgb(217,70,239)_52%)]",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "rounded-full p-2",
              value === "ai"
                ? "bg-[color-mix(in_oklab,rgb(217,70,239)_18%,transparent)] text-fuchsia-700 dark:text-fuchsia-300"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Bot className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">Hỏi AI</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Dùng AI để giải thích ngay một ý cụ thể trong bài viết.
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
