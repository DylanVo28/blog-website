"use client";

interface AIAnswerDisplayProps {
  content: string;
}

export function AIAnswerDisplay({ content }: AIAnswerDisplayProps) {
  return (
    <div className="mt-3 rounded-[1rem] bg-fuchsia-50/80 px-4 py-3">
      <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/92">{content}</p>
    </div>
  );
}
