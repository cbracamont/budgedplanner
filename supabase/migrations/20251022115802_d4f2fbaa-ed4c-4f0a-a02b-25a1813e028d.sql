-- Add installment payment fields to debts table
ALTER TABLE public.debts 
ADD COLUMN total_amount numeric,
ADD COLUMN number_of_installments integer,
ADD COLUMN installment_amount numeric,
ADD COLUMN start_date date,
ADD COLUMN end_date date,
ADD COLUMN is_installment boolean DEFAULT false;

-- Add comment explaining the new fields
COMMENT ON COLUMN public.debts.is_installment IS 'Indicates if this is an installment payment debt';
COMMENT ON COLUMN public.debts.total_amount IS 'Total amount of the installment debt';
COMMENT ON COLUMN public.debts.number_of_installments IS 'Number of installments for the debt';
COMMENT ON COLUMN public.debts.installment_amount IS 'Amount per installment';
COMMENT ON COLUMN public.debts.start_date IS 'Start date of installment payments';
COMMENT ON COLUMN public.debts.end_date IS 'End date of installment payments';