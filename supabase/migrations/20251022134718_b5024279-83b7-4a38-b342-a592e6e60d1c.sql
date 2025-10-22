-- Add monthly_contribution and is_active columns to savings_goals table
ALTER TABLE public.savings_goals 
ADD COLUMN monthly_contribution numeric DEFAULT 0,
ADD COLUMN is_active boolean DEFAULT false;