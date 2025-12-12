'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function DebugDbPage() {
  const { user, loading } = useUser();
  const [status, setStatus] = useState<string>('Checking...');
  const [tables, setTables] = useState<any>({});
  const [missingTable, setMissingTable] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    checkTables();
  }, [user]);

  async function checkTables() {
    setStatus('Probing Database...');
    const results: any = {};

    // 1. Check 'users' table
    const { data: usersData, error: usersError } = await supabase.from('users').select('*').eq('id', user!.id).maybeSingle();
    results.users = { exists: !usersError, record: usersData, error: usersError?.message };

    // 2. Check 'profiles' table
    const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
    results.profiles = { exists: !profilesError, record: profilesData, error: profilesError?.message };
    
    // 3. Check 'authors' table
    const { data: authorsData, error: authorsError } = await supabase.from('authors').select('*').eq('id', user!.id).maybeSingle();
    results.authors = { exists: !authorsError, record: authorsData, error: authorsError?.message };

    setTables(results);

    // Heuristic Result
    if (results.users.record) setStatus('Found record in "users" table.');
    else if (results.profiles.record) setStatus('Found record in "profiles" table.');
    else if (results.authors.record) setStatus('Found record in "authors" table.');
    else setStatus('MISSING AUTHOR RECORD. Please create one below.');
  }

  async function createRecord(tableName: string) {
    if (!user) return;
    
    const payload = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Admin User',
        role: 'admin' // Assumption based on types/cms.ts
    };

    const { error } = await supabase.from(tableName).insert(payload);
    
    if (error) {
        toast.error(`Failed to create record in ${tableName}: ${error.message}`);
        console.error(error);
    } else {
        toast.success(`Created record in ${tableName}!`);
        checkTables();
    }
  }

  if (loading) return <div className="p-10">Loading User...</div>;
  if (!user) return <div className="p-10">Please Login first.</div>;

  return (
    <div className="p-10 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Database Debugger</h1>
      <div className="p-4 bg-slate-100 rounded">
        <strong>Status:</strong> {status} <br/>
        <strong>User ID:</strong> {user.id}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* USERS TABLE */}
        <div className="border p-4 rounded">
           <h3 className="font-bold mb-2">Table: users</h3>
           <pre className="text-xs bg-black text-white p-2 rounded overflow-auto">
             {JSON.stringify(tables.users, null, 2)}
           </pre>
           {!tables.users?.record && !tables.users?.error && (
             <Button size="sm" onClick={() => createRecord('users')} className="mt-2 w-full">Create in 'users'</Button>
           )}
        </div>

        {/* PROFILES TABLE */}
        <div className="border p-4 rounded">
           <h3 className="font-bold mb-2">Table: profiles</h3>
           <pre className="text-xs bg-black text-white p-2 rounded overflow-auto">
             {JSON.stringify(tables.profiles, null, 2)}
           </pre>
           {!tables.profiles?.record && !tables.profiles?.error && (
             <Button size="sm" onClick={() => createRecord('profiles')} className="mt-2 w-full">Create in 'profiles'</Button>
           )}
        </div>

        {/* AUTHORS TABLE */}
        <div className="border p-4 rounded">
           <h3 className="font-bold mb-2">Table: authors</h3>
           <pre className="text-xs bg-black text-white p-2 rounded overflow-auto">
             {JSON.stringify(tables.authors, null, 2)}
           </pre>
           {!tables.authors?.record && !tables.authors?.error && (
             <Button size="sm" onClick={() => createRecord('authors')} className="mt-2 w-full">Create in 'authors'</Button>
           )}
        </div>
      </div>
    </div>
  );
}
