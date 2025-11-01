// src/components/LanguageToggle.tsx
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

type Language = "en" | "es" | "pl" | "pt";

const flags: Record<Language, string> = {
  en: "UK",
  es: "Spain",
  pl: "Poland",
  pt: "Portugal",
};

const labels: Record<Language, string> = {
  en: "English",
  es: "Español",
  pl: "Polski",
  pt: "Português",
};

interface LanguageToggleProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const languages: Language[] = ["en", "es", "pl", "pt"];

export const LanguageToggle = ({ language, onLanguageChange }: LanguageToggleProps) => {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      {languages.map((lang) => (
        <Button
          key={lang}
          variant={language === lang ? "default" : "ghost"}
          size="sm"
          onClick={() => onLanguageChange(lang)}
          className="text-xs"
        >
          <Globe className="h-3 w-3 mr-1" />
          {flags[lang]}
        </Button>
      ))}
    </div>
  );
};
