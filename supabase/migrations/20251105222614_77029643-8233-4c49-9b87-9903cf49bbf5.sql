-- Add day_of_week column to income_sources for weekly recurrence
ALTER TABLE public.income_sources 
ADD COLUMN IF NOT EXISTS day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6);

COMMENT ON COLUMN public.income_sources.day_of_week IS 'Day of week for weekly recurrence: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';