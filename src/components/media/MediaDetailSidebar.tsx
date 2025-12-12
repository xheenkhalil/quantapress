'use client';

import { useState, useEffect } from 'react';
import { MediaAsset } from '@/types/cms';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Save, Loader2, Info } from 'lucide-react';

interface MediaDetailSidebarProps {
  asset: MediaAsset;
  onUpdate: (updatedAsset: MediaAsset) => void;
  onClose: () => void;
}

export function MediaDetailSidebar({ asset, onUpdate, onClose }: MediaDetailSidebarProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    alt_text: asset.alt_text || '',
    title: asset.title || asset.file_name,
    caption: asset.caption || '',
    description: asset.description || ''
  });

  // Reset form when a different image is selected
  useEffect(() => {
    setFormData({
      alt_text: asset.alt_text || '',
      title: asset.title || asset.file_name,
      caption: asset.caption || '',
      description: asset.description || ''
    });
  }, [asset]);

  const handleSave = async () => {
    setSaving(true);
    
    const { data, error } = await supabase
      .from('media_assets')
      .update(formData)
      .eq('id', asset.id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to save image details');
      console.error(error);
      setSaving(false);
      return;
    }

    toast.success('Image SEO details saved!');
    onUpdate(data as MediaAsset); // Update parent state
    setSaving(false);
  };

  return (
    <div className="w-80 border-l border-slate-200 bg-slate-50 p-6 flex flex-col h-full overflow-y-auto">
      <h3 className="font-bold text-slate-800 mb-4">Attachment Details</h3>
      
      {/* Preview */}
      <div className="mb-6 rounded-lg border border-slate-200 overflow-hidden bg-white">
        <img src={asset.file_url} alt="Preview" className="w-full h-auto object-contain max-h-48" />
        <div className="p-2 text-[10px] text-slate-500 bg-slate-100 border-t border-slate-200">
          {asset.mime_type} • {(asset.size_bytes / 1024).toFixed(0)} KB
        </div>
      </div>

      {/* SEO Form */}
      <div className="space-y-4 flex-1">
        
        {/* Alt Text (Crucial for SEO) */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex items-center gap-1">
            Alt Text <Info className="w-3 h-3 text-slate-400" />
          </label>
          <input 
            type="text" 
            className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-maroon-500 outline-none"
            placeholder="Describe the image..."
            value={formData.alt_text}
            onChange={e => setFormData({...formData, alt_text: e.target.value})}
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Required for accessibility and SEO. Describe what's in the image.
          </p>
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Title</label>
          <input 
            type="text" 
            className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-maroon-500 outline-none"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
        </div>

        {/* Caption */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Caption</label>
          <textarea 
            className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-maroon-500 outline-none min-h-[60px]"
            placeholder="Displayed below the image..."
            value={formData.caption}
            onChange={e => setFormData({...formData, caption: e.target.value})}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
          <textarea 
            className="w-full text-sm border border-slate-300 rounded p-2 focus:ring-2 focus:ring-maroon-500 outline-none min-h-[80px]"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 disabled:opacity-70 transition text-sm font-bold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Metadata
        </button>
      </div>

    </div>
  );
}