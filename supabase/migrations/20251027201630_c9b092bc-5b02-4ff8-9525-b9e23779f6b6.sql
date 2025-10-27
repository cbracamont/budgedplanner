-- Create achievements table for gamification
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  profile_id uuid,
  achievement_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
ON public.achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own achievements"
ON public.achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create household_members table for family/multi-user mode
CREATE TABLE public.household_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  display_name text,
  invited_by uuid,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(household_id, user_id)
);

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view household members"
ON public.household_members FOR SELECT
USING (auth.uid() = user_id OR auth.uid() IN (
  SELECT user_id FROM public.household_members hm WHERE hm.household_id = household_members.household_id
));

CREATE POLICY "Users can create household memberships"
ON public.household_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their household memberships"
ON public.household_members FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their household memberships"
ON public.household_members FOR DELETE
USING (auth.uid() = user_id);

-- Create debt_risk_alerts table
CREATE TABLE public.debt_risk_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  profile_id uuid,
  alert_type text NOT NULL,
  risk_level text NOT NULL,
  debt_to_income_ratio numeric NOT NULL,
  message text NOT NULL,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.debt_risk_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
ON public.debt_risk_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
ON public.debt_risk_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
ON public.debt_risk_alerts FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at on household_members
CREATE TRIGGER update_household_members_updated_at
BEFORE UPDATE ON public.household_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add household_id to financial_profiles
ALTER TABLE public.financial_profiles
ADD COLUMN household_id uuid;

-- Create index for better performance
CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX idx_household_members_household_id ON public.household_members(household_id);
CREATE INDEX idx_household_members_user_id ON public.household_members(user_id);
CREATE INDEX idx_debt_risk_alerts_user_id ON public.debt_risk_alerts(user_id);
CREATE INDEX idx_financial_profiles_household_id ON public.financial_profiles(household_id);