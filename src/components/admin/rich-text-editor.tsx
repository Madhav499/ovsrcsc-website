'use client';

import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect } from 'react';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  ImagePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  invalid?: boolean;
}

type ToolAction = {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  on: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
};

const TOOLS: ToolAction[] = [
  { label: 'Bold', Icon: Bold, on: (e) => e.isActive('bold'), run: (e) => e.chain().focus().toggleBold().run() },
  { label: 'Italic', Icon: Italic, on: (e) => e.isActive('italic'), run: (e) => e.chain().focus().toggleItalic().run() },
  { label: 'Underline', Icon: UnderlineIcon, on: () => false, run: (e) => e.chain().focus().toggleMark('underline').run() },
  { label: 'Strike', Icon: Strikethrough, on: (e) => e.isActive('strike'), run: (e) => e.chain().focus().toggleStrike().run() },
  { label: 'Heading 2', Icon: Heading2, on: (e) => e.isActive('heading', { level: 2 }), run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: 'Heading 3', Icon: Heading3, on: (e) => e.isActive('heading', { level: 3 }), run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: 'Bulleted list', Icon: List, on: (e) => e.isActive('bulletList'), run: (e) => e.chain().focus().toggleBulletList().run() },
  { label: 'Numbered list', Icon: ListOrdered, on: (e) => e.isActive('orderedList'), run: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: 'Quote', Icon: Quote, on: (e) => e.isActive('blockquote'), run: (e) => e.chain().focus().toggleBlockquote().run() },
];

export function RichTextEditor({ value, onChange, placeholder = 'Write here…', invalid }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor: current }) => {
      onChange(current.isEmpty ? '' : current.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'admin-richtext min-h-40 max-h-[26rem] overflow-y-auto px-3.5 py-3 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML() && editor.isEmpty === Boolean(value === '')) {
      // Keep external resets in sync (e.g. switching edited rows)
      if (editor.getHTML() !== value) {
        editor.commands.setContent(value || '', { emitUpdate: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL (https://…)', previous ?? 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }, [editor]);

  const setImage = useCallback(() => {
    if (!editor) return;
    const src = window.prompt('Image path from media library (/media/…)', '/media/');
    if (!src || src.trim() === '' || src === '/media/') return;
    editor.chain().focus().setImage({ src: src.trim() }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className={cn('admin-richtext-shell', invalid && 'admin-field-invalid')} aria-busy="true">
        <p className="px-3.5 py-3 text-sm text-ink-muted">{placeholder}</p>
      </div>
    );
  }

  return (
    <div className={cn('admin-richtext-shell', invalid && 'admin-field-invalid')}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-[#f6f5f0] px-1.5 py-1.5">
        {TOOLS.map(({ label, Icon, on, run }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={on(editor)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(editor)}
            className={cn(
              'grid size-7 place-items-center rounded-md text-ink-soft transition-colors hover:bg-ink/8 hover:text-ink',
              on(editor) && 'bg-ink/10 text-ink',
            )}
          >
            <Icon className={cn('size-3.5', label === 'Underline' && 'translate-y-[3px]')} aria-hidden="true" />
          </button>
        ))}
        <span className="mx-0.5 h-4 w-px bg-line" aria-hidden="true" />
        <button
          type="button"
          title="Link"
          aria-label="Insert link"
          onMouseDown={(event) => event.preventDefault()}
          onClick={setLink}
          className={cn(
            'grid size-7 place-items-center rounded-md text-ink-soft transition-colors hover:bg-ink/8 hover:text-ink',
            editor.isActive('link') && 'bg-ink/10 text-ink',
          )}
        >
          <Link2 className="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          title="Image"
          aria-label="Insert image"
          onMouseDown={(event) => event.preventDefault()}
          onClick={setImage}
          className="grid size-7 place-items-center rounded-md text-ink-soft transition-colors hover:bg-ink/8 hover:text-ink"
        >
          <ImagePlus className="size-3.5" aria-hidden="true" />
        </button>
        <span className="mx-0.5 h-4 w-px bg-line" aria-hidden="true" />
        <button
          type="button"
          title="Undo"
          aria-label="Undo"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="grid size-7 place-items-center rounded-md text-ink-soft transition-colors hover:bg-ink/8 disabled:opacity-30"
        >
          <Undo2 className="size-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          title="Redo"
          aria-label="Redo"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="grid size-7 place-items-center rounded-md text-ink-soft transition-colors hover:bg-ink/8 disabled:opacity-30"
        >
          <Redo2 className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
