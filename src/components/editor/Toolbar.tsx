'use client';

import { type Editor } from '@tiptap/react';
import { 
  Bold, Italic, Strikethrough,
  List, ListOrdered, Quote, 
  Link as LinkIcon, Image as ImageIcon, Youtube,
  ChevronDown, AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Check, X
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface ToolbarProps {
  editor: Editor | null;
  onImageClick: () => void;
}

export function Toolbar({ editor, onImageClick }: ToolbarProps) {
  if (!editor) return null;

  // Helper for consistent active state styling
  const activeClass = "data-[state=on]:bg-maroon-100 data-[state=on]:text-maroon-900 text-slate-500 hover:text-slate-900 hover:bg-slate-100";
  const iconClass = (isActive: boolean) => cn("h-4 w-4", isActive ? "text-maroon-900" : "currentColor");

  const getCurrentHeading = () => {
    if (editor.isActive('heading', { level: 1 })) return 'H1';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    return 'Normal';
  };

  // Helper Component to reduce repetition
  const ToolbarButton = ({ title, onClick, isActive, children }: any) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle size="sm" onPressedChange={onClick} pressed={isActive} className={activeClass}>
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent><p>{title}</p></TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={300}>
    <div className="border-b border-slate-200 bg-white sticky top-0 z-10 flex flex-wrap items-center gap-1 p-2">
      
      {/* 1. HEADINGS DROPDOWN */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={cn("gap-1 min-w-[80px] justify-between px-2 font-normal", editor.isActive('heading') ? "text-maroon-900 bg-maroon-50" : "text-slate-600")}>
                <span className="font-serif">{getCurrentHeading()}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent><p>Text Style</p></TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()} className="font-sans">Normal Paragraph</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="text-2xl font-bold font-serif">Heading 1</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="text-xl font-bold font-serif">Heading 2</DropdownMenuItem>
          <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="text-lg font-bold font-serif">Heading 3</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 2. TEXT FORMATTING */}
      <ToolbarButton title="Bold (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}>
        <Bold className={iconClass(editor.isActive('bold'))} />
      </ToolbarButton>
      
      <ToolbarButton title="Italic (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}>
        <Italic className={iconClass(editor.isActive('italic'))} />
      </ToolbarButton>

      <ToolbarButton title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')}>
        <Strikethrough className={iconClass(editor.isActive('strike'))} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 3. ALIGNMENT */}
      <ToolbarButton title="Align Left" onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })}>
        <AlignLeft className={iconClass(editor.isActive({ textAlign: 'left' }))} />
      </ToolbarButton>
      <ToolbarButton title="Align Center" onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })}>
        <AlignCenter className={iconClass(editor.isActive({ textAlign: 'center' }))} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 4. LISTS */}
      <ToolbarButton title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}>
        <List className={iconClass(editor.isActive('bulletList'))} />
      </ToolbarButton>
      
      <ToolbarButton title="Numbered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')}>
        <ListOrdered className={iconClass(editor.isActive('orderedList'))} />
      </ToolbarButton>

      <ToolbarButton title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')}>
        <Quote className={iconClass(editor.isActive('blockquote'))} />
      </ToolbarButton>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 5. MEDIA & LINKS */}
      
      {/* LINK POPOVER */}
      <LinkPopover editor={editor} iconClass={iconClass} />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={onImageClick} className="text-slate-500 hover:text-maroon-900">
            <ImageIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Insert Image</p></TooltipContent>
      </Tooltip>

      {/* YOUTUBE POPOVER */}
      <YoutubePopover editor={editor} />

      <div className="flex-1" />

      {/* 6. HISTORY */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo className="h-4 w-4 text-slate-400 hover:text-slate-700 disabled:opacity-30" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Undo (Ctrl+Z)</p></TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo className="h-4 w-4 text-slate-400 hover:text-slate-700 disabled:opacity-30" />
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Redo (Ctrl+Y)</p></TooltipContent>
      </Tooltip>
    </div>
    </TooltipProvider>
  );
}

function LinkPopover({ editor, iconClass }: any) {
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (open) {
            setUrl(editor.getAttributes('link').href || '');
        }
    }, [open, editor]);

    const save = () => {
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className={cn(editor.isActive('link') ? "bg-maroon-50 text-maroon-900" : "text-slate-500")}>
                            <LinkIcon className={iconClass(editor.isActive('link'))} />
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Add Link</p></TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-4" align="start">
               <div className="space-y-3">
                   <h4 className="font-medium text-sm text-slate-900">Add Link</h4>
                   <div className="flex gap-2">
                       <Input 
                         value={url} 
                         onChange={(e) => setUrl(e.target.value)} 
                         placeholder="https://example.com" 
                         className="h-8"
                         onKeyDown={(e) => e.key === 'Enter' && save()}
                       />
                       <Button size="sm" onClick={save} className="h-8 bg-maroon-700 hover:bg-maroon-800 text-white">Save</Button>
                   </div>
               </div>
            </PopoverContent>
        </Popover>
    )
}

function YoutubePopover({ editor }: any) {
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState('');

    const save = () => {
        if (url) {
            editor.commands.setYoutubeVideo({ src: url });
        }
        setOpen(false);
        setUrl('');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-[#FF0000]">
                            <Youtube className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Embed YouTube Video</p></TooltipContent>
            </Tooltip>
            <PopoverContent className="w-80 p-4" align="start">
               <div className="space-y-3">
                   <h4 className="font-medium text-sm text-slate-900">Embed YouTube</h4>
                   <div className="flex gap-2">
                       <Input 
                         value={url} 
                         onChange={(e) => setUrl(e.target.value)} 
                         placeholder="https://youtube.com/watch?v=..." 
                         className="h-8"
                         onKeyDown={(e) => e.key === 'Enter' && save()}
                       />
                       <Button size="sm" onClick={save} className="h-8 bg-[#FF0000] hover:bg-red-700 text-white">Embed</Button>
                   </div>
               </div>
            </PopoverContent>
        </Popover>
    )
}