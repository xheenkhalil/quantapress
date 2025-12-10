'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types/cms';
import Link from 'next/link';
import { 
  Plus, Search, Trash2, Edit, MoreHorizontal, 
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState("all");

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

    if (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load posts');
    }
    else setPosts(data as Post[]);
    setLoading(false);
  }

  // 2. Actions
  const handleSelectAll = (checked: boolean, currentList: Post[]) => {
    if (checked) setSelectedPosts(currentList.map(p => p.id));
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
  const filteredBySearch = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFilteredPosts = () => {
    if (activeTab === 'all') return filteredBySearch;
    return filteredBySearch.filter(post => post.status === activeTab);
  };

  const displayPosts = getFilteredPosts();

  const renderTableContent = () => {
     if (loading) {
         return Array(5).fill(0).map((_, i) => (
            <TableRow key={i}>
                <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-6 w-[250px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[80px] rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
            </TableRow>
         ));
     }

     if (displayPosts.length === 0) {
        return (
            <TableRow>
                <TableCell colSpan={6} className="h-[300px] text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                        <div className="bg-slate-50 p-4 rounded-full mb-4">
                            <Edit className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-lg font-medium text-slate-900">No posts found</p>
                        <p className="text-sm">
                            {searchQuery ? "Try adjusting your search terms." : "Get started by creating your first article."}
                        </p>
                        {!searchQuery && (
                             <Button asChild className="mt-4 bg-maroon-700 hover:bg-maroon-800 text-white">
                                <Link href="/dashboard/posts/new">Create Post</Link>
                             </Button>
                        )}
                    </div>
                </TableCell>
            </TableRow>
        );
     }

     return displayPosts.map((post) => (
        <TableRow key={post.id} className="group hover:bg-slate-50/60 transition-colors h-[72px]">
          <TableCell className="pl-6">
            <Checkbox 
              checked={selectedPosts.includes(post.id)}
              onCheckedChange={(checked: boolean) => handleSelectOne(post.id, checked)}
            />
          </TableCell>
          
          {/* TITLE COLUMN WITH WORDPRESS STYLE HOVER ACTIONS */}
          <TableCell className="font-medium min-w-[350px]">
            <div className="py-1">
              <Link href={`/dashboard/posts/${post.id}`} className="text-slate-900 font-bold hover:text-maroon-700 text-[15px] block mb-1.5 truncate max-w-[400px]">
                {post.title || '(Untitled Draft)'}
              </Link>
              
              {/* Hover Actions - Visible on group-hover */}
              <div className="flex items-center gap-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium translate-y-1 group-hover:translate-y-0 text-slate-500">
                <Link href={`/dashboard/posts/${post.id}`} className="text-maroon-700 hover:underline">Edit</Link>
                <span className="text-slate-200">|</span>
                <span className="cursor-not-allowed hover:text-slate-700">Quick Edit</span>
                <span className="text-slate-200">|</span>
                <button onClick={() => handleDeleteClick(post.id)} className="text-red-600 hover:underline">Trash</button>
                <span className="text-slate-200">|</span>
                <Link href={`/post/${post.slug}`} target="_blank" className="hover:text-maroon-700 hover:underline">View</Link>
              </div>
            </div>
          </TableCell>

          <TableCell className="text-slate-600">
             {/* Placeholder for Author Name until we implement Auth Profiles */}
             <div className="flex items-center gap-2">
                 <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">A</div>
                 <span className="text-sm font-medium">Admin</span> 
             </div>
          </TableCell>

          <TableCell>
            <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className={
              post.status === 'published' 
                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-medium px-2.5 py-0.5 rounded-full' 
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 font-medium px-2.5 py-0.5 rounded-full'
            }>
               {post.status === 'published' ? (
                   <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Published</span>
               ) : (
                    <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Draft</span>
               )}
            </Badge>
          </TableCell>

          <TableCell className="text-slate-500 text-sm">
            <div className="flex flex-col">
              <span className={post.status === 'published' ? "text-slate-900 font-medium" : "text-slate-400"}>
                {post.status === 'published' ? 'Published' : 'Last Modified'}
              </span>
              <span className="text-xs text-slate-400 mt-0.5">{post.updated_at ? format(new Date(post.updated_at), 'MMM d, yyyy') : '-'}</span>
            </div>
          </TableCell>

          <TableCell className="text-right pr-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-maroon-700 hover:bg-slate-100">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                   <Link href={`/dashboard/posts/${post.id}`}><Edit className="mr-2 h-4 w-4 text-slate-500" /> Edit</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(post.id)}>
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDeleteClick(post.id)} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ));
  };


  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-serif tracking-tight">Posts</h1>
          <p className="text-slate-500 mt-2 text-base">Create, edit, and manage your publication's content.</p>
        </div>
        <Button asChild className="bg-maroon-700 hover:bg-maroon-800 text-white shadow-lg shadow-maroon-900/20 transition-transform active:scale-95">
          <Link href="/dashboard/posts/new">
            <Plus className="h-4 w-4 mr-2" /> New Article
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        
        {/* TOOLBAR WRAPPER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            {/* TABS LIST */}
            <TabsList className="bg-slate-100/50 p-1 border border-slate-200 rounded-lg h-auto">
                <TabsTrigger value="all" className="px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-maroon-700 data-[state=active]:shadow-sm transition-all">All ({filteredBySearch.length})</TabsTrigger>
                <TabsTrigger value="published" className="px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm transition-all">Published ({filteredBySearch.filter(p => p.status === 'published').length})</TabsTrigger>
                <TabsTrigger value="draft" className="px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:text-slate-700 data-[state=active]:shadow-sm transition-all">Drafts ({filteredBySearch.filter(p => p.status === 'draft').length})</TabsTrigger>
            </TabsList>

            {/* SEARCH & FILTER */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-[320px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search articles..." 
                        className="pl-9 bg-white border-slate-200 focus:border-maroon-500 focus:ring-maroon-500 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={selectedPosts.length === 0} className="h-10 px-4 border-slate-200 text-slate-600 hover:text-slate-900">
                        Bulk Actions <ChevronDown className="h-3 w-3 ml-2 opacity-50" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleBulkDeleteClick} className="text-red-600">
                        <Trash2 className="h-3 w-3 mr-2" /> Move to Trash
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-950/5">
            <TabsContent value="all" className="m-0">
                <Table>
                    <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[50px] pl-6 h-12">
                                <Checkbox 
                                checked={selectedPosts.length === displayPosts.length && displayPosts.length > 0}
                                onCheckedChange={(checked: boolean) => handleSelectAll(checked, displayPosts)}
                                disabled={loading || displayPosts.length === 0}
                                />
                            </TableHead>
                            <TableHead className="w-[40%] font-semibold text-slate-700">Title</TableHead>
                            <TableHead className="font-semibold text-slate-700">Author</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="font-semibold text-slate-700">Date</TableHead>
                            <TableHead className="text-right pr-6 font-semibold text-slate-700">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderTableContent()}
                    </TableBody>
                </Table>
            </TabsContent>
            
            <TabsContent value="published" className="m-0">
                 {/* Reusing same table logic, filtered by getFilteredPosts */}
                 <Table>
                    <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[50px] pl-6 h-12">
                                <Checkbox 
                                checked={selectedPosts.length === displayPosts.length && displayPosts.length > 0}
                                onCheckedChange={(checked: boolean) => handleSelectAll(checked, displayPosts)}
                                disabled={loading || displayPosts.length === 0}
                                />
                            </TableHead>
                            <TableHead className="w-[40%] font-semibold text-slate-700">Title</TableHead>
                            <TableHead className="font-semibold text-slate-700">Author</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="font-semibold text-slate-700">Date</TableHead>
                            <TableHead className="text-right pr-6 font-semibold text-slate-700">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderTableContent()}
                    </TableBody>
                </Table>
            </TabsContent>

            <TabsContent value="draft" className="m-0">
                 <Table>
                    <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[50px] pl-6 h-12">
                                <Checkbox 
                                checked={selectedPosts.length === displayPosts.length && displayPosts.length > 0}
                                onCheckedChange={(checked: boolean) => handleSelectAll(checked, displayPosts)}
                                disabled={loading || displayPosts.length === 0}
                                />
                            </TableHead>
                            <TableHead className="w-[40%] font-semibold text-slate-700">Title</TableHead>
                            <TableHead className="font-semibold text-slate-700">Author</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="font-semibold text-slate-700">Date</TableHead>
                            <TableHead className="text-right pr-6 font-semibold text-slate-700">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderTableContent()}
                    </TableBody>
                </Table>
            </TabsContent>
        </div>

      </Tabs>

      {/* FOOTER */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-slate-500 font-medium">
          Showing {displayPosts.length} post{displayPosts.length !== 1 && 's'}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="h-9 px-4 lg:px-6">Previous</Button>
          <Button variant="outline" size="sm" disabled className="h-9 px-4 lg:px-6">Next</Button>
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
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 border-0">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}