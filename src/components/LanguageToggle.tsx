import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";
import { Language } from "@/lib/i18n";

interface LanguageToggleProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const languageOptions = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'pt', label: 'Português', flag: '🇵🇹' },
  { value: 'pl', label: 'Polski', flag: '🇵🇱' },
  { value: 'ro', label: 'Română', flag: '🇷🇴' },
];

export const LanguageToggle = ({ language, onLanguageChange }: LanguageToggleProps) => {
  const currentLanguage = languageOptions.find(opt => opt.value === language);
  
  return (
    <Select value={language} onValueChange={(value) => onLanguageChange(value as Language)}>
      <SelectTrigger className="w-[140px] gap-2">
        <Languages className="h-4 w-4" />
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <span>{currentLanguage?.flag}</span>
            <span>{currentLanguage?.label}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languageOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              <span>{option.flag}</span>
              <span>{option.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
