// src/types/cms.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// 1. PROJECT (The Tenant)
export interface Project {
  id: string;
  name: string;
  api_key: string;
  allowed_domains: string[];
  created_at: string;
}

// 2. AUTHOR (The Admin)
export interface Author {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'editor' | 'viewer';
}

// 3. MEDIA ASSET (The File)
export interface MediaAsset {
  id: string;
  project_id: string;
  uploader_id: string;
  file_url: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  width?: number; // Optional because PDFs don't have width
  height?: number;
  alt_text_default?: string;
  created_at: string;
  alt_text?: string;
  title?: string;
  caption?: string;
  description?: string;
}

// 4. POST (The Content)
export interface Post {
  id: string;
  project_id: string;
  author_id: string;
  
  // Content Core
  title: string;
  slug: string;
  content: Json; // Tiptap JSON structure
  excerpt: string | null;
  featured_image_id: string | null;
  
  // Relations (Expanded)
  featured_image?: MediaAsset; // For when we join tables
  tags?: Tag[];
  categories?: Category[];

  // SEO Module
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  is_indexable: boolean;
  schema_type: 'Article' | 'BlogPosting' | 'NewsArticle';
  
  // Status
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  updated_at: string;
}

// 5. TAG (The Taxonomy)
export interface Tag {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  color: string | null;
}

// 6. CATEGORY
export interface Category {
  id: string;
  name: string;
  slug: string;
}

// 5. TAG (The Taxonomy)
export interface Tag {
  id: string;
  project_id: string;
  name: string;
  slug: string;
  color: string | null;
}