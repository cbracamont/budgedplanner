import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Language, getTranslation } from '@/lib/i18n';

interface CategoryName {
  category_key: string;
  custom_name: string;
}

export const useCategoryNames = (language: Language) => {
  const { data: categoryNames = [] } = useQuery({
    queryKey: ['category_names'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('category_names')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return (data || []) as CategoryName[];
    }
  });

  const getCategoryName = (key: string): string => {
    const custom = categoryNames.find(c => c.category_key === key);
    return custom?.custom_name || getTranslation(language, key);
  };

  return { getCategoryName };
};