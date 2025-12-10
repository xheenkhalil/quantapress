'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function DashboardHome() {
  const [stats, setStats] = useState({ total: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      // Fetch Total Posts
      const { count: totalCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Fetch Drafts
      const { count: draftCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      setStats({ 
        total: totalCount || 0, 
        drafts: draftCount || 0 
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-6 font-serif">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Simple Stats Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-2">Total Posts</h3>
          <p className="text-4xl font-bold text-maroon-700">
            {loading ? <Loader2 className="h-8 w-8 animate-spin text-slate-300" /> : stats.total}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-2">Drafts</h3>
          <p className="text-4xl font-bold text-slate-700">
            {loading ? <Loader2 className="h-8 w-8 animate-spin text-slate-300" /> : stats.drafts}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="bg-maroon-900 p-6 rounded-xl shadow-lg text-white">
          <h3 className="font-bold text-lg mb-2">Start Writing</h3>
          <p className="text-maroon-200 text-sm mb-4">You have ideas waiting to be discovered.</p>
          <a href="/dashboard/posts/new" className="inline-block bg-white text-maroon-900 px-4 py-2 rounded-md text-sm font-bold hover:bg-slate-100 transition">
            Create New Post
          </a>
        </div>
      </div>
    </div>
  );
}