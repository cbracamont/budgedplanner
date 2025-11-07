-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can update their display name" ON public.household_members;

-- Simple policy for user updates
CREATE POLICY "Users can update their membership"
ON public.household_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger function to prevent status changes by non-owners
CREATE OR REPLACE FUNCTION public.prevent_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow owners to change status
  IF public.is_household_owner(NEW.household_id, auth.uid()) THEN
    RETURN NEW;
  END IF;
  
  -- Non-owners cannot change status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE EXCEPTION 'Only household owners can change membership status';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce status protection
CREATE TRIGGER enforce_status_protection
BEFORE UPDATE ON public.household_members
FOR EACH ROW
EXECUTE FUNCTION public.prevent_status_change();