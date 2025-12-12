'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, FileText, FileCheck, Clock, CheckCircle, ArrowRight } from 'lucide-react';

export default function DashboardHome() {
  const [stats, setStats] = useState({ total: 0, drafts: 0, published: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      // 1. Total
      const { count: totalCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
      
      // 2. Drafts
      const { count: draftCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft');

      // 3. Published
      const { count: pubCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published');

      setStats({ 
        total: totalCount || 0, 
        drafts: draftCount || 0,
        published: pubCount || 0
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-6 font-serif">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {/* TOTAL POSTS */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-maroon-200 transition-all group">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-maroon-50 transition-colors">
                <FileText className="h-6 w-6 text-slate-500 group-hover:text-maroon-600" />
             </div>
             <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">All Time</span>
          </div>
          <h3 className="text-slate-500 font-medium text-sm">Total Posts</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">
            {loading ? <Loader2 className="h-8 w-8 animate-spin text-slate-300" /> : stats.total}
          </p>
        </div>
        
        {/* PUBLISHED */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-green-200 transition-all group">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-green-50 transition-colors">
                <CheckCircle className="h-6 w-6 text-slate-500 group-hover:text-green-600" />
             </div>
          </div>
          <h3 className="text-slate-500 font-medium text-sm">Published</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">
            {loading ? <Loader2 className="h-8 w-8 animate-spin text-slate-300" /> : stats.published}
          </p>
        </div>

        {/* DRAFTS */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group">
          <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-orange-50 transition-colors">
                <Clock className="h-6 w-6 text-slate-500 group-hover:text-orange-600" />
             </div>
          </div>
          <h3 className="text-slate-500 font-medium text-sm">Drafts</h3>
          <p className="text-4xl font-bold text-slate-900 mt-1">
            {loading ? <Loader2 className="h-8 w-8 animate-spin text-slate-300" /> : stats.drafts}
          </p>
        </div>

        {/* Quick Actions (CTA) */}
        <div className="bg-maroon-900 p-6 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-white flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">Start Writing</h3>
            <p className="text-maroon-200 text-sm">Create something new today.</p>
          </div>
          <a href="/dashboard/posts/new" className="mt-4 inline-flex items-center justify-center gap-2 bg-white text-maroon-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 transition shadow-lg shadow-black/10">
            Create New Post <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}