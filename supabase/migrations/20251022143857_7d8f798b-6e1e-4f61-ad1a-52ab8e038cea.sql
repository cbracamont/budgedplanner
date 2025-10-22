-- Add monthly_emergency_contribution to savings table
ALTER TABLE public.savings
ADD COLUMN IF NOT EXISTS monthly_emergency_contribution numeric DEFAULT 0;

-- Add category_names table for custom category names
CREATE TABLE IF NOT EXISTS public.category_names (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  category_key text NOT NULL,
  custom_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_key)
);

-- Enable RLS
ALTER TABLE public.category_names ENABLE ROW LEVEL SECURITY;

-- Create policies for category_names
CREATE POLICY "Users can view their own category names" 
ON public.category_names 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own category names" 
ON public.category_names 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category names" 
ON public.category_names 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category names" 
ON public.category_names 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for timestamps
CREATE TRIGGER update_category_names_updated_at
BEFORE UPDATE ON public.category_names
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();