import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MobileMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { value: string; label: string; icon: React.ReactNode }[];
}

export function MobileMenu({ activeTab, onTabChange, tabs }: MobileMenuProps) {
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
      <SheetContent side="left" className="w-64 bg-card">
        <div className="flex flex-col gap-2 mt-8">
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
      </SheetContent>
    </Sheet>
  );
}
