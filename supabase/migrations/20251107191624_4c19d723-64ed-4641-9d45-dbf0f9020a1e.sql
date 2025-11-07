-- Create trigger to update debt balance when payment is inserted
CREATE TRIGGER update_debt_balance_trigger
  AFTER INSERT ON public.debt_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_debt_balance_on_payment();

-- Create trigger to restore debt balance when payment is deleted
CREATE TRIGGER restore_debt_balance_trigger
  AFTER DELETE ON public.debt_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_debt_balance_on_payment_delete();