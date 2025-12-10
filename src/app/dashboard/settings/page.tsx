'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // Import Supabase client
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Save, Globe, Palette, Lock, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

// We use the same demo ID as elsewhere until multi-tenant is built
const DEMO_PROJECT_ID = '00000000-0000-0000-0000-000000000000';

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#922B21');
  
  // State for fetching real data
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch the REAL API Key from Supabase on load
  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('api_key')
          .eq('id', DEMO_PROJECT_ID)
          .single();

        if (error) {
          console.error("Error fetching settings:", error);
          toast.error("Failed to load settings");
        } else if (data) {
          setApiKey(data.api_key);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success("API Key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 font-serif tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-2 text-lg">Manage your site configuration and preferences.</p>
        </div>
        <Button size="lg" className="bg-maroon-700 hover:bg-maroon-800 text-white shadow-lg shadow-maroon-900/20 transition-all hover:-translate-y-0.5">
          <Save className="h-5 w-5 mr-2" /> Save Changes
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        {/* Enlarge Tabs */}
        <TabsList className="w-full justify-start h-14 p-1.5 bg-slate-100 rounded-xl mb-8 border border-slate-200">
          <TabsTrigger 
            value="general" 
            className="h-full px-6 text-base font-medium data-[state=active]:bg-white data-[state=active]:text-maroon-700 data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Globe className="h-5 w-5 mr-2.5" /> General
          </TabsTrigger>
          <TabsTrigger 
            value="branding" 
            className="h-full px-6 text-base font-medium data-[state=active]:bg-white data-[state=active]:text-maroon-700 data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Palette className="h-5 w-5 mr-2.5" /> Branding
          </TabsTrigger>
          <TabsTrigger 
            value="api" 
            className="h-full px-6 text-base font-medium data-[state=active]:bg-white data-[state=active]:text-maroon-700 data-[state=active]:shadow-sm rounded-lg transition-all"
          >
            <Lock className="h-5 w-5 mr-2.5" /> API Keys
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content Area */}
            <div className="lg:col-span-3">
                {/* 1. GENERAL TAB */}
                <TabsContent value="general" className="mt-0 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                    <CardTitle className="text-xl">Site Identity</CardTitle>
                    <CardDescription>Basic information about your publication.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                        <Label htmlFor="site-title" className="text-slate-600">Site Title</Label>
                        <Input id="site-title" defaultValue="HeroZodiac" className="h-10 border-slate-300 focus:border-maroon-500 focus:ring-maroon-500" />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="tagline" className="text-slate-600">Tagline</Label>
                        <Input id="tagline" defaultValue="Unveil Your Destiny" className="h-10 border-slate-300 focus:border-maroon-500 focus:ring-maroon-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="admin-email" className="text-slate-600">Admin Email</Label>
                        <Input id="admin-email" defaultValue="admin@herozodiac.com" disabled className="bg-slate-50 border-slate-200 text-slate-500 max-w-md" />
                        <p className="text-xs text-slate-400">Contact support to change administrative email.</p>
                    </div>
                    </CardContent>
                </Card>
                </TabsContent>

                {/* 2. BRANDING TAB */}
                <TabsContent value="branding" className="mt-0 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                    <CardTitle className="text-xl">Look & Feel</CardTitle>
                    <CardDescription>Customize the visual appearance of your blog.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-8">
                    
                    {/* Colors */}
                    <div>
                        <Label className="text-base mb-4 block">Brand Colors</Label>
                        <div className="flex flex-wrap gap-4 items-center">
                            {[
                                { name: 'Maroon', value: '#922B21', class: 'bg-[#922B21]' },
                                { name: 'Blue', value: '#2563EB', class: 'bg-blue-600' },
                                { name: 'Emerald', value: '#059669', class: 'bg-emerald-600' }
                            ].map((color) => (
                                <div key={color.value} className="group relative" onClick={() => setSelectedColor(color.value)}>
                                    <div className={`h-14 w-14 rounded-full ${color.class} shadow-md border-2 ${selectedColor === color.value ? 'border-white ring-2 ring-slate-900' : 'border-transparent hover:border-slate-300'} cursor-pointer transition-transform hover:scale-110 flex items-center justify-center`}>
                                        {selectedColor === color.value && <Check className="text-white h-6 w-6" />}
                                    </div>
                                    {selectedColor === color.value && (
                                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-600 whitespace-nowrap">{color.name}</span>
                                    )}
                                </div>
                            ))}

                            <div 
                                onClick={() => document.getElementById('custom-color-input')?.click()}
                                className={`h-14 w-14 rounded-full border-2 ${!['#922B21', '#2563EB', '#059669'].includes(selectedColor) ? 'border-maroon-500 ring-2 ring-maroon-100' : 'border-dashed border-slate-300 hover:border-maroon-500'} flex items-center justify-center text-slate-400 cursor-pointer transition-colors bg-slate-50 relative overflow-hidden`}
                                style={!['#922B21', '#2563EB', '#059669'].includes(selectedColor) ? { backgroundColor: selectedColor } : {}}
                            >
                                {!['#922B21', '#2563EB', '#059669'].includes(selectedColor) ? (
                                     <Check className="text-white h-6 w-6 brightness-200 drop-shadow-md" />
                                ) : (
                                     <Palette className="h-5 w-5" />
                                )}
                                <Input 
                                    id="custom-color-input"
                                    type="color" 
                                    onChange={(e) => setSelectedColor(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 border-none" 
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Typography */}
                    <div className="space-y-4">
                        <h3 className="text-base font-medium">Typography</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Heading Font</Label>
                                <div className="relative">
                                    <select className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent appearance-none">
                                        <option>Playfair Display (Serif)</option>
                                        <option>Inter (Sans)</option>
                                        <option>Merriweather (Serif)</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Body Font</Label>
                                <div className="relative">
                                    <select className="flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent appearance-none">
                                        <option>Inter (Sans)</option>
                                        <option>Roboto (Sans)</option>
                                        <option>Lato (Sans)</option>
                                    </select>
                                     <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </CardContent>
                </Card>
                </TabsContent>

                {/* 3. API TAB (NOW FETCHES REAL DATA) */}
                <TabsContent value="api" className="mt-0 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
                    <CardTitle className="text-xl">Developer Access</CardTitle>
                    <CardDescription>Manage API keys for your frontend applications.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-8">
                    
                    <div className="space-y-3">
                        <Label className="text-base">Public API Key</Label>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-maroon-700" />
                                    ) : (
                                        <Lock className="h-4 w-4 text-slate-500" />
                                    )}
                                </div>
                                <Input 
                                    readOnly 
                                    value={loading ? "Loading key..." : apiKey || "No key found"} 
                                    className="pl-10 font-mono text-sm bg-slate-50 border-slate-300 h-11" 
                                />
                            </div>
                            <Button 
                                variant={copied ? "default" : "outline"} 
                                onClick={handleCopy}
                                disabled={loading || !apiKey}
                                className={`h-11 min-w-[100px] transition-all ${copied ? 'bg-green-600 border-green-600 hover:bg-green-700 text-white' : 'hover:bg-slate-50'}`}
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 mr-2" /> Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4 mr-2" /> Copy
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-sm text-slate-500">
                            This key is public and safe to use in your frontend code.
                        </p>
                    </div>
                    
                    <Separator />

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200/60">
                        <div className="space-y-0.5">
                             <Label htmlFor="public-api" className="text-base font-medium">Enable Public Read API</Label>
                             <p className="text-sm text-slate-500">Allow unauthenticated read access to published posts.</p>
                        </div>
                        <Switch id="public-api" defaultChecked />
                    </div>

                    </CardContent>
                </Card>
                </TabsContent>
            </div>
        </div>
      </Tabs>
    </div>
  );
}