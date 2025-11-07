-- Create payment_tracker table to track monthly payments
CREATE TABLE IF NOT EXISTS public.payment_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID,
  month_year DATE NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('income', 'expense', 'debt', 'savings')),
  source_id UUID,
  source_table TEXT,
  amount NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_tracker ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own payment tracker"
ON public.payment_tracker FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment tracker"
ON public.payment_tracker FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment tracker"
ON public.payment_tracker FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment tracker"
ON public.payment_tracker FOR DELETE
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_payment_tracker_user_month ON public.payment_tracker(user_id, month_year);
CREATE INDEX idx_payment_tracker_source ON public.payment_tracker(source_id, source_table);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_payment_tracker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_payment_tracker_updated_at
BEFORE UPDATE ON public.payment_tracker
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_tracker_updated_at();