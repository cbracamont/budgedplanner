-- Add date field to variable_expenses table for monthly tracking
ALTER TABLE public.variable_expenses
ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_variable_expenses_date 
ON public.variable_expenses(user_id, date);

-- Add index for profile-based queries
CREATE INDEX IF NOT EXISTS idx_variable_expenses_profile_date 
ON public.variable_expenses(profile_id, date) 
WHERE profile_id IS NOT NULL;