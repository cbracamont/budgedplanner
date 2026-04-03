import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserSettings, useUpdateCurrency } from "@/hooks/useUserSettings";
import { Loader2 } from "lucide-react";
import { translations, type Language } from "@/lib/i18n";

const currencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "COP", name: "Colombian Peso", symbol: "$" },
  { code: "ARS", name: "Argentine Peso", symbol: "$" },
  { code: "CLP", name: "Chilean Peso", symbol: "$" },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
];

interface SettingsTabProps {
  language?: Language;
}

export const SettingsTab = ({ language = 'en' }: SettingsTabProps) => {
  const t = translations[language];
  const { data: settings, isLoading } = useUserSettings();
  const updateCurrency = useUpdateCurrency();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.generalSettings}</CardTitle>
          <CardDescription>{t.generalSettingsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">{t.currencyLabel}</Label>
            <Select
              value={settings?.currency || "USD"}
              onValueChange={(value) => updateCurrency.mutate(value)}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder={t.selectCurrency} />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">{t.currencyHelp}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
