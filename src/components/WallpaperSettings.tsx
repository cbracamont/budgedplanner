import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, Upload } from "lucide-react";
import { Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WallpaperSettingsProps {
  language: Language;
  onWallpaperChange: (url: string | null) => void;
}

export const WallpaperSettings = ({ language, onWallpaperChange }: WallpaperSettingsProps) => {
  const { toast } = useToast();
  const [wallpaperUrl, setWallpaperUrl] = useState("");
  const [currentWallpaper, setCurrentWallpaper] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedWallpaperUrl, setUploadedWallpaperUrl] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('app_settings')
      .select('wallpaper_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.wallpaper_url) {
      setCurrentWallpaper(data.wallpaper_url);
      onWallpaperChange(data.wallpaper_url);
    }
  };

  const applyWallpaper = async (url: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('app_settings')
        .update({ wallpaper_url: url })
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('app_settings')
        .insert({ user_id: user.id, wallpaper_url: url });

      if (error) throw error;
    }

    setCurrentWallpaper(url);
    setWallpaperUrl("");
    onWallpaperChange(url);
    return true;
  };

  const saveWallpaper = async () => {
    if (!wallpaperUrl.trim()) return;
    setIsUploading(true);

    try {
      await applyWallpaper(wallpaperUrl);
      toast({ title: "Success", description: "Wallpaper updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update wallpaper", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const removeWallpaper = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('app_settings')
      .update({ wallpaper_url: null })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: "Error", description: "Failed to remove wallpaper", variant: "destructive" });
      return;
    }

    setCurrentWallpaper(null);
    setWallpaperUrl("");
    onWallpaperChange(null);
    toast({ title: "Success", description: "Wallpaper removed successfully" });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('wallpapers')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('wallpapers')
        .getPublicUrl(fileName);

      setUploadedWallpaperUrl(publicUrl);
      toast({ title: language === 'en' ? 'Image uploaded' : 'Imagen subida', description: language === 'en' ? 'Click Apply to set as wallpaper' : 'Haz clic en Aplicar para usarla como fondo' });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <CardTitle>{language === 'en' ? 'Wallpaper Settings' : 'Configuración de Fondo'}</CardTitle>
        </div>
        <CardDescription>
          {language === 'en' ? 'Customize your app background' : 'Personaliza el fondo de tu aplicación'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentWallpaper && (
          <div className="relative rounded-lg overflow-hidden border">
            <img 
              src={currentWallpaper} 
              alt="Current wallpaper" 
              className="w-full h-40 object-cover"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={removeWallpaper}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              {language === 'en' ? 'Upload from PC' : 'Subir desde PC'}
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-full"
              disabled={isUploading}
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading 
                ? (language === 'en' ? 'Uploading...' : 'Subiendo...') 
                : (language === 'en' ? 'Choose Image' : 'Seleccionar Imagen')}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {language === 'en' ? 'Or' : 'O'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallpaper-url">
              {language === 'en' ? 'Image URL' : 'URL de Imagen'}
            </Label>
            <Input
              id="wallpaper-url"
              type="url"
              value={wallpaperUrl}
              onChange={(e) => setWallpaperUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-muted-foreground">
              {language === 'en' 
                ? 'Enter a URL to an image you want to use as wallpaper' 
                : 'Ingresa la URL de una imagen que quieras usar como fondo'}
            </p>
          </div>

          <Button onClick={saveWallpaper} className="w-full" disabled={!wallpaperUrl.trim() || isUploading}>
            {isUploading 
              ? (language === 'en' ? 'Applying...' : 'Aplicando...') 
              : (language === 'en' ? 'Apply URL Wallpaper' : 'Aplicar Fondo por URL')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};