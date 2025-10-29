-- Add status field to household_members table
ALTER TABLE public.household_members
ADD COLUMN status text NOT NULL DEFAULT 'approved';

-- Add check constraint for valid status values
ALTER TABLE public.household_members
ADD CONSTRAINT household_members_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update RLS policy for viewing household members to only show approved members' data
DROP POLICY IF EXISTS "Users can view household members" ON public.household_members;

CREATE POLICY "Users can view household members" 
ON public.household_members 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (is_household_member(household_id, auth.uid()) AND status = 'approved')
);

-- Allow owners to see pending requests
CREATE POLICY "Owners can view pending requests"
ON public.household_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'owner'
      AND hm.status = 'approved'
  )
);

-- Allow owners to update membership status
CREATE POLICY "Owners can update member status"
ON public.household_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role = 'owner'
      AND hm.status = 'approved'
  )
);

-- Update is_household_member function to only check approved members
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