import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Palette, Check } from "lucide-react";

interface ThemeSettingsProps {
  language: 'en' | 'es';
  onThemeChange: (theme: string) => void;
}

const themes = [
  {
    id: 'sober',
    name: { en: 'Sober & Professional', es: 'Sobrio y Profesional' },
    description: { en: 'Clean and minimalist design', es: 'Diseño limpio y minimalista' },
    preview: 'linear-gradient(135deg, hsl(220 15% 25%) 0%, hsl(220 15% 40%) 100%)',
  },
  {
    id: 'gold',
    name: { en: 'Premium Gold', es: 'Oro Premium' },
    description: { en: 'Luxurious golden theme', es: 'Tema dorado lujoso' },
    preview: 'linear-gradient(135deg, hsl(45 100% 51%) 0%, hsl(38 92% 50%) 100%)',
  },
  {
    id: 'ocean',
    name: { en: 'Ocean Blue', es: 'Azul Océano' },
    description: { en: 'Calm and serene design', es: 'Diseño calmado y sereno' },
    preview: 'linear-gradient(135deg, hsl(200 90% 50%) 0%, hsl(220 85% 60%) 100%)',
  },
  {
    id: 'forest',
    name: { en: 'Forest Green', es: 'Verde Bosque' },
    description: { en: 'Natural and balanced', es: 'Natural y equilibrado' },
    preview: 'linear-gradient(135deg, hsl(140 70% 40%) 0%, hsl(160 65% 50%) 100%)',
  },
  {
    id: 'sunset',
    name: { en: 'Sunset Orange', es: 'Naranja Atardecer' },
    description: { en: 'Warm and energetic', es: 'Cálido y energético' },
    preview: 'linear-gradient(135deg, hsl(25 95% 55%) 0%, hsl(340 85% 60%) 100%)',
  },
  {
    id: 'royal',
    name: { en: 'Royal Purple', es: 'Púrpura Real' },
    description: { en: 'Elegant and sophisticated', es: 'Elegante y sofisticado' },
    preview: 'linear-gradient(135deg, hsl(270 70% 50%) 0%, hsl(290 65% 60%) 100%)',
  },
];

export const ThemeSettings = ({ language, onThemeChange }: ThemeSettingsProps) => {
  const [currentTheme, setCurrentTheme] = useState<string>('gold');
  const { toast } = useToast();

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('app_settings')
      .select('color_theme')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data?.color_theme) {
      setCurrentTheme(data.color_theme);
      applyThemeToDocument(data.color_theme);
    }
  };

  const applyThemeToDocument = (themeId: string) => {
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const handleThemeSelect = async (themeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: language === 'en' ? 'Error' : 'Error',
        description: language === 'en' ? 'You must be logged in' : 'Debes estar conectado',
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          color_theme: themeId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setCurrentTheme(themeId);
      applyThemeToDocument(themeId);
      onThemeChange(themeId);

      toast({
        title: language === 'en' ? 'Theme Updated' : 'Tema Actualizado',
        description: language === 'en' ? 'Your theme has been changed successfully' : 'Tu tema ha sido cambiado exitosamente',
      });
    } catch (error) {
      console.error('Error updating theme:', error);
      toast({
        title: language === 'en' ? 'Error' : 'Error',
        description: language === 'en' ? 'Failed to update theme' : 'Error al actualizar el tema',
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>
            {language === 'en' ? 'Color Theme' : 'Tema de Color'}
          </CardTitle>
        </div>
        <CardDescription>
          {language === 'en' 
            ? 'Customize your planner with different color schemes' 
            : 'Personaliza tu planificador con diferentes esquemas de color'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <Button
              key={theme.id}
              variant="outline"
              className={`h-auto p-4 flex flex-col items-center gap-2 relative ${
                currentTheme === theme.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleThemeSelect(theme.id)}
            >
              {currentTheme === theme.id && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-3 w-3" />
                </div>
              )}
              <div 
                className="w-full h-16 rounded-md border"
                style={{ background: theme.preview }}
              />
              <div className="text-center">
                <div className="font-semibold text-sm">{theme.name[language]}</div>
                <div className="text-xs text-muted-foreground">{theme.description[language]}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
