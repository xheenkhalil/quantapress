import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-maroon-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-maroon-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-2xl px-6">
        {/* Logo Mark */}
        <div className="mx-auto mb-8 h-20 w-20 bg-gradient-to-br from-maroon-700 to-maroon-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-maroon-900/50 border border-white/10">
          <span className="text-4xl font-serif font-bold text-white">Q</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white font-serif mb-6 tracking-tight">
          Quanta<span className="text-maroon-500">Press</span>
        </h1>
        
        <p className="text-lg text-slate-400 mb-10 leading-relaxed">
          The headless content engine for the modern mystic. <br className="hidden md:block"/>
          Secure, fast, and designed for premium publishing.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-200 font-semibold px-8 h-12 text-base">
              Enter Console <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          
          <Link href="https://herozodiac.com" target="_blank">
            <Button variant="outline" size="lg" className="border-slate-700 text-slate-900 hover:bg-slate-800 hover:text-white h-12">
              Visit Live Site
            </Button>
          </Link>
        </div>

        {/* Footer Status */}
        <div className="mt-16 flex items-center justify-center gap-2 text-xs text-slate-600 font-mono">
          <ShieldCheck className="h-3 w-3 text-green-500" />
          <span>System Operational v1.0.0</span>
        </div>
      </div>
    </div>
  );
}