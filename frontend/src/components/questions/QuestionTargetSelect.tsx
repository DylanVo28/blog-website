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
          "rounded-[1.4rem] border-2 p-4 text-left transition-all",
          value === "author"
            ? "border-sky-300 bg-sky-50 shadow-sm"
            : "border-border/70 bg-white/80 hover:border-sky-200",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "rounded-full p-2",
              value === "author" ? "bg-sky-100 text-sky-700" : "bg-muted text-muted-foreground",
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
          "rounded-[1.4rem] border-2 p-4 text-left transition-all",
          value === "ai"
            ? "border-fuchsia-300 bg-fuchsia-50 shadow-sm"
            : "border-border/70 bg-white/80 hover:border-fuchsia-200",
        )}
      >
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "rounded-full p-2",
              value === "ai"
                ? "bg-fuchsia-100 text-fuchsia-700"
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
