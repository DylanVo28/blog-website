"use client";

import { Bot, CheckCircle2, Clock3, RotateCcw, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatRelativeTime } from "@/lib/formatters";
import { AIAnswerDisplay } from "@/components/questions/AIAnswerDisplay";
import { AuthorAnswerForm } from "@/components/questions/AuthorAnswerForm";
import { RefundCountdown } from "@/components/questions/RefundCountdown";
import { ExpandableText } from "@/components/shared/ExpandableText";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types/question.types";

interface QuestionItemProps {
  question: Question;
  isAuthor: boolean;
}

export function QuestionItem({ question, isAuthor }: QuestionItemProps) {
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const isPending = question.status === "pending";
  const isAnswered = question.status === "answered";
  const isRefunded = question.status === "refunded";
  const isAiTarget = question.target === "ai";
  const questionSurfaceClass = isAnswered
    ? "surface-panel border-[color-mix(in_oklab,var(--color-border)_52%,rgb(16,185,129)_48%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(16,185,129)_18%,transparent),transparent_40%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,rgb(16,185,129)_26%))]"
    : isAiTarget
      ? "surface-panel border-[color-mix(in_oklab,var(--color-border)_52%,rgb(217,70,239)_48%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(217,70,239)_18%,transparent),transparent_40%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,rgb(217,70,239)_26%))]"
      : "surface-panel border-[color-mix(in_oklab,var(--color-border)_52%,rgb(245,158,11)_48%)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(245,158,11)_18%,transparent),transparent_40%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_88%,transparent),color-mix(in_oklab,var(--color-card)_74%,rgb(245,158,11)_26%))]";
  const answerSurfaceClass = isAiTarget
    ? "border-[color-mix(in_oklab,var(--color-border)_50%,rgb(217,70,239)_50%)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_90%,transparent),color-mix(in_oklab,var(--color-card)_76%,rgb(217,70,239)_24%))]"
    : "border-[color-mix(in_oklab,var(--color-border)_50%,rgb(14,165,233)_50%)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_90%,transparent),color-mix(in_oklab,var(--color-card)_76%,rgb(14,165,233)_24%))]";

  return (
    <div
      className={cn(
        "rounded-[1.8rem] border-2 p-5 shadow-sm transition-colors",
        questionSurfaceClass,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={question.asker.avatarUrl ?? undefined} alt={question.asker.displayName} />
            <AvatarFallback name={question.asker.displayName} />
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{question.asker.displayName}</p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(question.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            {isAiTarget ? <Bot className="size-3.5" /> : <User className="size-3.5" />}
            {isAiTarget ? "AI" : "Tác giả"}
          </Badge>

          {isAnswered ? (
            <Badge className="gap-1 border-transparent bg-[color-mix(in_oklab,rgb(16,185,129)_72%,var(--color-card)_28%)] text-white">
              <CheckCircle2 className="size-3.5" />
              Đã trả lời
            </Badge>
          ) : null}

          {isPending ? (
            <Badge variant="secondary" className="gap-1">
              <Clock3 className="size-3.5" />
              Đang chờ
            </Badge>
          ) : null}

          {isRefunded ? (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <RotateCcw className="size-3.5" />
              Đã hoàn tiền
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="rounded-full border border-border/60 bg-[color-mix(in_oklab,var(--color-card)_84%,transparent)] px-3 py-1 font-medium text-foreground/86">
          Phí: {formatCurrency(question.fee)}
        </span>
        {question.isHighlighted ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-[color-mix(in_oklab,var(--color-card)_84%,transparent)] px-3 py-1 font-medium text-primary">
            <Sparkles className="size-3.5" />
            Nổi bật trên bài viết
          </span>
        ) : null}
      </div>

      <ExpandableText
        className="mt-4"
        content={question.content}
        collapsedMaxHeight={140}
        contentClassName="text-sm leading-7 text-foreground/92"
      />

      {isPending && !isAiTarget && question.deadlineAt ? (
        <div className="mt-4">
          <RefundCountdown deadline={question.deadlineAt} />
        </div>
      ) : null}

      {isAnswered && question.answer ? (
        <div
          className={cn(
            "mt-4 rounded-[1.35rem] border p-4",
            answerSurfaceClass,
          )}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {isAiTarget ? (
              <Bot className="size-4 text-fuchsia-700 dark:text-fuchsia-300" />
            ) : (
              <User className="size-4 text-sky-700 dark:text-sky-300" />
            )}
            {isAiTarget ? "Phản hồi từ AI" : "Phản hồi từ tác giả"}
          </div>

          {isAiTarget ? (
            <AIAnswerDisplay content={question.answer} />
          ) : (
            <ExpandableText
              className="mt-3"
              content={question.answer}
              collapsedMaxHeight={168}
              contentClassName="text-sm leading-7 text-foreground/92"
            />
          )}
        </div>
      ) : null}

      {isAuthor && isPending && !isAiTarget ? (
        <div className="mt-4">
          {showAnswerForm ? (
            <AuthorAnswerForm
              questionId={question.id}
              onCancel={() => setShowAnswerForm(false)}
              onSuccess={() => setShowAnswerForm(false)}
            />
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAnswerForm(true)}>
              Trả lời câu hỏi này
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
