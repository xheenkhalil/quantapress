'use client';

// We still keep the Project ID constant for now
const DEMO_PROJECT_ID = '00000000-0000-0000-0000-000000000000';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { PostSettings, CategoryOption } from '@/components/editor/PostSettings';
import { useRouter } from 'next/navigation';
import { MediaAsset } from '@/types/cms';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MediaLibrary from "@/components/media/MediaLibrary";
import { Editor } from '@tiptap/react';
import { SeoPreview } from '@/components/editor/SeoPreview';
import { useUser } from '@/hooks/useUser';
import { ensureAuthor } from '@/app/auth/actions';

export default function NewPostPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);

  // -- STATE --
  const [projectId, setProjectId] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<any>(null);
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [featuredImage, setFeaturedImage] = useState<MediaAsset | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  
  // Category State
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [isEditorMediaOpen, setIsEditorMediaOpen] = useState(false);

  // Load Project & Categories on mount
  useEffect(() => {
    async function initData() {
        // 1. Fetch Project
        const { data: projData, error: projError } = await supabase.from('projects').select('id').limit(1).single();
        
        if (projData) {
            setProjectId(projData.id);
        } else {
            console.error('No project found! Please create a project in Supabase.', projError);
            toast.error('System Error: No valid Project found.');
        }

        // 2. Fetch Categories
        const { data: catData, error: catError } = await supabase.from('categories').select('id, name');
        if (catData) {
            setCategories(catData);
        } else if (catError) {
            console.error("Error fetching categories:", catError);
        }
    }
    initData();
  }, []);

  // Auto-generate slug and seoTitle
  useEffect(() => {
    if (!postId && title) {
      if (!slug) setSlug(title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
      if (!seoTitle) setSeoTitle(title);
    }
  }, [title, postId]);

  const handleEditorMediaSelect = (asset: MediaAsset) => {
    if (editorRef.current) {
      editorRef.current.chain().focus().setImage({ 
        src: asset.file_url, 
        alt: asset.alt_text || asset.title || asset.file_name,
        title: asset.title
      }).run();

      if (asset.caption) {
       editorRef.current.chain().focus().insertContent(`<p class="text-center text-sm text-gray-500 italic mt-2">${asset.caption}</p>`).run();
      }
    }
    setIsEditorMediaOpen(false);
  };

  const handleCreateCategory = async (name: string) => {
    if (!projectId) {
        toast.error("No Project ID found");
        return;
    }
    
    // 1. Create in DB
    const catSlug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const { data, error } = await supabase.from('categories').insert({
        project_id: projectId,
        name,
        slug: catSlug
    }).select().single();

    if (error) {
        console.error("Create category error:", error);
        toast.error("Failed to create category");
        return;
    }

    // 2. Update local state
    if (data) {
        setCategories([...categories, { id: data.id, name: data.name }]);
        setSelectedCategories([...selectedCategories, data.id]);
        toast.success(`Category "${name}" created!`);
    }
  };

  // --- SAVE LOGIC (FIXED) ---
  async function savePost(status: 'draft' | 'published') {
    if (userLoading) return;
    if (!user) return toast.error('You must be logged in to save.');
    if (!projectId) return toast.error('System Error: No Project ID loaded.');
    if (!title) return toast.error('Please enter a title');
    
    setSaving(true);

    // 0. ENSURE AUTHOR EXISTS (CRITICAL FIX)
    // We attempt to sync the author profile first.
    const authorRes = await ensureAuthor({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
        avatar_url: user.user_metadata?.avatar_url
    });

    // FIX: If this fails, we MUST stop here.
    if (!authorRes.success) {
        console.error("Failed to sync author profile:", authorRes.error);
        toast.error("Error: Could not verify author profile. Cannot save post.");
        setSaving(false);
        return; 
    }

    // Proceed only if author is confirmed
    const postData: any = {
      project_id: projectId,
      author_id: user.id, // This ID is now guaranteed to exist in the authors table
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

    // 1. UPSERT POST
    if (postId) {
      const res = await supabase
        .from('posts')
        .update(postData)
        .eq('id', postId)
        .select()
        .single();
      
      error = res.error;
      data = res.data;
    } else {
      const res = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();
        
      error = res.error;
      data = res.data;
    }

    if (error) {
       console.error("Supabase Save Error:", error);
       setSaving(false);
       if (error.message.includes('unique constraint')) {
         toast.error('This URL slug is already taken.');
       } else if (error.message.includes('foreign key constraint')) {
         toast.error('Database Error: Author or Project ID missing.');
       } else {
         toast.error('Error saving post: ' + error.message);
       }
       return;
    }

    // 2. HANDLE TAGS
    const currentPostId = data.id;

    // A. Upsert Tags individually to get IDs
    const tagIds: string[] = [];
    for (const tagName of tags) {
        const tagSlug = tagName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        
        // Try to find existing
        let { data: existingTag } = await supabase.from('tags').select('id').eq('slug', tagSlug).single();
        
        if (!existingTag) {
            // Create new
            const { data: newTag } = await supabase.from('tags').insert({
                project_id: projectId,
                name: tagName,
                slug: tagSlug
            }).select('id').single();
            if (newTag) existingTag = newTag;
        }

        if (existingTag) tagIds.push(existingTag.id);
    }

    // B. Sync Post <-> Tags
    await supabase.from('post_tags').delete().eq('post_id', currentPostId);
    if (tagIds.length > 0) {
        const ptRows = tagIds.map(tid => ({ post_id: currentPostId, tag_id: tid }));
        await supabase.from('post_tags').insert(ptRows);
    }

    // 3. HANDLE CATEGORIES
    await supabase.from('post_categories').delete().eq('post_id', currentPostId);
    if (selectedCategories.length > 0) {
        const pcRows = selectedCategories.map(cid => ({ post_id: currentPostId, category_id: cid }));
        await supabase.from('post_categories').insert(pcRows);
    }

    setSaving(false);

    if (data && !postId) {
      setPostId(data.id);
      window.history.replaceState(null, '', `/dashboard/posts/${data.id}`);
    }
    
    const action = status === 'published' ? 'Published' : 'Saved';
    toast.success(`Post ${action} Successfully!`);
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
            categories={categories} selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} onCreateCategory={handleCreateCategory}
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
            className="w-full text-3xl font-bold font-serif text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-4 focus:ring-maroon-50 focus:border-maroon-600 transition-all shadow-sm"
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