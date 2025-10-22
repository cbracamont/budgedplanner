import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { Language } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CategoryNameEditorProps {
  language: Language;
}

interface CategoryName {
  category_key: string;
  custom_name: string;
  default_en: string;
  default_es: string;
}

const defaultCategories: CategoryName[] = [
  { category_key: 'income', custom_name: '', default_en: 'Income', default_es: 'Ingresos' },
  { category_key: 'debts', custom_name: '', default_en: 'Debts & Loans', default_es: 'Deudas y Préstamos' },
  { category_key: 'fixedExpenses', custom_name: '', default_en: 'Fixed Monthly Expenses', default_es: 'Gastos Fijos Mensuales' },
  { category_key: 'variableExpenses', custom_name: '', default_en: 'Variable Monthly Expenses', default_es: 'Gastos Variables Mensuales' },
  { category_key: 'emergencyFund', custom_name: '', default_en: 'Emergency Fund', default_es: 'Fondo de Emergencia' },
  { category_key: 'savingsGoals', custom_name: '', default_en: 'Savings Goals', default_es: 'Metas de Ahorro' },
];

export const CategoryNameEditor = ({ language }: CategoryNameEditorProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryName[]>(defaultCategories);

  useEffect(() => {
    if (isOpen) {
      loadCategoryNames();
    }
  }, [isOpen]);

  const loadCategoryNames = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('category_names')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      const updatedCategories = defaultCategories.map(cat => {
        const custom = data.find(d => d.category_key === cat.category_key);
        return custom ? { ...cat, custom_name: custom.custom_name } : cat;
      });
      setCategories(updatedCategories);
    }
  };

  const saveCategoryName = async (categoryKey: string, customName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!customName.trim()) {
      // Delete if empty
      await supabase
        .from('category_names')
        .delete()
        .eq('user_id', user.id)
        .eq('category_key', categoryKey);
      return;
    }

    // Upsert the custom name
    const { error } = await supabase
      .from('category_names')
      .upsert({
        user_id: user.id,
        category_key: categoryKey,
        custom_name: customName.trim()
      }, {
        onConflict: 'user_id,category_key'
      });

    if (error) {
      toast({ 
        title: "Error", 
        description: language === 'en' ? "Failed to save category name" : "Error al guardar nombre de categoría", 
        variant: "destructive" 
      });
    }
  };

  const handleSave = async () => {
    for (const cat of categories) {
      if (cat.custom_name) {
        await saveCategoryName(cat.category_key, cat.custom_name);
      }
    }
    
    toast({ 
      title: language === 'en' ? "Success" : "Éxito", 
      description: language === 'en' ? "Category names saved successfully" : "Nombres de categorías guardados exitosamente"
    });
    
    setIsOpen(false);
    // Trigger a page reload to update all category names
    window.location.reload();
  };

  const updateCategoryName = (categoryKey: string, newName: string) => {
    setCategories(categories.map(cat => 
      cat.category_key === categoryKey ? { ...cat, custom_name: newName } : cat
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          {language === 'en' ? 'Edit Category Names' : 'Editar Nombres de Categorías'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Customize Category Names' : 'Personalizar Nombres de Categorías'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {categories.map((cat) => (
            <div key={cat.category_key} className="space-y-2">
              <Label htmlFor={cat.category_key}>
                {language === 'en' ? cat.default_en : cat.default_es}
              </Label>
              <Input
                id={cat.category_key}
                value={cat.custom_name}
                onChange={(e) => updateCategoryName(cat.category_key, e.target.value)}
                placeholder={language === 'en' 
                  ? `Custom name (leave empty for default: ${cat.default_en})` 
                  : `Nombre personalizado (dejar vacío para usar: ${cat.default_es})`}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {language === 'en' ? 'Cancel' : 'Cancelar'}
            </Button>
            <Button onClick={handleSave}>
              {language === 'en' ? 'Save Changes' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};