'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadMedia } from '@/lib/upload';
import { MediaAsset } from '@/types/cms';
import { Loader2, UploadCloud, Check, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MediaDetailSidebar } from './MediaDetailSidebar'; // <--- Import the sidebar

// Dummy IDs (Replace with Auth later if needed)
const DEMO_PROJECT_ID = '00000000-0000-0000-0000-000000000000';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

interface MediaLibraryProps {
  onSelect?: (asset: MediaAsset) => void; // If provided, we are in "Picker Mode"
}

export default function MediaLibrary({ onSelect }: MediaLibraryProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Track full object for the sidebar
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  // Fetch Assets
  useEffect(() => {
    async function fetchAssets() {
      const { data } = await supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setAssets(data as MediaAsset[]);
      setLoading(false);
    }
    fetchAssets();
  }, []);

  // Handle Upload
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    
    // Upload logic
    const newAsset = await uploadMedia(file, DEMO_PROJECT_ID, DEMO_USER_ID);
    if (newAsset) {
      setAssets([newAsset, ...assets]);
      // Auto-select the new upload so they can edit details immediately
      setSelectedAsset(newAsset);
    }
    setUploading(false);
  }

  // Handle updates from the Sidebar (e.g. SEO text changes)
  const handleAssetUpdate = (updated: MediaAsset) => {
    setAssets(assets.map(a => a.id === updated.id ? updated : a));
    setSelectedAsset(updated);
  };

  // The final "Insert" action
  const handleInsert = () => {
    if (selectedAsset && onSelect) {
        onSelect(selectedAsset);
    }
  };

  return (
    <div className="flex h-[600px] border rounded-lg overflow-hidden bg-white shadow-sm">
      
      {/* --- LEFT COLUMN: ASSET GRID --- */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
          
          {/* HEADER TOOLBAR */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Library</h3>
            
            <div className="relative">
              <input 
                type="file" 
                id="modal-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <label htmlFor="modal-upload">
                <Button size="sm" variant="outline" className="cursor-pointer border-dashed border-slate-300 text-slate-600 hover:text-maroon-700 hover:border-maroon-300" asChild>
                  <span>
                    {uploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <UploadCloud className="mr-2 h-3 w-3" />}
                    {uploading ? 'Uploading...' : 'Upload New'}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* SCROLLABLE GRID */}
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-maroon-700" /></div>
            ) : assets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="h-12 w-12 mb-4 text-slate-300" />
                    <p>Library is empty.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {assets.map((asset) => (
                    <div 
                        key={asset.id} 
                        onClick={() => setSelectedAsset(asset)}
                        className={cn(
                            "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group bg-white shadow-sm",
                            selectedAsset?.id === asset.id 
                            ? "border-maroon-500 ring-2 ring-maroon-500/20" 
                            : "border-slate-100 hover:border-maroon-300"
                        )}
                    >
                    <img 
                        src={asset.file_url} 
                        alt={asset.alt_text || asset.file_name}
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Selected Checkmark Overlay */}
                    {selectedAsset?.id === asset.id && (
                        <div className="absolute inset-0 bg-maroon-900/20 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="bg-maroon-600 text-white rounded-full p-1.5 shadow-lg">
                                <Check className="h-5 w-5" />
                            </div>
                        </div>
                    )}
                    </div>
                ))}
                </div>
            )}
          </div>
      </div>

      {/* --- RIGHT COLUMN: SIDEBAR DETAILS --- */}
      <div className="w-80 bg-white flex flex-col h-full shrink-0">
         {selectedAsset ? (
             <div className="flex flex-col h-full">
                {/* The SEO Editor Component */}
                <MediaDetailSidebar 
                   asset={selectedAsset} 
                   onUpdate={handleAssetUpdate} 
                   onClose={() => setSelectedAsset(null)} 
                />
                
                {/* Final Insert Action */}
                {onSelect && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50 mt-auto">
                        <Button 
                            onClick={handleInsert} 
                            className="w-full bg-maroon-700 hover:bg-maroon-800 text-white font-bold py-6 shadow-md"
                        >
                            Insert Selected Image
                        </Button>
                    </div>
                )}
             </div>
         ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/30">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <ImageIcon className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">No image selected</p>
                <p className="text-xs mt-2 text-slate-400">Click an image to view details, edit Alt Text, or insert it into your post.</p>
             </div>
         )}
      </div>

    </div>
  );
}