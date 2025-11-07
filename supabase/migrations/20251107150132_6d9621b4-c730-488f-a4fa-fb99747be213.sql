-- Create enum for household roles
CREATE TYPE public.household_role AS ENUM ('owner', 'member');

-- Create user_roles table for household roles
CREATE TABLE public.household_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role household_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (household_id, user_id)
);

-- Enable RLS on household_user_roles
ALTER TABLE public.household_user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for household_user_roles
CREATE POLICY "Users can view roles in their household"
  ON public.household_user_roles
  FOR SELECT
  USING (
    public.is_household_member(household_id, auth.uid())
  );

-- Only owners can insert/update/delete roles (we'll enforce this with a function)
CREATE POLICY "Owners can manage roles"
  ON public.household_user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_user_roles hur
      WHERE hur.household_id = household_user_roles.household_id
        AND hur.user_id = auth.uid()
        AND hur.role = 'owner'
    )
  );

-- Security definer function to check if user has specific household role
CREATE OR REPLACE FUNCTION public.has_household_role(_household_id UUID, _user_id UUID, _role household_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_user_roles
    WHERE household_id = _household_id
      AND user_id = _user_id
      AND role = _role
  )
$$;

-- Security definer function to check if user is household owner
CREATE OR REPLACE FUNCTION public.is_household_owner(_household_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_household_role(_household_id, _user_id, 'owner')
$$;

-- Migrate existing roles from household_members to household_user_roles
INSERT INTO public.household_user_roles (household_id, user_id, role, created_at)
SELECT 
  household_id,
  user_id,
  role::household_role,
  created_at
FROM public.household_members
WHERE status = 'approved'
ON CONFLICT (household_id, user_id) DO NOTHING;

-- Drop old policies that depend on the role column
DROP POLICY IF EXISTS "Owners can view pending requests" ON public.household_members;
DROP POLICY IF EXISTS "Owners can update member status" ON public.household_members;

-- Remove role column from household_members
ALTER TABLE public.household_members DROP COLUMN role;

-- Recreate policies using the new role checking functions
CREATE POLICY "Owners can view pending requests"
  ON public.household_members
  FOR SELECT
  USING (
    public.is_household_owner(household_id, auth.uid())
  );

CREATE POLICY "Owners can update member status"
  ON public.household_members
  FOR UPDATE
  USING (
    public.is_household_owner(household_id, auth.uid())
  );

-- Add trigger for updated_at on household_user_roles
CREATE TRIGGER update_household_user_roles_updated_at
  BEFORE UPDATE ON public.household_user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Prevent users from assigning themselves as owner (except during initial household creation)
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if user is already an owner of this household
  IF public.is_household_owner(NEW.household_id, auth.uid()) THEN
    RETURN NEW;
  END IF;
  
  -- Allow if this is the first member (household creation)
  IF NOT EXISTS (
    SELECT 1 FROM public.household_user_roles
    WHERE household_id = NEW.household_id
  ) THEN
    RETURN NEW;
  END IF;
  
  -- Prevent non-owners from setting owner role
  IF NEW.role = 'owner' AND NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Only household owners can assign owner role';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_role_escalation
  BEFORE INSERT OR UPDATE ON public.household_user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_escalation();