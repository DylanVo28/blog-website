"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { uploadApi } from "@/services/api/upload.api";

interface EditorToolbarProps {
  editor: Editor;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function openImagePicker() {
    fileInputRef.current?.click();
  }

  async function handleImageUpload(file: File) {
    try {
      const uploaded = await uploadApi.uploadFile(file);
      editor.chain().focus().setImage({ src: uploaded.url, alt: file.name }).run();
      toast.success("Đã chèn ảnh vào nội dung.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ảnh lên.");
    }
  }

  function promptForLink() {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Nhập đường dẫn bạn muốn gắn vào đoạn chọn:", previousUrl ?? "");

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  const actions = [
    {
      label: "Undo",
      icon: Undo2,
      onClick: () => editor.chain().focus().undo().run(),
      active: false,
      disabled: !editor.can().chain().focus().undo().run(),
    },
    {
      label: "Redo",
      icon: Redo2,
      onClick: () => editor.chain().focus().redo().run(),
      active: false,
      disabled: !editor.can().chain().focus().redo().run(),
    },
    {
      label: "Heading 1",
      icon: Heading1,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive("heading", { level: 1 }),
    },
    {
      label: "Heading 2",
      icon: Heading2,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      label: "Bold",
      icon: Bold,
      onClick: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      label: "Italic",
      icon: Italic,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    {
      label: "Underline",
      icon: UnderlineIcon,
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive("underline"),
    },
    {
      label: "Bullet List",
      icon: List,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      label: "Ordered List",
      icon: ListOrdered,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
    },
    {
      label: "Quote",
      icon: Quote,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
    },
    {
      label: "Code Block",
      icon: Code2,
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
      active: editor.isActive("codeBlock"),
    },
    {
      label: "Link",
      icon: Link2,
      onClick: promptForLink,
      active: editor.isActive("link"),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/70 bg-muted/40 px-3 py-3">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Button
            key={action.label}
            type="button"
            size="icon"
            variant={action.active ? "default" : "outline"}
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.label}
          >
            <Icon className="size-4" />
          </Button>
        );
      })}

      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={openImagePicker}
        aria-label="Image"
      >
        <ImagePlus className="size-4" />
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleImageUpload(file);
          }
          event.target.value = "";
        }}
      />
    </div>
  );
}
