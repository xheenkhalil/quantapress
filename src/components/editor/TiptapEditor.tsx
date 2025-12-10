'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link'; // NEW
import YoutubeExtension from '@tiptap/extension-youtube'; // NEW
import TextAlign from '@tiptap/extension-text-align'; // NEW (Optional but good)
import { Toolbar } from './Toolbar';
import { useEffect } from 'react';

interface EditorProps {
  content?: any;
  onChange: (json: any) => void;
  onMediaSelect: () => void;
  editorRef?: React.MutableRefObject<Editor | null>;
}

export default function TiptapEditor({ content, onChange, onMediaSelect, editorRef }: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension,
      LinkExtension.configure({
        openOnClick: false, // Don't open links while editing
        autolink: true,
      }),
      YoutubeExtension.configure({
        controls: false,
        nocookie: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Write your masterpiece...',
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        // Updated prose classes for better link/embed styling
        class: 'prose prose-lg prose-slate max-w-none focus:outline-none min-h-[500px] px-8 py-4 selection:bg-maroon-100 selection:text-maroon-900 prose-img:rounded-xl prose-headings:font-serif prose-a:text-maroon-700 prose-a:no-underline hover:prose-a:underline',
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden flex flex-col">
      <Toolbar editor={editor} onImageClick={onMediaSelect} />
      <EditorContent editor={editor} className="flex-1" />
    </div>
  );
}