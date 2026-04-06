
-- Create a SECURITY DEFINER function to handle invitation acceptance
-- This bypasses RLS safely by validating the invitation server-side
CREATE OR REPLACE FUNCTION public.accept_household_invitation(
  _invitation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_email text;
  _invitation record;
  _display_name text;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user email
  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;

  -- Get and validate invitation
  SELECT * INTO _invitation
  FROM public.household_invitations
  WHERE id = _invitation_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or already used invitation';
  END IF;

  -- Verify invitation is for this user
  IF _invitation.invited_email != _user_email THEN
    RAISE EXCEPTION 'This invitation is not for you';
  END IF;

  -- Verify not expired
  IF _invitation.expires_at < now() THEN
    RAISE EXCEPTION 'This invitation has expired';
  END IF;

  -- Check not already a member
  IF EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = _invitation.household_id AND user_id = _user_id
  ) THEN
    RAISE EXCEPTION 'You are already a member of this household';
  END IF;

  _display_name := split_part(_user_email, '@', 1);

  -- Create membership with approved status
  INSERT INTO public.household_members (household_id, user_id, display_name, status)
  VALUES (_invitation.household_id, _user_id, _display_name, 'approved');

  -- Create role
  INSERT INTO public.household_user_roles (household_id, user_id, role)
  VALUES (_invitation.household_id, _user_id, _invitation.role::household_role);

  -- Update invitation status
  UPDATE public.household_invitations
  SET status = 'accepted', updated_at = now()
  WHERE id = _invitation_id;
END;
$$;

-- Create a SECURITY DEFINER function to handle join-by-code
CREATE OR REPLACE FUNCTION public.join_household_by_code(
  _invitation_code text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _user_email text;
  _invitation record;
  _display_name text;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user email
  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;

  -- Find valid invitation by code
  SELECT * INTO _invitation
  FROM public.household_invitations
  WHERE invitation_code = _invitation_code
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation code';
  END IF;

  -- Verify not expired
  IF _invitation.expires_at < now() THEN
    RAISE EXCEPTION 'This invitation has expired';
  END IF;

  -- Check not already a member
  IF EXISTS (
    SELECT 1 FROM public.household_members
    WHERE household_id = _invitation.household_id AND user_id = _user_id
  ) THEN
    RAISE EXCEPTION 'You are already a member of this household';
  END IF;

  _display_name := split_part(_user_email, '@', 1);

  -- Create membership
  INSERT INTO public.household_members (household_id, user_id, display_name, status)
  VALUES (_invitation.household_id, _user_id, _display_name, 'approved');

  -- Create role
  INSERT INTO public.household_user_roles (household_id, user_id, role)
  VALUES (_invitation.household_id, _user_id, _invitation.role::household_role);

  -- Update invitation
  UPDATE public.household_invitations
  SET status = 'accepted', invited_email = COALESCE(_user_email, ''), updated_at = now()
  WHERE id = _invitation.id;
END;
$$;
