"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";
import { createPostEditorExtensions, EMPTY_EDITOR_CONTENT } from "@/lib/tiptap";

interface RichTextRendererProps {
  content?: Record<string, unknown> | null;
}

export function RichTextRenderer({ content }: RichTextRendererProps) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: createPostEditorExtensions(),
    content: content ?? EMPTY_EDITOR_CONTENT,
    editorProps: {
      attributes: {
        class: "tiptap-renderer",
      },
    },
  });

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content, {
        emitUpdate: false,
      });
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return <EditorContent editor={editor} />;
}
