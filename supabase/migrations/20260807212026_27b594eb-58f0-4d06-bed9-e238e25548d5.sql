-- 1. Helper: can the user access a given financial profile?
CREATE OR REPLACE FUNCTION public.can_access_profile(_profile_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.financial_profiles fp
    WHERE fp.id = _profile_id
      AND (
        fp.user_id = _user_id
        OR (fp.household_id IS NOT NULL AND public.is_household_member(fp.household_id, _user_id))
      )
  )
$$;

-- 2. Shared household profile helper
CREATE OR REPLACE FUNCTION public.ensure_household_shared_profile(_household_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _profile_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_household_member(_household_id, _user_id) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  SELECT id INTO _profile_id
  FROM public.financial_profiles
  WHERE household_id = _household_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF _profile_id IS NULL THEN
    INSERT INTO public.financial_profiles (user_id, name, type, is_active, household_id)
    VALUES (_user_id, 'Family', 'family', false, _household_id)
    RETURNING id INTO _profile_id;
  END IF;

  RETURN _profile_id;
END;
$$;

-- 3. financial_profiles: household members can see and edit the shared profile
CREATE POLICY "Household members can view shared profiles"
ON public.financial_profiles FOR SELECT TO authenticated
USING (household_id IS NOT NULL AND public.is_household_member(household_id, auth.uid()));

CREATE POLICY "Household members can update shared profiles"
ON public.financial_profiles FOR UPDATE TO authenticated
USING (household_id IS NOT NULL AND public.is_household_member(household_id, auth.uid()))
WITH CHECK (household_id IS NOT NULL AND public.is_household_member(household_id, auth.uid()));

-- 4. Shared access on financial data tables scoped by profile_id
CREATE POLICY "Household members can view shared income"
ON public.income_sources FOR SELECT TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can insert shared income"
ON public.income_sources FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can update shared income"
ON public.income_sources FOR UPDATE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()))
WITH CHECK (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can delete shared income"
ON public.income_sources FOR DELETE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));

CREATE POLICY "Household members can view shared fixed expenses"
ON public.fixed_expenses FOR SELECT TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can insert shared fixed expenses"
ON public.fixed_expenses FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can update shared fixed expenses"
ON public.fixed_expenses FOR UPDATE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()))
WITH CHECK (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can delete shared fixed expenses"
ON public.fixed_expenses FOR DELETE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));

CREATE POLICY "Household members can view shared variable expenses"
ON public.variable_expenses FOR SELECT TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can insert shared variable expenses"
ON public.variable_expenses FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can update shared variable expenses"
ON public.variable_expenses FOR UPDATE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()))
WITH CHECK (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can delete shared variable expenses"
ON public.variable_expenses FOR DELETE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));

CREATE POLICY "Household members can view shared variable income"
ON public.variable_income FOR SELECT TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can insert shared variable income"
ON public.variable_income FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can update shared variable income"
ON public.variable_income FOR UPDATE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()))
WITH CHECK (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can delete shared variable income"
ON public.variable_income FOR DELETE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));

CREATE POLICY "Household members can view shared debts"
ON public.debts FOR SELECT TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can insert shared debts"
ON public.debts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can update shared debts"
ON public.debts FOR UPDATE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()))
WITH CHECK (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can delete shared debts"
ON public.debts FOR DELETE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));

CREATE POLICY "Household members can view shared savings"
ON public.savings FOR SELECT TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can insert shared savings"
ON public.savings FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can update shared savings"
ON public.savings FOR UPDATE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()))
WITH CHECK (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can delete shared savings"
ON public.savings FOR DELETE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));

CREATE POLICY "Household members can view shared savings goals"
ON public.savings_goals FOR SELECT TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can insert shared savings goals"
ON public.savings_goals FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can update shared savings goals"
ON public.savings_goals FOR UPDATE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()))
WITH CHECK (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can delete shared savings goals"
ON public.savings_goals FOR DELETE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));

CREATE POLICY "Household members can view shared payment tracker"
ON public.payment_tracker FOR SELECT TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can insert shared payment tracker"
ON public.payment_tracker FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can update shared payment tracker"
ON public.payment_tracker FOR UPDATE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()))
WITH CHECK (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));
CREATE POLICY "Household members can delete shared payment tracker"
ON public.payment_tracker FOR DELETE TO authenticated
USING (profile_id IS NOT NULL AND public.can_access_profile(profile_id, auth.uid()));

-- debt_payments: access follows the parent debt's profile
CREATE POLICY "Household members can view shared debt payments"
ON public.debt_payments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.debts d
  WHERE d.id = debt_payments.debt_id
    AND d.profile_id IS NOT NULL
    AND public.can_access_profile(d.profile_id, auth.uid())
));
CREATE POLICY "Household members can insert shared debt payments"
ON public.debt_payments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.debts d
  WHERE d.id = debt_payments.debt_id
    AND d.profile_id IS NOT NULL
    AND public.can_access_profile(d.profile_id, auth.uid())
));
CREATE POLICY "Household members can update shared debt payments"
ON public.debt_payments FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.debts d
  WHERE d.id = debt_payments.debt_id
    AND d.profile_id IS NOT NULL
    AND public.can_access_profile(d.profile_id, auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.debts d
  WHERE d.id = debt_payments.debt_id
    AND d.profile_id IS NOT NULL
    AND public.can_access_profile(d.profile_id, auth.uid())
));
CREATE POLICY "Household members can delete shared debt payments"
ON public.debt_payments FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.debts d
  WHERE d.id = debt_payments.debt_id
    AND d.profile_id IS NOT NULL
    AND public.can_access_profile(d.profile_id, auth.uid())
));