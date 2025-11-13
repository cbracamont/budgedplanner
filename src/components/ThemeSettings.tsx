import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Palette, Check } from "lucide-react";

import { Language } from "@/lib/i18n";

interface ThemeSettingsProps {
  language: Language;
  onThemeChange: (theme: string) => void;
}

const themes = [
  {
    id: 'sober',
    name: { en: 'Sober & Professional', es: 'Sobrio y Profesional', pt: 'Sóbrio e Profissional', pl: 'Stonowany i Profesjonalny', ro: 'Sobru și Profesional' },
    description: { en: 'Clean and minimalist design', es: 'Diseño limpio y minimalista', pt: 'Design limpo e minimalista', pl: 'Czysty i minimalistyczny projekt', ro: 'Design curat și minimalist' },
    preview: 'linear-gradient(135deg, hsl(220 15% 25%) 0%, hsl(220 15% 40%) 100%)',
  },
  {
    id: 'gold',
    name: { en: 'Premium Gold', es: 'Oro Premium', pt: 'Ouro Premium', pl: 'Złoto Premium', ro: 'Aur Premium' },
    description: { en: 'Luxurious golden theme', es: 'Tema dorado lujoso', pt: 'Tema dourado luxuoso', pl: 'Luksusowy złoty motyw', ro: 'Temă aurie luxoasă' },
    preview: 'linear-gradient(135deg, hsl(45 100% 51%) 0%, hsl(38 92% 50%) 100%)',
  },
  {
    id: 'ocean',
    name: { en: 'Ocean Blue', es: 'Azul Océano', pt: 'Azul Oceano', pl: 'Niebieski Oceaniczny', ro: 'Albastru Ocean' },
    description: { en: 'Calm and serene design', es: 'Diseño calmado y sereno', pt: 'Design calmo e sereno', pl: 'Spokojny i pogodny projekt', ro: 'Design calm și liniștit' },
    preview: 'linear-gradient(135deg, hsl(200 90% 50%) 0%, hsl(220 85% 60%) 100%)',
  },
  {
    id: 'forest',
    name: { en: 'Forest Green', es: 'Verde Bosque', pt: 'Verde Floresta', pl: 'Zielony Las', ro: 'Verde Pădure' },
    description: { en: 'Natural and balanced', es: 'Natural y equilibrado', pt: 'Natural e equilibrado', pl: 'Naturalny i zrównoważony', ro: 'Natural și echilibrat' },
    preview: 'linear-gradient(135deg, hsl(140 70% 40%) 0%, hsl(160 65% 50%) 100%)',
  },
  {
    id: 'sunset',
    name: { en: 'Sunset Orange', es: 'Naranja Atardecer', pt: 'Laranja Pôr do Sol', pl: 'Pomarańczowy Zachód', ro: 'Portocaliu Apus' },
    description: { en: 'Warm and energetic', es: 'Cálido y energético', pt: 'Quente e energético', pl: 'Ciepły i energiczny', ro: 'Cald și energic' },
    preview: 'linear-gradient(135deg, hsl(25 95% 55%) 0%, hsl(340 85% 60%) 100%)',
  },
  {
    id: 'royal',
    name: { en: 'Royal Purple', es: 'Púrpura Real', pt: 'Roxo Real', pl: 'Królewski Fiolet', ro: 'Mov Regal' },
    description: { en: 'Elegant and sophisticated', es: 'Elegante y sofisticado', pt: 'Elegante e sofisticado', pl: 'Elegancki i wyrafinowany', ro: 'Elegant și sofisticat' },
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
    } else {
      // Apply default theme if no settings exist
      applyThemeToDocument('gold');
    }
  };

  const applyThemeToDocument = (themeId: string) => {
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const handleThemeSelect = async (themeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const errorMessages = {
        en: 'You must be logged in',
        es: 'Debes estar conectado',
        pt: 'Você deve estar conectado',
        pl: 'Musisz być zalogowany',
        ro: 'Trebuie să fiți conectat'
      };
      toast({
        title: 'Error',
        description: errorMessages[language],
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

      const successTitles = {
        en: 'Theme Updated',
        es: 'Tema Actualizado',
        pt: 'Tema Atualizado',
        pl: 'Motyw Zaktualizowany',
        ro: 'Temă Actualizată'
      };
      const successMessages = {
        en: 'Your theme has been changed successfully',
        es: 'Tu tema ha sido cambiado exitosamente',
        pt: 'Seu tema foi alterado com sucesso',
        pl: 'Twój motyw został zmieniony pomyślnie',
        ro: 'Tema dvs. a fost schimbată cu succes'
      };
      toast({
        title: successTitles[language],
        description: successMessages[language],
      });
    } catch (error) {
      console.error('Error updating theme:', error);
      const errorTitles = {
        en: 'Failed to update theme',
        es: 'Error al actualizar el tema',
        pt: 'Falha ao atualizar o tema',
        pl: 'Nie udało się zaktualizować motywu',
        ro: 'Nu s-a putut actualiza tema'
      };
      toast({
        title: 'Error',
        description: errorTitles[language],
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
            {{ en: 'Color Theme', es: 'Tema de Color', pt: 'Tema de Cores', pl: 'Motyw Kolorystyczny', ro: 'Temă Culori' }[language]}
          </CardTitle>
        </div>
        <CardDescription>
          {{ 
            en: 'Customize your planner with different color schemes',
            es: 'Personaliza tu planificador con diferentes esquemas de color',
            pt: 'Personalize seu planejador com diferentes esquemas de cores',
            pl: 'Dostosuj swój planer za pomocą różnych schematów kolorów',
            ro: 'Personalizați-vă planificatorul cu diferite scheme de culori'
          }[language]}
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
