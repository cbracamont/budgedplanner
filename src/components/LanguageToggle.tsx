import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { Language } from "@/lib/i18n";

interface LanguageToggleProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LanguageToggle = ({ language, onLanguageChange }: LanguageToggleProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => onLanguageChange(language === 'en' ? 'es' : 'en')}
      className="gap-2"
    >
      <Languages className="h-4 w-4" />
      {language === 'en' ? 'ES' : 'EN'}
    </Button>
  );
};
