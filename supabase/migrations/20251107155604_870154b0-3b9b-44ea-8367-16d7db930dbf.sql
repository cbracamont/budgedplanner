-- Fix Issue 1: Household Approval Bypass
-- Remove the overly permissive policy that allows users to update their own status
DROP POLICY IF EXISTS "Users can update their household memberships" ON public.household_members;

-- Create a new restricted policy that only allows display_name updates
CREATE POLICY "Users can update their display name"
ON public.household_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  status = (SELECT status FROM public.household_members WHERE id = household_members.id)
);

-- Fix Issue 2: Financial Data in localStorage
-- Create variable_income table to replace localStorage storage
CREATE TABLE IF NOT EXISTS public.variable_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_id uuid REFERENCES public.financial_profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  description text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on variable_income table
ALTER TABLE public.variable_income ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for variable_income
CREATE POLICY "Users can view their own variable income"
ON public.variable_income
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own variable income"
ON public.variable_income
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own variable income"
ON public.variable_income
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own variable income"
ON public.variable_income
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add trigger for updating updated_at timestamp
CREATE TRIGGER update_variable_income_updated_at
BEFORE UPDATE ON public.variable_income
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();