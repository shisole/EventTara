"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
        "hover:bg-gray-200 dark:hover:bg-gray-600",
        "disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-gray-200 text-gray-900 dark:bg-gray-600 dark:text-white"
          : "text-gray-600 dark:text-gray-400",
      )}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none",
          "min-h-[160px] px-4 py-3 outline-none",
          "focus:outline-none",
          "[&_p.is-editor-empty:first-child::before]:text-gray-400",
          "[&_p.is-editor-empty:first-child::before]:dark:text-gray-500",
          "[&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_p.is-editor-empty:first-child::before]:float-left",
          "[&_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_p.is-editor-empty:first-child::before]:h-0",
        ),
        "data-placeholder": placeholder ?? "Write your waiver text...",
      },
    },
  });

  // Sync external value changes (e.g. form reset or initial load)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
    // Only re-sync when `value` changes from outside, not on every editor update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!editor) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 h-[220px]" />
    );
  }

  return (
    <div className="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden focus-within:border-lime-500 focus-within:ring-2 focus-within:ring-lime-200 dark:focus-within:ring-lime-800 transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 dark:border-gray-700 px-2 py-1.5 bg-gray-50 dark:bg-gray-800/80">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
        >
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
        >
          <span className="italic">I</span>
        </ToolbarButton>

        <div className="mx-1 h-5 w-px bg-gray-300 dark:bg-gray-600" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 5A.75.75 0 0 1 2.75 9h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 9.75Zm0 5a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
              clipRule="evenodd"
            />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Ordered List"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M6 4.75A.75.75 0 0 1 6.75 4h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 4.75ZM6 9.75A.75.75 0 0 1 6.75 9h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 9.75Zm0 5a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1-.75-.75ZM1.992 4.748a.75.75 0 0 1 .75-.75h.508a.75.75 0 0 1 .75.75v2.502h.004a.75.75 0 0 1 0 1.5h-1.51a.75.75 0 0 1 0-1.5H3V5.498h-.258a.75.75 0 0 1-.75-.75ZM2 10.75a.75.75 0 0 1 .75-.75h.508a.75.75 0 0 1 .697.473l.364.844H4.25a.75.75 0 0 1 .72.532l.004.015-.003.006-.727 1.63a.75.75 0 0 1-1.37-.61l.36-.808H2.75a.75.75 0 0 1-.75-.75v-1.582Z"
              clipRule="evenodd"
            />
          </svg>
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}
