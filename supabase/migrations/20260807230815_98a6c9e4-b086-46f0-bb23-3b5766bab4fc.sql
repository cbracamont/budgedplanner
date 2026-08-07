CREATE TABLE public.category_budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.financial_profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.variable_expense_categories(id) ON DELETE CASCADE,
  month_year date NOT NULL,
  limit_amount numeric NOT NULL DEFAULT 0 CHECK (limit_amount >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX category_budgets_unique_scope
  ON public.category_budgets (user_id, COALESCE(profile_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), month_year);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_budgets TO authenticated;
GRANT ALL ON public.category_budgets TO service_role;

ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own or household category budgets"
ON public.category_budgets FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()))
);

CREATE POLICY "Users can insert own category budgets"
ON public.category_budgets FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (profile_id IS NULL OR public.can_access_profile(profile_id, auth.uid()))
);

CREATE POLICY "Users can update own or household category budgets"
ON public.category_budgets FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
  OR (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()))
);

CREATE POLICY "Users can delete own or household category budgets"
ON public.category_budgets FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()))
);

CREATE TRIGGER update_category_budgets_updated_at
BEFORE UPDATE ON public.category_budgets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();