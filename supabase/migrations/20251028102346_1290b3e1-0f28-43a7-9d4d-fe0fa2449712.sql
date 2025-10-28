-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view household members" ON public.household_members;

-- Create a security definer function to check household membership
CREATE OR REPLACE FUNCTION public.is_household_member(_household_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = _household_id
      AND user_id = _user_id
  )
$$;

-- Create new policy using the security definer function
CREATE POLICY "Users can view household members"
ON public.household_members
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  public.is_household_member(household_id, auth.uid())
);