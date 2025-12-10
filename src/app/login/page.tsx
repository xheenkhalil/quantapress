'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Authenticate with Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Check if user is actually an Admin in our 'authors' table
    if (data.user) {
      const { data: authorData, error: authorError } = await supabase
        .from('authors')
        .select('role')
        .eq('email', email)
        .single();

      if (authorError || !authorData || authorData.role !== 'admin') {
        setError("Access Denied: You do not have admin privileges.");
        await supabase.auth.signOut(); // Kick them out immediately
        setLoading(false);
        return;
      }

      // 3. Success -> Redirect to Dashboard
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-maroon-900 p-8 text-center">
          <div className="h-12 w-12 bg-white rounded-lg mx-auto flex items-center justify-center text-maroon-900 font-serif font-bold text-2xl mb-4">Q</div>
          <h1 className="text-2xl font-bold text-white font-serif">Quanta Press</h1>
          <p className="text-maroon-200 text-sm mt-2">Secure Admin Access</p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50 text-red-900 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@herozodiac.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <Button type="submit" className="w-full bg-maroon-700 hover:bg-maroon-800 text-white" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Protected by Quanta Security Protocol v1.0
          </div>
        </div>
      </div>
    </div>
  );
}