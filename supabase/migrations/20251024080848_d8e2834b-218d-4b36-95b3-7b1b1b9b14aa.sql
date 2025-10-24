-- Create debt_payments table for tracking debt payment history
CREATE TABLE public.debt_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  profile_id UUID,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for debt_payments
CREATE POLICY "Users can view their own debt payments" 
ON public.debt_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own debt payments" 
ON public.debt_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debt payments" 
ON public.debt_payments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debt payments" 
ON public.debt_payments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on debt_payments
CREATE TRIGGER update_debt_payments_updated_at
BEFORE UPDATE ON public.debt_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically update debt balance when payment is made
CREATE OR REPLACE FUNCTION public.update_debt_balance_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the debt balance by subtracting the payment amount
  UPDATE public.debts
  SET balance = GREATEST(0, balance - NEW.amount),
      updated_at = now()
  WHERE id = NEW.debt_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update debt balance after payment insertion
CREATE TRIGGER update_debt_balance_after_payment
AFTER INSERT ON public.debt_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_debt_balance_on_payment();

-- Create function to restore debt balance when payment is deleted
CREATE OR REPLACE FUNCTION public.restore_debt_balance_on_payment_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Restore the debt balance by adding back the payment amount
  UPDATE public.debts
  SET balance = balance + OLD.amount,
      updated_at = now()
  WHERE id = OLD.debt_id;
  
  RETURN OLD;
END;
$$;

-- Create trigger to restore debt balance after payment deletion
CREATE TRIGGER restore_debt_balance_after_payment_delete
AFTER DELETE ON public.debt_payments
FOR EACH ROW
EXECUTE FUNCTION public.restore_debt_balance_on_payment_delete();

-- Create index for better query performance
CREATE INDEX idx_debt_payments_debt_id ON public.debt_payments(debt_id);
CREATE INDEX idx_debt_payments_user_id ON public.debt_payments(user_id);
CREATE INDEX idx_debt_payments_payment_date ON public.debt_payments(payment_date DESC);