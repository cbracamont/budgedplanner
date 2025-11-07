import { useState } from "react";
import { Menu, Download, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ProfileSelector } from "@/components/ProfileSelector";
import { Separator } from "@/components/ui/separator";
import { Language } from "@/lib/i18n";

interface MobileMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { value: string; label: string; icon: React.ReactNode }[];
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: string | undefined;
  onThemeToggle: () => void;
  onExportData: () => void;
  onLogout: () => void;
}

export function MobileMenu({ activeTab, onTabChange, tabs, language, onLanguageChange, theme, onThemeToggle, onExportData, onLogout }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  const handleTabClick = (value: string) => {
    onTabChange(value);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-50 bg-card shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-card">
        <div className="flex flex-col gap-4 mt-8">
          {/* Navigation Tabs */}
          <div className="flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleTabClick(tab.value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          <Separator className="my-2" />

          {/* Settings Section */}
          <div className="flex flex-col gap-3">
            <div className="px-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Settings</p>
              
              {/* Language Toggle */}
              <div className="mb-3">
                <LanguageToggle language={language} onLanguageChange={onLanguageChange} />
              </div>

              {/* Profile Selector */}
              <div className="mb-3">
                <ProfileSelector language={language} />
              </div>

              {/* Theme Toggle */}
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 mb-2"
                onClick={onThemeToggle}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </Button>

              {/* Export Data */}
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 mb-2"
                onClick={() => {
                  onExportData();
                  setOpen(false);
                }}
              >
                <Download className="h-4 w-4" />
                <span>Download Data</span>
              </Button>

              {/* Logout */}
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                onClick={() => {
                  onLogout();
                  setOpen(false);
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
