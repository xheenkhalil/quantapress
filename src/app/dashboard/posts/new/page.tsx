'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner'; // Ensure you have installed sonner
import TiptapEditor from '@/components/editor/TiptapEditor';
import { PostSettings } from '@/components/editor/PostSettings';
import { useRouter } from 'next/navigation';
import { MediaAsset } from '@/types/cms';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MediaLibrary from "@/components/media/MediaLibrary";
import { Editor } from '@tiptap/react';
import { SeoPreview } from '@/components/editor/SeoPreview';
import { useUser } from '@/hooks/useUser';

// We still keep the Project ID constant for now
const DEMO_PROJECT_ID = '00000000-0000-0000-0000-000000000000';

export default function NewPostPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);

  // -- STATE --
  const [postId, setPostId] = useState<string | null>(null); // CRITICAL: Track ID after first save
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<any>(null);
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [featuredImage, setFeaturedImage] = useState<MediaAsset | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [isEditorMediaOpen, setIsEditorMediaOpen] = useState(false);

  // Auto-generate slug and seoTitle
  useEffect(() => {
    // Only auto-generate if we haven't saved yet (to prevent overwriting manual edits)
    if (!postId && title) {
      if (!slug) setSlug(title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
      if (!seoTitle) setSeoTitle(title);
    }
  }, [title, postId]);

  const handleEditorMediaSelect = (asset: MediaAsset) => {
    if (editorRef.current) {
      editorRef.current.chain().focus().setImage({ src: asset.file_url, alt: asset.alt_text_default || asset.file_name }).run();
    }
    setIsEditorMediaOpen(false);
  };

  async function savePost(status: 'draft' | 'published') {
    if (userLoading) return;
    if (!user) return toast.error('You must be logged in to save.');
    if (!title) return toast.error('Please enter a title');
    
    setSaving(true);

    const postData: any = {
      project_id: DEMO_PROJECT_ID,
      author_id: user.id, // Use Real User ID
      title,
      slug,
      content,
      excerpt,
      seo_title: seoTitle,
      seo_description: seoDesc,
      featured_image_id: featuredImage ? featuredImage.id : null,
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'published') {
      postData.published_at = new Date().toISOString();
    }

    let error;
    let data;

    if (postId) {
      // UPDATE EXISTING POST
      const res = await supabase
        .from('posts')
        .update(postData)
        .eq('id', postId)
        .select()
        .single();
      
      error = res.error;
      data = res.data;
    } else {
      // CREATE NEW POST
      const res = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();
        
      error = res.error;
      data = res.data;
    }

    setSaving(false);

    if (error) {
      console.error(error);
      // Handle specifically the unique slug error to give better feedback
      if (error.message.includes('unique constraint')) {
        toast.error('This URL slug is already taken. Please change it in Settings.');
      } else {
        toast.error('Error saving post: ' + error.message);
      }
    } else {
      // If this was a new post, save the ID so future clicks update instead of create
      if (data && !postId) {
        setPostId(data.id);
        // Optional: Update URL to edit URL without refreshing
        window.history.replaceState(null, '', `/dashboard/posts/${data.id}`);
      }
      
      const action = status === 'published' ? 'Published' : 'Saved';
      toast.success(`Post ${action} Successfully!`);
    }
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-maroon-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">Quanta Press</span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              {saving ? 'Saving...' : postId ? 'Editing Mode' : 'Draft Mode'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PostSettings 
            title={title}
            slug={slug} setSlug={setSlug}
            excerpt={excerpt} setExcerpt={setExcerpt}
            seoTitle={seoTitle} setSeoTitle={setSeoTitle}
            seoDesc={seoDesc} setSeoDesc={setSeoDesc}
            featuredImage={featuredImage} setFeaturedImage={setFeaturedImage}
            tags={tags} setTags={setTags}
            onSave={() => savePost('draft')}
            saving={saving}
          />
          
          <div className="h-6 w-px bg-slate-200" />
          
          <Button onClick={() => savePost('draft')} disabled={saving} variant="outline" className="border-maroon-100 text-maroon-700 hover:bg-maroon-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Draft
          </Button>

          <Button onClick={() => savePost('published')} disabled={saving} className="bg-maroon-700 hover:bg-maroon-800 text-white shadow-lg shadow-maroon-900/10">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Publish
          </Button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-12 px-6">
        <div className="mb-8">
            <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article Title Here..." 
            className="w-full text-5xl font-black text-slate-900 placeholder:text-slate-200 border-none bg-transparent outline-none ring-0 p-0 font-serif leading-tight tracking-tight"
            />
        </div>

        <div className="min-h-[500px] mb-12">
          <TiptapEditor
            content={content}
            onChange={setContent}
            onMediaSelect={() => setIsEditorMediaOpen(true)}
            editorRef={editorRef}
          />
        </div>

        <SeoPreview 
          title={title}
          slug={slug}
          excerpt={excerpt}
          seoTitle={seoTitle}
          seoDesc={seoDesc}
        />
      </main>

      <Dialog open={isEditorMediaOpen} onOpenChange={setIsEditorMediaOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Insert Image into Article</DialogTitle>
          </DialogHeader>
          <MediaLibrary onSelect={handleEditorMediaSelect} />
        </DialogContent>
      </Dialog>
    </div>
  );
}