-- Add frequency_type and payment_month to fixed_expenses for annual payments
ALTER TABLE public.fixed_expenses 
ADD COLUMN frequency_type text NOT NULL DEFAULT 'monthly' CHECK (frequency_type IN ('monthly', 'annual'));

ALTER TABLE public.fixed_expenses 
ADD COLUMN payment_month integer CHECK (payment_month IS NULL OR (payment_month >= 1 AND payment_month <= 12));

COMMENT ON COLUMN public.fixed_expenses.frequency_type IS 'Type of payment frequency: monthly or annual';
COMMENT ON COLUMN public.fixed_expenses.payment_month IS 'Month number (1-12) for annual payments, NULL for monthly';

-- Create savings_history table to track monthly savings
CREATE TABLE public.savings_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  month_year date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on savings_history
ALTER TABLE public.savings_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for savings_history
CREATE POLICY "Users can view their own savings history"
ON public.savings_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own savings history"
ON public.savings_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings history"
ON public.savings_history
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own savings history"
ON public.savings_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for savings_history updated_at
CREATE TRIGGER update_savings_history_updated_at
BEFORE UPDATE ON public.savings_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();