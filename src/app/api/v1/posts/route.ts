import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Server Client (Service Role) to bypass RLS for reading
// We need this because the "public" request won't have a user session.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = searchParams.get('key');
  const slug = searchParams.get('slug');
  const tag = searchParams.get('tag');

  // 1. SECURITY: Validate API Key
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
  }

  // Check if key exists in 'projects' table
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('id, name')
    .eq('api_key', apiKey)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
  }

  // 2. QUERY BUILDER
  let query = supabaseAdmin
    .from('posts')
    .select(`
      id,
      title,
      slug,
      excerpt,
      content,
      published_at,
      seo_title,
      seo_description,
      featured_image:media_assets(file_url, alt_text_default)
    `)
    .eq('project_id', project.id)
    .eq('status', 'published'); // Only return published posts

  // Filter by Slug (Single Post)
  if (slug) {
    query = query.eq('slug', slug);
    const { data, error } = await query.single();
    if (error) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    return NextResponse.json({ data });
  }

  // Filter by Tag (Future implementation)
  // if (tag) { ... }

  // 3. EXECUTE (List All)
  const { data, error } = await query.order('published_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    meta: { count: data.length, project: project.name },
    data 
  });
}