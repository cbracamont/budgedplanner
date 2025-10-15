import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";
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

  const saveWallpaper = async () => {
    if (!wallpaperUrl.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('app_settings')
        .update({ wallpaper_url: wallpaperUrl })
        .eq('user_id', user.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update wallpaper", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from('app_settings')
        .insert({ user_id: user.id, wallpaper_url: wallpaperUrl });

      if (error) {
        toast({ title: "Error", description: "Failed to save wallpaper", variant: "destructive" });
        return;
      }
    }

    setCurrentWallpaper(wallpaperUrl);
    onWallpaperChange(wallpaperUrl);
    toast({ title: "Success", description: "Wallpaper updated successfully" });
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

        <Button onClick={saveWallpaper} className="w-full">
          {language === 'en' ? 'Apply Wallpaper' : 'Aplicar Fondo'}
        </Button>
      </CardContent>
    </Card>
  );
};