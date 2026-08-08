import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FlaskConical, RotateCcw, UserPlus } from "lucide-react";
import { clearGuestData, seedGuestData, setGuestMode, setPendingMigration } from "@/lib/guest/store";
import { getTranslation, type Language } from "@/lib/i18n";

interface GuestModeBannerProps {
  language?: Language;
}

export const GuestModeBanner = ({ language = "en" }: GuestModeBannerProps) => {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const t = (key: string, fallback: string) => {
    const value = getTranslation(language, key as any);
    return !value || value === key ? fallback : value;
  };

  const handleCreateAccount = () => {
    setBusy(true);
    // Keep the demo data around so it can be copied into the new account.
    setPendingMigration(true);
    setGuestMode(false);
    window.location.reload();
  };

  const handleReset = () => {
    seedGuestData();
    queryClient.invalidateQueries();
  };

  const handleExit = () => {
    clearGuestData();
    setGuestMode(false);
    window.location.reload();
  };

  return (
    <Alert className="no-print border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100">
      <FlaskConical className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm">
          {t("guestModeBannerText", "Demo mode: data is saved only on this device. Create an account to keep it.")}
        </span>
        <span className="flex flex-wrap gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
          <Button size="sm" onClick={handleCreateAccount} disabled={busy}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t("guestModeCreateAccount", "Create account & save data")}
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset} disabled={busy}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("guestModeReset", "Reset demo data")}
          </Button>
          <Button size="sm" variant="ghost" onClick={handleExit} disabled={busy}>
            {t("guestModeExit", "Exit demo")}
          </Button>
        </span>
      </AlertDescription>
    </Alert>
  );
};

export default GuestModeBanner;
