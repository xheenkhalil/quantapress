// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';

// These environment variables will be in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This client is for CLIENT-SIDE requests (public read access)
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
