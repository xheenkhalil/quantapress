'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types/cms';
import Link from 'next/link';
import { 
  Plus, Search, Filter, Trash2, Edit, Eye, MoreHorizontal, 
  ChevronDown, Calendar, ArrowUpDown, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);

  // 1. Fetch Posts
  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) console.error('Error fetching posts:', error);
    else setPosts(data as Post[]);
    setLoading(false);
  }

  // 2. Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedPosts(posts.map(p => p.id));
    else setSelectedPosts([]);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) setSelectedPosts([...selectedPosts, id]);
    else setSelectedPosts(selectedPosts.filter(pid => pid !== id));
  };

  // Trigger Delete Single
  const handleDeleteClick = (id: string) => {
    setPostToDelete(id);
    setIsBulkDelete(false);
    setDeleteDialogOpen(true);
  };

  // Trigger Bulk Delete
  const handleBulkDeleteClick = () => {
    setIsBulkDelete(true);
    setDeleteDialogOpen(true);
  };

  // ACTUAL DELETE LOGIC
  const confirmDelete = async () => {
    if (isBulkDelete) {
      const { error } = await supabase.from('posts').delete().in('id', selectedPosts);
      if (!error) {
        setPosts(posts.filter(p => !selectedPosts.includes(p.id)));
        setSelectedPosts([]);
        toast.success(`Deleted ${selectedPosts.length} posts`);
      } else {
        toast.error("Error deleting posts: " + error.message);
      }
    } else if (postToDelete) {
      const { error } = await supabase.from('posts').delete().eq('id', postToDelete);
      if (!error) {
        setPosts(posts.filter(p => p.id !== postToDelete));
        setSelectedPosts(selectedPosts.filter(pid => pid !== postToDelete));
        toast.success("Post deleted");
      } else {
        toast.error("Error deleting post: " + error.message);
      }
    }
    setDeleteDialogOpen(false);
    setPostToDelete(null);
  };

  // Filter Logic
  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif">Posts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your library ({posts.length} total)</p>
        </div>
        <Button asChild className="bg-maroon-700 hover:bg-maroon-800 text-white shadow-md">
          <Link href="/dashboard/posts/new">
            <Plus className="h-4 w-4 mr-2" /> New Article
          </Link>
        </Button>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-t-xl border border-slate-200 border-b-0 flex flex-col sm:flex-row gap-4 justify-between items-center">
        
        {/* Bulk Actions & Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={selectedPosts.length === 0} className="text-slate-600">
                Bulk Actions <ChevronDown className="h-3 w-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleBulkDeleteClick} className="text-red-600">
                <Trash2 className="h-3 w-3 mr-2" /> Move to Trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="hidden sm:flex text-slate-600">
             <Filter className="h-3 w-3 mr-2" /> Filter
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search posts..." 
            className="pl-9 bg-slate-50 border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-b-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="w-[40px] pl-4">
                <Checkbox 
                  checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                  onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                />
              </TableHead>
              <TableHead className="w-[400px]">Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex justify-center items-center gap-2 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-maroon-700" /> Loading content...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  No posts found. Start writing!
                </TableCell>
              </TableRow>
            ) : (
              filteredPosts.map((post) => (
                <TableRow key={post.id} className="group hover:bg-slate-50/50 transition-colors">
                  <TableCell className="pl-4">
                    <Checkbox 
                      checked={selectedPosts.includes(post.id)}
                      onCheckedChange={(checked: boolean) => handleSelectOne(post.id, checked)}
                    />
                  </TableCell>
                  
                  {/* TITLE COLUMN WITH WORDPRESS STYLE HOVER ACTIONS */}
                  <TableCell className="font-medium">
                    <div className="py-1">
                      <Link href={`/dashboard/posts/${post.id}`} className="text-slate-900 font-bold hover:text-maroon-700 text-base block mb-1 truncate max-w-[300px]">
                        {post.title || '(Untitled Draft)'}
                      </Link>
                      
                      {/* Hover Actions - Visible on group-hover */}
                      <div className="flex items-center gap-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Link href={`/dashboard/posts/${post.id}`} className="text-maroon-700 hover:underline">Edit</Link>
                        <span className="text-slate-300">|</span>
                        <button className="text-maroon-700 hover:underline">Quick Edit</button>
                        <span className="text-slate-300">|</span>
                        <button onClick={() => handleDeleteClick(post.id)} className="text-red-600 hover:underline">Trash</button>
                        <span className="text-slate-300">|</span>
                        <Link href={`/post/${post.slug}`} target="_blank" className="text-slate-500 hover:text-maroon-700 hover:underline">View</Link>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-slate-600">
                     {/* Placeholder for Author Name until we implement Auth Profiles */}
                     <span className="text-sm">Admin</span> 
                  </TableCell>

                  <TableCell>
                    <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className={
                      post.status === 'published' 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 shadow-none font-normal' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-none font-normal'
                    }>
                      {post.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-slate-500 text-sm">
                    <div className="flex flex-col">
                      <span className={post.status === 'published' ? "text-slate-700" : "text-slate-400"}>
                        {post.status === 'published' ? 'Published' : 'Last Modified'}
                      </span>
                      <span>{post.updated_at ? format(new Date(post.updated_at), 'MMM d, yyyy') : '-'}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-maroon-700">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           <Link href={`/dashboard/posts/${post.id}`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(post.id)}>
                          Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteClick(post.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* FOOTER PAGINATION PLACEHOLDER */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-xs text-slate-500">
          Showing {filteredPosts.length} items
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      </div>

      {/* DELETE DIALOG */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {isBulkDelete 
                ? `You are about to delete ${selectedPosts.length} posts. This action cannot be undone.`
                : "This action cannot be undone. This will permanently delete the post from our servers."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}