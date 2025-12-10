'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadMedia } from '@/lib/upload';
import { MediaAsset } from '@/types/cms';
import { Loader2, UploadCloud, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Make sure you have clsx/tailwind-merge setup, or just use string concat

// Dummy IDs (Replace with Auth later)
const DEMO_PROJECT_ID = '00000000-0000-0000-0000-000000000000'; 
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

interface MediaLibraryProps {
  onSelect?: (asset: MediaAsset) => void; // If provided, we are in "Picker Mode"
}

export default function MediaLibrary({ onSelect }: MediaLibraryProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
    
    const newAsset = await uploadMedia(file, DEMO_PROJECT_ID, DEMO_USER_ID);
    if (newAsset) {
      setAssets([newAsset, ...assets]);
      // If in picker mode, auto-select the new upload
      if (onSelect) {
        onSelect(newAsset);
        setSelectedId(newAsset.id);
      }
    }
    setUploading(false);
  }

  const handleAssetClick = (asset: MediaAsset) => {
    if (onSelect) {
      setSelectedId(asset.id);
      onSelect(asset);
    }
  };

  return (
    <div className="w-full">
      {/* HEADER ACTIONS */}
      <div className="flex justify-between items-center mb-6">
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

      {/* ASSET GRID */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-maroon-700" /></div>
      ) : assets.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-lg">
          <ImageIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
          <p className="text-xs text-slate-400">Library is empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2">
          {assets.map((asset) => (
            <div 
              key={asset.id} 
              onClick={() => handleAssetClick(asset)}
              className={cn(
                "relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition group",
                selectedId === asset.id 
                  ? "border-maroon-500 ring-2 ring-maroon-500/20" 
                  : "border-transparent hover:border-slate-300"
              )}
            >
              <img 
                src={asset.file_url} 
                alt={asset.file_name}
                className="w-full h-full object-cover"
              />
              
              {/* Selection Indicator */}
              {selectedId === asset.id && (
                <div className="absolute inset-0 bg-maroon-900/20 flex items-center justify-center">
                  <CheckCircle2 className="text-white h-8 w-8 drop-shadow-md" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}