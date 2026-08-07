CREATE OR REPLACE FUNCTION public.set_active_financial_profile(p_profile_id uuid)
RETURNS public.financial_profiles
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  result public.financial_profiles;
BEGIN
  UPDATE public.financial_profiles
     SET is_active = false
   WHERE user_id = auth.uid()
     AND id <> p_profile_id
     AND is_active = true;

  UPDATE public.financial_profiles
     SET is_active = true
   WHERE id = p_profile_id
     AND user_id = auth.uid()
  RETURNING * INTO result;

  IF result IS NULL THEN
    RAISE EXCEPTION 'Profile not found or not owned by the current user';
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_active_financial_profile(uuid) TO authenticated;