'use client';

import { Globe, Smartphone, Monitor } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface SeoPreviewProps {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  seoDesc: string;
}

export function SeoPreview({ title, slug, excerpt, seoTitle, seoDesc }: SeoPreviewProps) {
  const [device, setDevice] = useState<'mobile' | 'desktop'>('desktop');

  // Logic: Use SEO fields if they exist, otherwise fallback to main content
  const displayTitle = seoTitle || title || "Your Article Title Here";
  const displayDesc = seoDesc || excerpt || "Please provide a meta description or excerpt to see how this snippet will look in search results...";
  const displaySlug = slug || "your-post-url";
  
  // Truncation logic (Google cuts off around these limits)
  const truncate = (str: string, limit: number) => 
    str.length > limit ? str.substring(0, limit) + '...' : str;

  return (
    <div className="mt-12 border-t border-slate-200 pt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Globe className="h-4 w-4 text-maroon-700" />
            Search Engine Preview
          </h3>
          <p className="text-sm text-slate-500">How your post will appear on Google.</p>
        </div>

        {/* Device Toggle */}
        <Tabs defaultValue="desktop" onValueChange={(v) => setDevice(v as any)} className="w-[200px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="desktop"><Monitor className="h-4 w-4 mr-2" /> Desktop</TabsTrigger>
            <TabsTrigger value="mobile"><Smartphone className="h-4 w-4 mr-2" /> Mobile</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* THE GOOGLE CARD */}
      <Card className="p-6 bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className={`max-w-[600px] font-sans ${device === 'mobile' ? 'w-[380px] mx-auto' : ''}`}>
          
          {/* 1. Header (Favicon + Name + URL) */}
          <div className="flex items-center gap-3 mb-2 group cursor-pointer">
            <div className="bg-slate-100 rounded-full p-2 h-8 w-8 flex items-center justify-center border border-slate-200">
               {/* Placeholder Logo */}
               <div className="h-4 w-4 bg-maroon-700 rounded-sm" />
            </div>
            <div className="flex flex-col text-xs leading-snug">
              <span className="text-slate-900 font-medium mb-0.5">HeroZodiac</span>
              <span className="text-slate-500">herozodiac.com › blog › {displaySlug}</span>
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition text-slate-400">
                <div className="h-1 w-1 bg-current rounded-full mb-0.5" />
                <div className="h-1 w-1 bg-current rounded-full mb-0.5" />
                <div className="h-1 w-1 bg-current rounded-full" />
            </div>
          </div>

          {/* 2. The Blue Title */}
          <h3 className="text-[#1a0dab] text-xl font-medium hover:underline cursor-pointer mb-1 leading-tight truncate">
            {device === 'mobile' ? truncate(displayTitle, 60) : truncate(displayTitle, 70)}
          </h3>

          {/* 3. The Description */}
          <div className="text-[#4d5156] text-sm leading-6">
             <span className="text-slate-500 text-xs mr-2">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} —</span>
             {device === 'mobile' ? truncate(displayDesc, 120) : truncate(displayDesc, 160)}
          </div>

        </div>
      </Card>

      {/* Helper Bar */}
      <div className="mt-4 flex gap-6 text-xs text-slate-500 font-mono">
        <span className={displayTitle.length > 60 ? "text-orange-600" : "text-green-600"}>
          Title: {displayTitle.length}/60 chars
        </span>
        <span className={displayDesc.length > 160 ? "text-orange-600" : "text-green-600"}>
          Desc: {displayDesc.length}/160 chars
        </span>
      </div>
    </div>
  );
}