"use client";

import { Bot } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState, type RefObject } from "react";

interface TextSelectionPopupProps {
  containerRef: RefObject<HTMLElement | null>;
  onAskAI: (selectedText: string) => void;
}

interface PopupPosition {
  top: number;
  left: number;
}

export function TextSelectionPopup({
  containerRef,
  onAskAI,
}: TextSelectionPopupProps) {
  const [position, setPosition] = useState<PopupPosition | null>(null);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    function hidePopup() {
      setPosition(null);
    }

    function handleMouseUp() {
      const selection = window.getSelection();

      if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !containerRef.current) {
        hidePopup();
        return;
      }

      const text = selection.toString().trim();

      if (text.length < 10) {
        hidePopup();
        return;
      }

      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;

      if (
        !anchorNode ||
        !focusNode ||
        !containerRef.current.contains(anchorNode) ||
        !containerRef.current.contains(focusNode)
      ) {
        hidePopup();
        return;
      }

      const rect = selection.getRangeAt(0).getBoundingClientRect();

      setSelectedText(text);
      setPosition({
        top: rect.top + window.scrollY - 56,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", hidePopup);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", hidePopup);
    };
  }, [containerRef]);

  if (!position) {
    return null;
  }

  return createPortal(
    <div
      className="absolute z-50 -translate-x-1/2 animate-in fade-in-0 zoom-in-95"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <button
        type="button"
        onClick={() => {
          onAskAI(selectedText);
          setPosition(null);
          window.getSelection()?.removeAllRanges();
        }}
        className="inline-flex items-center gap-2 rounded-full bg-fuchsia-700 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-fuchsia-800"
      >
        <Bot className="size-4" />
        Hỏi AI (1.000đ)
      </button>
    </div>,
    document.body,
  );
}
