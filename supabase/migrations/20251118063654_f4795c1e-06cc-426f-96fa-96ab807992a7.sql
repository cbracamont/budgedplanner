-- Fase 1: Agregar tabla de configuración de usuario para moneda
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fase 2: Tabla de invitaciones a hogares
CREATE TABLE IF NOT EXISTS public.household_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  invited_email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',
  status TEXT NOT NULL DEFAULT 'pending',
  invitation_code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(household_id, invited_email)
);

ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household owners can create invitations"
  ON public.household_invitations FOR INSERT
  WITH CHECK (public.is_household_owner(household_id, auth.uid()));

CREATE POLICY "Users can view invitations for their household"
  ON public.household_invitations FOR SELECT
  USING (
    public.is_household_owner(household_id, auth.uid()) OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email = invited_email
    )
  );

CREATE POLICY "Household owners can update invitations"
  ON public.household_invitations FOR UPDATE
  USING (public.is_household_owner(household_id, auth.uid()));

CREATE POLICY "Household owners can delete invitations"
  ON public.household_invitations FOR DELETE
  USING (public.is_household_owner(household_id, auth.uid()));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_household_invitations_updated_at
  BEFORE UPDATE ON public.household_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fase 3: Expandir roles (ya existe household_role enum, pero vamos a agregar más valores)
-- Primero necesitamos alterar el enum existente
ALTER TYPE household_role ADD VALUE IF NOT EXISTS 'viewer';
ALTER TYPE household_role ADD VALUE IF NOT EXISTS 'contributor';
ALTER TYPE household_role ADD VALUE IF NOT EXISTS 'editor';

-- Fase 4: Tabla de audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_display_name TEXT
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit log for their household"
  ON public.audit_log FOR SELECT
  USING (
    household_id IS NULL AND user_id = auth.uid() OR
    household_id IS NOT NULL AND public.is_household_member(household_id, auth.uid())
  );

CREATE POLICY "Users can insert audit log"
  ON public.audit_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_audit_log_household_id ON public.audit_log(household_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON public.audit_log(table_name, record_id);

-- Tabla de backups
CREATE TABLE IF NOT EXISTS public.household_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  backup_data JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.household_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household owners can create backups"
  ON public.household_backups FOR INSERT
  WITH CHECK (public.is_household_owner(household_id, auth.uid()));

CREATE POLICY "Household members can view backups"
  ON public.household_backups FOR SELECT
  USING (public.is_household_member(household_id, auth.uid()));

CREATE POLICY "Household owners can delete backups"
  ON public.household_backups FOR DELETE
  USING (public.is_household_owner(household_id, auth.uid()));

CREATE INDEX IF NOT EXISTS idx_household_backups_household_id ON public.household_backups(household_id);
CREATE INDEX IF NOT EXISTS idx_household_backups_created_at ON public.household_backups(created_at DESC);