-- Add promotional APR fields to debts table
ALTER TABLE public.debts 
ADD COLUMN promotional_apr numeric,
ADD COLUMN promotional_apr_end_date date,
ADD COLUMN regular_apr numeric;

-- Add savings goal and emergency fund fields to savings table
ALTER TABLE public.savings
ADD COLUMN goal_name text,
ADD COLUMN goal_description text,
ADD COLUMN emergency_fund numeric DEFAULT 0;