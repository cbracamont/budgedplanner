-- Create financial profiles table
CREATE TABLE public.financial_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profiles"
ON public.financial_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profiles"
ON public.financial_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
ON public.financial_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
ON public.financial_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Add profile_id to existing tables
ALTER TABLE public.income_sources ADD COLUMN profile_id UUID REFERENCES public.financial_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.debts ADD COLUMN profile_id UUID REFERENCES public.financial_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.fixed_expenses ADD COLUMN profile_id UUID REFERENCES public.financial_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.variable_expenses ADD COLUMN profile_id UUID REFERENCES public.financial_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.savings ADD COLUMN profile_id UUID REFERENCES public.financial_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.savings_goals ADD COLUMN profile_id UUID REFERENCES public.financial_profiles(id) ON DELETE CASCADE;

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.financial_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'payment_reminder',
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  related_table TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_financial_profiles_updated_at
BEFORE UPDATE ON public.financial_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();