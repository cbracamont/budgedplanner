-- Add frequency and type columns to income_sources table to support variable income with recurrence
ALTER TABLE public.income_sources 
ADD COLUMN IF NOT EXISTS frequency text DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'semi-annually', 'annually')),
ADD COLUMN IF NOT EXISTS income_type text DEFAULT 'fixed' CHECK (income_type IN ('fixed', 'variable'));