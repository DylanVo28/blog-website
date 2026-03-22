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
    <div className="flex items-start gap-3 rounded-[1.25rem] border border-amber-200 bg-amber-50/80 p-3">
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-6 text-amber-900">
          Có vẻ bạn đang muốn hỏi tác giả?{" "}
          <button
            type="button"
            onClick={onSwitchToQuestion}
            className="font-semibold underline underline-offset-4"
          >
            Chuyển sang Question (1.000đ)
          </button>{" "}
          để được ưu tiên trả lời và có hoàn tiền tự động nếu quá hạn.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-amber-500 transition-colors hover:text-amber-700"
        aria-label="Ẩn gợi ý"
      >
        ×
      </button>
    </div>
  );
}
