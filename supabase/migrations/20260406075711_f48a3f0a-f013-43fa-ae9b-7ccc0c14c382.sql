
-- ============================================================
-- FIX 1: household_user_roles privilege escalation
-- Replace ALL policy with per-command policies using has_household_role
-- ============================================================

-- Drop the problematic ALL policy
DROP POLICY IF EXISTS "Owners can manage roles" ON public.household_user_roles;

-- SELECT: household members can view roles (already exists, keep it)
-- INSERT: only owners can insert new roles
CREATE POLICY "Owners can insert roles"
ON public.household_user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_household_role(household_id, auth.uid(), 'owner')
);

-- UPDATE: only owners can update roles
CREATE POLICY "Owners can update roles"
ON public.household_user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_household_role(household_id, auth.uid(), 'owner')
)
WITH CHECK (
  public.has_household_role(household_id, auth.uid(), 'owner')
);

-- DELETE: only owners can delete roles
CREATE POLICY "Owners can delete roles"
ON public.household_user_roles
FOR DELETE
TO authenticated
USING (
  public.has_household_role(household_id, auth.uid(), 'owner')
);

-- Also allow first member to create their own owner role (household creation)
CREATE POLICY "Users can create initial owner role"
ON public.household_user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'owner'
  AND NOT EXISTS (
    SELECT 1 FROM public.household_user_roles hr
    WHERE hr.household_id = household_user_roles.household_id
  )
);

-- ============================================================
-- FIX 2: household_members self-approve bypass
-- ============================================================

-- Drop the problematic user self-update policy
DROP POLICY IF EXISTS "Users can update their membership" ON public.household_members;

-- Recreate: users can only update their own display_name, NOT status
CREATE POLICY "Users can update their own display name"
ON public.household_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Drop and recreate INSERT policy to force pending status
DROP POLICY IF EXISTS "Users can create household memberships" ON public.household_members;

CREATE POLICY "Users can create household memberships"
ON public.household_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Allow owners to insert with approved status (for household creation)
CREATE POLICY "Owners can insert approved members"
ON public.household_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM public.household_members hm
    WHERE hm.household_id = household_members.household_id
  )
);

-- ============================================================
-- FIX 3: audit_log client-controlled INSERT
-- ============================================================

-- Drop the client-facing INSERT policy
DROP POLICY IF EXISTS "Users can insert audit log" ON public.audit_log;

-- Create a SECURITY DEFINER function for trusted audit logging
CREATE OR REPLACE FUNCTION public.log_audit_entry(
  _action text,
  _table_name text,
  _record_id uuid DEFAULT NULL,
  _old_values jsonb DEFAULT NULL,
  _new_values jsonb DEFAULT NULL,
  _household_id uuid DEFAULT NULL,
  _profile_id uuid DEFAULT NULL,
  _display_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate household_id: user must be a member
  IF _household_id IS NOT NULL AND NOT public.is_household_member(_household_id, _user_id) THEN
    RAISE EXCEPTION 'Not a member of this household';
  END IF;

  -- Validate action values
  IF _action NOT IN ('CREATE', 'UPDATE', 'DELETE') THEN
    RAISE EXCEPTION 'Invalid action type';
  END IF;

  INSERT INTO public.audit_log (
    user_id, action, table_name, record_id,
    old_values, new_values, household_id,
    profile_id, user_display_name
  ) VALUES (
    _user_id, _action, _table_name, _record_id,
    _old_values, _new_values, _household_id,
    _profile_id, _display_name
  );
END;
$$;
