-- Add name column to variable_expenses table
ALTER TABLE public.variable_expenses
ADD COLUMN name text;

-- Make category_id nullable since we're removing the category system
ALTER TABLE public.variable_expenses
ALTER COLUMN category_id DROP NOT NULL;