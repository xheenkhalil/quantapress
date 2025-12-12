'use client';



import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import TiptapEditor from '@/components/editor/TiptapEditor';
import { PostSettings, CategoryOption } from '@/components/editor/PostSettings';
import { useRouter, useParams } from 'next/navigation';
import { MediaAsset } from '@/types/cms';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MediaLibrary from "@/components/media/MediaLibrary";
import { Editor } from '@tiptap/react';
import { SeoPreview } from '@/components/editor/SeoPreview';
import { useUser } from '@/hooks/useUser';
import { ensureAuthor } from '@/app/auth/actions';

export default function EditPostPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const params = useParams();
  const postId = params.id as string;
  const editorRef = useRef<Editor | null>(null);

  // -- STATE --
  const [projectId, setProjectId] = useState<string | null>(null);
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

  // Category State
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [isEditorMediaOpen, setIsEditorMediaOpen] = useState(false);

  // FETCH POST DATA
  useEffect(() => {
    async function fetchPostData() {
      if (!postId) return;
      
      // 0. Fetch Project (assuming post's project_id, or fall back to system first)
      // Actually, let's trust the post's project_id if it exists, or just fetch system default.
      // For editing, we should probably stick to the post's project.
      
      // 1. Fetch Post
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();
      
      if (error) {
        toast.error("Error loading post: " + error.message);
        router.push('/dashboard/posts');
        return;
      }

      if (post) {
        setProjectId(post.project_id); // Use the post's project ID
        setTitle(post.title);
        setContent(post.content);
        setSlug(post.slug);
        setExcerpt(post.excerpt || '');
        setSeoTitle(post.seo_title || '');
        setSeoDesc(post.seo_description || '');
        setStatus(post.status);
        if (post.featured_image_id) {
            fetchMedia(post.featured_image_id);
        }

        // 2. Fetch Associated Tags
        const { data: ptData } = await supabase.from('post_tags').select('tag_id, tags(name)').eq('post_id', postId);
        if (ptData) {
            const loadedTags = ptData.map((item: any) => item.tags?.name).filter(Boolean);
            setTags(loadedTags);
        }

        // 3. Fetch Associated Categories
        const { data: pcData } = await supabase.from('post_categories').select('category_id').eq('post_id', postId);
        if (pcData) {
            const loadedCatIds = pcData.map((item: any) => item.category_id);
            setSelectedCategories(loadedCatIds);
        }
      }

      // 4. Fetch All Categories
      const { data: allCats } = await supabase.from('categories').select('id, name');
      if (allCats) setCategories(allCats);

      setLoading(false);
    }

    async function fetchMedia(id: string) {
        const { data } = await supabase.from('media').select('*').eq('id', id).single();
        if(data) setFeaturedImage(data);
    }

    fetchPostData();
  }, [postId, router]);

  // Handle Create Category (Quick Add)
  const handleCreateCategory = async (name: string) => {
    if (!projectId) {
        toast.error("No Project ID");
        return;
    }
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const { data, error } = await supabase.from('categories').insert({
        project_id: projectId,
        name,
        slug
    }).select().single();

    if (error) {
        toast.error("Failed to create category");
        return;
    }

    if (data) {
        setCategories([...categories, { id: data.id, name: data.name }]);
        setSelectedCategories([...selectedCategories, data.id]);
        toast.success(`Category "${name}" created!`);
    }
  };

  // Handle Editor Media Insertion
  const handleEditorMediaSelect = (asset: MediaAsset) => {
    if (editorRef.current) {
      editorRef.current.chain().focus().setImage({ src: asset.file_url, alt: asset.alt_text_default || asset.file_name }).run();
    }
    setIsEditorMediaOpen(false);
  };

  // Save Function
  async function savePost(newStatus?: 'draft' | 'published') {
    if (userLoading) return; // Wait for user
    if (!user) return toast.error('You must be logged in to save.');
    if (!projectId) return toast.error('Error: Project ID missing on post');
    if (!title) return toast.error('Please enter a title');
    setSaving(true);

    const targetStatus = newStatus || status;

    const postData: any = {
      project_id: projectId,
      author_id: user.id,
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

    // 0. ENSURE AUTHOR EXISTS (Server Action)
    const authorRes = await ensureAuthor({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
        avatar_url: user.user_metadata?.avatar_url
    });

    const { error } = await supabase
      .from('posts')
      .update(postData)
      .eq('id', postId);

    if (error) {
      console.error(error);
      toast.error('Error saving post: ' + error.message);
      setSaving(false);
      return;
    }

    // --- HANDLE TAGS (Upsert & Link) ---
    // 1. Get Tag IDs
    const tagIds: string[] = [];
    for (const tagName of tags) {
        const tagSlug = tagName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        let { data: existingTag } = await supabase.from('tags').select('id').eq('slug', tagSlug).single();
        
        if (!existingTag) {
            const { data: newTag } = await supabase.from('tags').insert({
                project_id: projectId,
                name: tagName,
                slug: tagSlug
            }).select('id').single();
            if (newTag) existingTag = newTag;
        }
        if (existingTag) tagIds.push(existingTag.id);
    }

    // 2. Sync Post <-> Tags
    // Simplest strategy: Delete all for this post and re-insert. 
    await supabase.from('post_tags').delete().eq('post_id', postId);
    if (tagIds.length > 0) {
        const ptRows = tagIds.map(tid => ({ post_id: postId, tag_id: tid }));
        await supabase.from('post_tags').insert(ptRows);
    }

    // --- HANDLE CATEGORIES ---
    await supabase.from('post_categories').delete().eq('post_id', postId);
    if (selectedCategories.length > 0) {
        const pcRows = selectedCategories.map(cid => ({ post_id: postId, category_id: cid }));
        await supabase.from('post_categories').insert(pcRows);
    }

    setSaving(false);
    setStatus(targetStatus);
    toast.success(`Post ${targetStatus === 'published' ? 'Published' : 'Saved'} Successfully!`);
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
            categories={categories} selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} onCreateCategory={handleCreateCategory}
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