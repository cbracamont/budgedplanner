import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { UserCircle, Plus, Trash2, Check } from "lucide-react";
import { useFinancialProfiles, useActiveProfile, useAddProfile, useSetActiveProfile, useDeleteProfile } from "@/hooks/useFinancialProfiles";
import { getTranslation, Language } from "@/lib/i18n";

interface ProfileSelectorProps {
  language: Language;
}

export const ProfileSelector = ({ language }: ProfileSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileType, setNewProfileType] = useState("personal");

  const { data: profiles, isLoading } = useFinancialProfiles();
  const { data: activeProfile } = useActiveProfile();
  const addProfile = useAddProfile();
  const setActiveProfile = useSetActiveProfile();
  const deleteProfile = useDeleteProfile();

  const handleAddProfile = async () => {
    if (!newProfileName.trim()) return;

    await addProfile.mutateAsync({
      name: newProfileName,
      type: newProfileType,
      is_active: !profiles || profiles.length === 0,
    });

    setNewProfileName("");
    setNewProfileType("personal");
  };

  const handleDeleteProfile = async (id: string) => {
    if (profiles && profiles.length <= 1) {
      alert(getTranslation(language, "cannotDeleteLastProfile"));
      return;
    }
    await deleteProfile.mutateAsync(id);
  };

  if (isLoading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserCircle className="h-4 w-4" />
          {activeProfile?.name || getTranslation(language, "selectProfile")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTranslation(language, "financialProfiles")}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {profiles && profiles.length > 0 && (
            <div className="space-y-2">
              {profiles.map((profile) => (
                <Card
                  key={profile.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    profile.is_active ? "bg-primary/10 border-primary" : "hover:bg-muted"
                  }`}
                  onClick={() => !profile.is_active && setActiveProfile.mutate(profile.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {profile.is_active && <Check className="h-4 w-4 text-primary" />}
                      <div>
                        <p className="font-medium">{profile.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{profile.type}</p>
                      </div>
                    </div>
                    {profiles.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfile(profile.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-3 pt-4 border-t">
            <Label>{getTranslation(language, "createNewProfile")}</Label>
            <Input
              placeholder={getTranslation(language, "profileName")}
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
            />
            <Select value={newProfileType} onValueChange={setNewProfileType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">{getTranslation(language, "personal")}</SelectItem>
                <SelectItem value="family">{getTranslation(language, "family")}</SelectItem>
                <SelectItem value="business">{getTranslation(language, "business")}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddProfile} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              {getTranslation(language, "createProfile")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};