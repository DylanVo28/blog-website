"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ExpandableTextProps {
  content: string;
  className?: string;
  contentClassName?: string;
  buttonClassName?: string;
  collapsedMaxHeight?: number;
  expandLabel?: string;
  collapseLabel?: string;
}

const OVERFLOW_TOLERANCE = 2;

export function ExpandableText({
  content,
  className,
  contentClassName,
  buttonClassName,
  collapsedMaxHeight = 112,
  expandLabel = "See more",
  collapseLabel = "See less",
}: ExpandableTextProps) {
  const contentId = useId();
  const contentRef = useRef<HTMLParagraphElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const measureContent = useEffectEvent(() => {
    const element = contentRef.current;

    if (!element) {
      return;
    }

    const nextHeight = element.scrollHeight;
    const nextIsOverflowing = nextHeight - collapsedMaxHeight > OVERFLOW_TOLERANCE;

    setContentHeight(nextHeight);
    setIsOverflowing(nextIsOverflowing);

    if (!nextIsOverflowing) {
      setIsExpanded(false);
    }
  });

  useEffect(() => {
    measureContent();
  }, [collapsedMaxHeight, content]);

  useEffect(() => {
    const element = contentRef.current;

    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      measureContent();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [collapsedMaxHeight, content]);

  const shouldCollapse = isOverflowing && !isExpanded;
  const resolvedMaxHeight = shouldCollapse
    ? `${collapsedMaxHeight}px`
    : contentHeight > 0
      ? `${contentHeight}px`
      : undefined;
  const collapseMask = shouldCollapse
    ? "linear-gradient(180deg, rgb(0 0 0 / 1) 72%, rgb(0 0 0 / 0))"
    : undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-out"
        style={{
          maxHeight: resolvedMaxHeight,
          maskImage: collapseMask,
          WebkitMaskImage: collapseMask,
        }}
      >
        <p
          id={contentId}
          ref={contentRef}
          className={cn("whitespace-pre-wrap break-words [overflow-wrap:anywhere]", contentClassName)}
        >
          {content}
        </p>
      </div>

      {isOverflowing ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-controls={contentId}
          aria-expanded={isExpanded}
          className={cn(
            "mt-2 h-auto px-0 text-xs font-semibold text-primary hover:bg-transparent hover:text-primary/80",
            buttonClassName,
          )}
          onClick={() => setIsExpanded((value) => !value)}
        >
          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          {isExpanded ? collapseLabel : expandLabel}
        </Button>
      ) : null}
    </div>
  );
}
