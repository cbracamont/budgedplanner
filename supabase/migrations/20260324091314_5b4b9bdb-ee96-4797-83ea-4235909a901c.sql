
-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view invitations for their household" ON public.household_invitations;

-- Create tighter SELECT policy: owners see all, invited users see only their own pending & non-expired invitations
CREATE POLICY "Users can view invitations for their household"
ON public.household_invitations
FOR SELECT
TO public
USING (
  is_household_owner(household_id, auth.uid())
  OR (
    status = 'pending'
    AND expires_at > now()
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE users.id = auth.uid()
        AND (users.email)::text = household_invitations.invited_email
    )
  )
);
