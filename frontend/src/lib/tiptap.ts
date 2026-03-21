import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

export const EMPTY_EDITOR_CONTENT: Record<string, unknown> = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

export function createPostEditorExtensions(placeholder?: string) {
  return [
    StarterKit.configure({
      codeBlock: false,
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Underline,
    Image.configure({
      inline: false,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "tiptap-link",
      },
    }),
    Placeholder.configure({
      placeholder: placeholder ?? "Viết nội dung bài blog của bạn ở đây...",
    }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
  ];
}
