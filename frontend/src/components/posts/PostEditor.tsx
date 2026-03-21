"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect } from "react";
import { EditorToolbar } from "@/components/posts/EditorToolbar";
import { createPostEditorExtensions, EMPTY_EDITOR_CONTENT } from "@/lib/tiptap";

interface PostEditorProps {
  content?: Record<string, unknown> | null;
  onChange: (payload: {
    json: Record<string, unknown>;
    html: string;
    text: string;
  }) => void;
}

export function PostEditor({ content, onChange }: PostEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: createPostEditorExtensions(),
    content: content ?? EMPTY_EDITOR_CONTENT,
    onUpdate: ({ editor: currentEditor }) => {
      onChange({
        json: currentEditor.getJSON(),
        html: currentEditor.getHTML(),
        text: currentEditor.getText(),
      });
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor min-h-[420px]",
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

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-border/70 bg-card/80 shadow-sm">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
