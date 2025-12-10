'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { PostSettings } from '@/components/editor/PostSettings';
import { useRouter, useParams } from 'next/navigation';
import { MediaAsset } from '@/types/cms';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MediaLibrary from "@/components/media/MediaLibrary";
import { Editor } from '@tiptap/react';
import { SeoPreview } from '@/components/editor/SeoPreview';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const editorRef = useRef<Editor | null>(null);

  // -- STATE --
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<any>(null);
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [featuredImage, setFeaturedImage] = useState<MediaAsset | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  const [saving, setSaving] = useState(false);
  const [isEditorMediaOpen, setIsEditorMediaOpen] = useState(false);

  // FETCH POST DATA
  useEffect(() => {
    async function fetchPost() {
      if (!postId) return;
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (error) {
        toast.error("Error loading post: " + error.message);
        router.push('/dashboard/posts');
        return;
      }

      if (data) {
        setTitle(data.title);
        setContent(data.content);
        setSlug(data.slug);
        setExcerpt(data.excerpt || '');
        setSeoTitle(data.seo_title || '');
        setSeoDesc(data.seo_description || '');
        setStatus(data.status);
        if (data.featured_image_id) {
            // Ideally fetch the full media object if not joined, assuming we need to for now
            // For this demo, we might need to fetch the media asset too if not returned by view
            fetchMedia(data.featured_image_id);
        }
      }
      setLoading(false);
    }

    async function fetchMedia(id: string) {
        const { data } = await supabase.from('media').select('*').eq('id', id).single();
        if(data) setFeaturedImage(data);
    }

    fetchPost();
  }, [postId, router]);

  // Handle Editor Media Insertion
  const handleEditorMediaSelect = (asset: MediaAsset) => {
    if (editorRef.current) {
      editorRef.current.chain().focus().setImage({ src: asset.file_url, alt: asset.alt_text_default || asset.file_name }).run();
    }
    setIsEditorMediaOpen(false);
  };

  // Save Function
  async function savePost(newStatus?: 'draft' | 'published') {
    if (!title) return toast.error('Please enter a title');
    if (editorRef.current?.isEmpty) return toast.error('Please write some content');
    setSaving(true);

    const targetStatus = newStatus || status;

    const postData: any = {
      title,
      slug,
      content,
      excerpt,
      seo_title: seoTitle,
      seo_description: seoDesc,
      featured_image_id: featuredImage ? featuredImage.id : null,
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    if (targetStatus === 'published' && status !== 'published') {
      postData.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('posts')
      .update(postData)
      .eq('id', postId);

    setSaving(false);

    if (error) {
      console.error(error);
      toast.error('Error saving post: ' + error.message);
    } else {
      setStatus(targetStatus);
      toast.success(`Post ${targetStatus === 'published' ? 'Published' : 'Saved'} Successfully!`);
    }
  }

  if (loading) {
    return (
        <div className="h-screen flex items-center justify-center bg-white text-maroon-700">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      
      {/* 1. TOP NAVIGATION BAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/posts" className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-maroon-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">Editing Post</span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              {saving ? 'Saving...' : (status === 'published' ? 'Published' : 'Draft Mode')}
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
            onSave={() => savePost()}
            saving={saving}
          />
          
          <div className="h-6 w-px bg-slate-200" />
          
          <Button onClick={() => savePost('draft')} disabled={saving} variant="outline" className="border-maroon-100 text-maroon-700 hover:bg-maroon-50">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>

          <Button onClick={() => savePost('published')} disabled={saving} className="bg-maroon-700 hover:bg-maroon-800 text-white shadow-lg shadow-maroon-900/10">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            {status === 'published' ? 'Update' : 'Publish'}
          </Button>
        </div>
      </nav>

      {/* 2. MAIN WRITING AREA */}
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

      {/* Dialog for inserting images into the editor body */}
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