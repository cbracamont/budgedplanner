-- Achievements: allow users to delete their own achievements
CREATE POLICY "Users can delete their own achievements"
ON public.achievements
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Savings: allow users to delete their own savings records
CREATE POLICY "Users can delete their own savings"
ON public.savings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Household members: prevent approved members from using the self-update policy
DROP POLICY IF EXISTS "Users can update their own display name" ON public.household_members;

CREATE POLICY "Users can update their own pending membership"
ON public.household_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');