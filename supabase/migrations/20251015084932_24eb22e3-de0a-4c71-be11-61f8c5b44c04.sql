-- Create table for variable expenses categories
CREATE TABLE public.variable_expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.variable_expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories"
ON public.variable_expense_categories
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
ON public.variable_expense_categories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON public.variable_expense_categories
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON public.variable_expense_categories
FOR DELETE
USING (auth.uid() = user_id);

-- Create table for variable expenses
CREATE TABLE public.variable_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.variable_expense_categories(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.variable_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own variable expenses"
ON public.variable_expenses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own variable expenses"
ON public.variable_expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own variable expenses"
ON public.variable_expenses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own variable expenses"
ON public.variable_expenses
FOR DELETE
USING (auth.uid() = user_id);

-- Create table for savings
CREATE TABLE public.savings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  monthly_goal NUMERIC NOT NULL DEFAULT 0,
  total_accumulated NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own savings"
ON public.savings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own savings"
ON public.savings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own savings"
ON public.savings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create table for app settings (wallpaper)
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  wallpaper_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
ON public.app_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
ON public.app_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.app_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_variable_expense_categories_updated_at
BEFORE UPDATE ON public.variable_expense_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_variable_expenses_updated_at
BEFORE UPDATE ON public.variable_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_savings_updated_at
BEFORE UPDATE ON public.savings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();