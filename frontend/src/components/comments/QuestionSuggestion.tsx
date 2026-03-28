"use client";

import { AlertCircle } from "lucide-react";

interface QuestionSuggestionProps {
  onDismiss: () => void;
  onSwitchToQuestion: () => void;
}

export function QuestionSuggestion({
  onDismiss,
  onSwitchToQuestion,
}: QuestionSuggestionProps) {
  return (
    <div className="surface-panel flex items-start gap-3 rounded-[1.25rem] border border-[color-mix(in_oklab,var(--color-border)_52%,rgb(245,158,11)_48%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(245,158,11)_16%,transparent),transparent_50%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_90%,transparent),color-mix(in_oklab,var(--color-card)_76%,rgb(245,158,11)_24%))] p-3">
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-[color-mix(in_oklab,rgb(245,158,11)_72%,var(--color-foreground)_28%)]" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-6 text-foreground/88">
          Có vẻ bạn đang muốn hỏi tác giả?{" "}
          <button
            type="button"
            onClick={onSwitchToQuestion}
            className="font-semibold text-[color-mix(in_oklab,rgb(245,158,11)_72%,var(--color-foreground)_28%)] underline underline-offset-4 transition-colors hover:text-[color-mix(in_oklab,rgb(245,158,11)_86%,var(--color-foreground)_14%)]"
          >
            Chuyển sang Question (1.000đ)
          </button>{" "}
          để được ưu tiên trả lời và có hoàn tiền tự động nếu quá hạn.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-[color-mix(in_oklab,rgb(245,158,11)_62%,var(--color-foreground)_38%)] transition-colors hover:text-[color-mix(in_oklab,rgb(245,158,11)_82%,var(--color-foreground)_18%)]"
        aria-label="Ẩn gợi ý"
      >
        ×
      </button>
    </div>
  );
}
