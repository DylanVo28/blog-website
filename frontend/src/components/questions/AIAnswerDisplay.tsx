"use client";

import { ExpandableText } from "@/components/shared/ExpandableText";

interface AIAnswerDisplayProps {
  content: string;
}

export function AIAnswerDisplay({ content }: AIAnswerDisplayProps) {
  return (
    <div className="surface-panel mt-3 rounded-[1rem] border border-border/60 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,rgb(217,70,239)_16%,transparent),transparent_48%),linear-gradient(180deg,color-mix(in_oklab,var(--color-card)_90%,transparent),color-mix(in_oklab,var(--color-card)_76%,rgb(217,70,239)_24%))] px-4 py-3">
      <ExpandableText
        content={content}
        collapsedMaxHeight={196}
        contentClassName="text-sm leading-7 text-foreground/92"
        buttonClassName="text-[color-mix(in_oklab,rgb(217,70,239)_72%,var(--color-foreground)_28%)] hover:text-[color-mix(in_oklab,rgb(217,70,239)_86%,var(--color-foreground)_14%)]"
      />
    </div>
  );
}
