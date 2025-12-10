import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch author profile
  const { data: author } = await supabase
    .from('authors')
    .select('name, avatar_url')
    .eq('email', user.email)
    .single();

  const formattedUser = {
    name: author?.name || user.user_metadata?.full_name || 'Admin',
    email: user.email,
    avatarUrl: author?.avatar_url || user.user_metadata?.avatar_url,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar />
      {/* Main Content Area - Shifted right on Desktop */}
      <div className="md:pl-64 min-h-screen transition-all flex flex-col">
        <DashboardHeader user={formattedUser} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}