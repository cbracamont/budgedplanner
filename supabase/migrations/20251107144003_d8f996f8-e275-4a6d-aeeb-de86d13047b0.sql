-- Update the is_household_member function to check for approved status
-- Drop the function with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.is_household_member(uuid, uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.is_household_member(_household_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = _household_id
      AND user_id = _user_id
      AND status = 'approved'
  )
$$;

-- Recreate the RLS policy on household_members with proper status filtering
CREATE POLICY "Users can view household members" 
ON public.household_members 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (public.is_household_member(household_id, auth.uid()) AND status = 'approved')
);