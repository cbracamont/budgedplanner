CREATE OR REPLACE FUNCTION public.adjust_debt_balance_on_payment_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Payment moved to a different debt: restore the old debt, charge the new one
  IF OLD.debt_id IS DISTINCT FROM NEW.debt_id THEN
    UPDATE public.debts
      SET balance = balance + OLD.amount,
          updated_at = now()
    WHERE id = OLD.debt_id;

    UPDATE public.debts
      SET balance = GREATEST(0, balance - NEW.amount),
          updated_at = now()
    WHERE id = NEW.debt_id;

    RETURN NEW;
  END IF;

  -- Same debt, amount changed: apply only the delta
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    UPDATE public.debts
      SET balance = GREATEST(0, balance + OLD.amount - NEW.amount),
          updated_at = now()
    WHERE id = NEW.debt_id;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS adjust_debt_balance_after_payment_update ON public.debt_payments;

CREATE TRIGGER adjust_debt_balance_after_payment_update
AFTER UPDATE ON public.debt_payments
FOR EACH ROW
EXECUTE FUNCTION public.adjust_debt_balance_on_payment_update();