import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserSettings, useUpdateCurrency } from "@/hooks/useUserSettings";
import { Loader2 } from "lucide-react";

const currencies = [
  { code: "USD", name: "Dólar estadounidense", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "MXN", name: "Peso mexicano", symbol: "$" },
  { code: "COP", name: "Peso colombiano", symbol: "$" },
  { code: "ARS", name: "Peso argentino", symbol: "$" },
  { code: "CLP", name: "Peso chileno", symbol: "$" },
  { code: "PEN", name: "Sol peruano", symbol: "S/" },
  { code: "BRL", name: "Real brasileño", symbol: "R$" },
  { code: "GBP", name: "Libra esterlina", symbol: "£" },
  { code: "JPY", name: "Yen japonés", symbol: "¥" },
];

export const SettingsTab = () => {
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
          <CardTitle>Configuración General</CardTitle>
          <CardDescription>
            Personaliza tu experiencia en la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select
              value={settings?.currency || "USD"}
              onValueChange={(value) => updateCurrency.mutate(value)}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Selecciona una moneda" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Esta será la moneda utilizada para mostrar todos los valores monetarios
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
