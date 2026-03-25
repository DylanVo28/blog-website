"use client";

import { ExpandableText } from "@/components/shared/ExpandableText";

interface AIAnswerDisplayProps {
  content: string;
}

export function AIAnswerDisplay({ content }: AIAnswerDisplayProps) {
  return (
    <div className="mt-3 rounded-[1rem] bg-fuchsia-50/80 px-4 py-3">
      <ExpandableText
        content={content}
        collapsedMaxHeight={196}
        contentClassName="text-sm leading-7 text-foreground/92"
        buttonClassName="text-fuchsia-700 hover:text-fuchsia-800"
      />
    </div>
  );
}
