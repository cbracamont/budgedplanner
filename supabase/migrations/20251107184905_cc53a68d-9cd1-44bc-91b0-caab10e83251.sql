-- Add new frequency types to fixed_expenses
-- Update the frequency_type column to support quarterly and semiannual
ALTER TABLE fixed_expenses 
DROP CONSTRAINT IF EXISTS fixed_expenses_frequency_type_check;

-- Add check constraint for new frequency types
ALTER TABLE fixed_expenses 
ADD CONSTRAINT fixed_expenses_frequency_type_check 
CHECK (frequency_type IN ('monthly', 'quarterly', 'semiannual', 'annual'));