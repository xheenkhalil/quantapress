'use server';

import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// 1. Initialize Admin Client (Bypasses RLS)
// We use this specifically to creation/update the Author profile guaranteed.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ CRTICAL ERROR: Missing Supabase Environment Variables in actions.ts");
}

const supabaseAdmin = createAdminClient(
  supabaseUrl!,
  serviceRoleKey!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function ensureAuthor(user: { id: string; email: string; name: string; avatar_url?: string }) {
  console.log(`🔄 Ensuring Author Profile for: ${user.email} (${user.id})`);

  if (!serviceRoleKey) {
    return { success: false, error: "Server Configuration Error: Missing Service Role Key" };
  }

  try {
    // 2. Upsert the Author
    // We use the Admin client to ensure RLS doesn't block the insert
    const { data, error } = await supabaseAdmin
      .from('authors')
      .upsert({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        // Optional: Update timestamp if you have an 'updated_at' column
        // updated_at: new Date().toISOString() 
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error(" ensureAuthor Database Error:", error.message, error.details);
      return { success: false, error: error.message };
    }

    console.log("✅ Author Profile Verified/Created");
    return { success: true };

  } catch (err: any) {
    console.error(" ensureAuthor Exception:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}