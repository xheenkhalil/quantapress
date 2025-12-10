'use client';

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge"; // You might need to install this: npx shadcn@latest add badge
import { Settings, Image as ImageIcon, Globe, FileText, ImageIcon as MediaIcon, X, Tag, Sparkles, Save, Loader2 } from "lucide-react";
import MediaLibrary from "@/components/media/MediaLibrary";
import { MediaAsset } from "@/types/cms";

interface PostSettingsProps {
  // Metadata
  title: string; // Needed for Auto-SEO
  slug: string; setSlug: (s: string) => void;
  excerpt: string; setExcerpt: (s: string) => void;
  seoTitle: string; setSeoTitle: (s: string) => void;
  seoDesc: string; setSeoDesc: (s: string) => void;
  
  // Media
  featuredImage: MediaAsset | null;
  setFeaturedImage: (asset: MediaAsset | null) => void;

  // Tags (New)
  tags: string[];
  setTags: (tags: string[]) => void;

  // Actions (New)
  onSave: () => void;
  saving: boolean;
}

export function PostSettings({ 
  title, slug, setSlug, excerpt, setExcerpt, seoTitle, setSeoTitle, seoDesc, setSeoDesc, 
  featuredImage, setFeaturedImage,
  tags, setTags,
  onSave, saving
}: PostSettingsProps) {
  
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // -- LOGIC: YouTube Style Tags --
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // -- LOGIC: Intelligent SEO Fill --
  const handleAutoSEO = () => {
    if (!title) return;
    setSeoTitle(title);
    // If we had the full content here, we could summarize it. 
    // For now, we use the excerpt or a placeholder.
    setSeoDesc(excerpt || `Read more about ${title} on HeroZodiac.`);
  };

  const handleImageSelect = (asset: MediaAsset) => {
    setFeaturedImage(asset);
    setImageDialogOpen(false);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-maroon-700 hover:bg-maroon-50 gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto bg-slate-50/50 p-0 flex flex-col h-full">
        {/* HEADER */}
        <div className="p-6 bg-white border-b border-slate-200">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-maroon-900 font-serif">Post Settings</SheetTitle>
            <SheetDescription>Configure metadata, tags, and media.</SheetDescription>
          </SheetHeader>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Accordion type="single" collapsible defaultValue="general" className="w-full space-y-4">
            
            {/* 1. GENERAL */}
            <AccordionItem value="general" className="border border-slate-200 bg-white rounded-lg px-4 shadow-sm">
                <AccordionTrigger className="hover:no-underline text-slate-700 font-semibold">
                   <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-slate-400" /> General</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                    <div className="grid gap-2">
                        <Label>URL Slug</Label>
                        <Input value={slug} onChange={e => setSlug(e.target.value)} className="font-mono text-sm bg-slate-50" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Excerpt</Label>
                        <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} className="h-24 bg-slate-50" placeholder="Short summary..." />
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* 2. TAGS (NEW FEATURES) */}
            <AccordionItem value="tags" className="border border-slate-200 bg-white rounded-lg px-4 shadow-sm">
              <AccordionTrigger className="hover:no-underline text-slate-700 font-semibold">
                <div className="flex items-center gap-3"><Tag className="h-4 w-4 text-slate-400" /> Tags</div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-md p-2 flex flex-wrap gap-2 min-h-[42px] focus-within:ring-2 focus-within:ring-maroon-500/20 focus-within:border-maroon-500 transition">
                        {tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 pl-2 pr-1 py-1 flex items-center gap-1">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-red-500 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                            </Badge>
                        ))}
                        <input 
                            className="bg-transparent border-none outline-none text-sm flex-1 min-w-[80px] placeholder:text-slate-400"
                            placeholder={tags.length === 0 ? "Add tags (press Enter)..." : ""}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                        />
                    </div>
                    <p className="text-[10px] text-slate-400">Separate tags with commas or the Enter key.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. MEDIA */}
            <AccordionItem value="media" className="border border-slate-200 bg-white rounded-lg px-4 shadow-sm">
              <AccordionTrigger className="hover:no-underline text-slate-700 font-semibold">
                 <div className="flex items-center gap-3"><MediaIcon className="h-4 w-4 text-slate-400" /> Featured Media</div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                {featuredImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={featuredImage.file_url} alt="Featured" className="w-full h-48 object-cover" />
                    <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => setFeaturedImage(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                    <DialogTrigger asChild>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-maroon-300 hover:text-maroon-600 transition cursor-pointer">
                        <ImageIcon className="h-6 w-6 mb-2" />
                        <span className="text-xs font-semibold uppercase">Select Image</span>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Select Featured Image</DialogTitle>
                      </DialogHeader>
                      <MediaLibrary onSelect={handleImageSelect} />
                    </DialogContent>
                  </Dialog>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* 4. INTELLIGENT SEO */}
            <AccordionItem value="seo" className="border border-slate-200 bg-white rounded-lg px-4 shadow-sm">
                <AccordionTrigger className="hover:no-underline text-slate-700 font-semibold">
                    <div className="flex items-center gap-3"><Globe className="h-4 w-4 text-slate-400" /> SEO & Social</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2 pb-4">
                     {/* Intelligent Button */}
                     <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAutoSEO}
                        className="w-full border-maroon-100 text-maroon-700 hover:bg-maroon-50 mb-2"
                     >
                        <Sparkles className="h-3 w-3 mr-2" /> Auto-Fill from Content
                     </Button>

                     <div className="grid gap-2">
                        <Label>Meta Title</Label>
                        <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} />
                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${seoTitle.length > 60 ? 'bg-orange-400' : 'bg-green-400'}`} style={{ width: `${Math.min((seoTitle.length / 60) * 100, 100)}%` }} />
                        </div>
                     </div>
                     <div className="grid gap-2">
                        <Label>Meta Description</Label>
                        <Textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} />
                     </div>
                </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* FOOTER - WORDPRESS STYLE SAVE */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
            <Button onClick={onSave} disabled={saving} className="w-full bg-maroon-700 hover:bg-maroon-800 text-white shadow-lg">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? 'Saving Changes...' : 'Save Changes'}
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}